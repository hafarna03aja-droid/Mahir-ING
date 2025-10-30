import React, { useState, useRef, useEffect, FC } from 'react';
import { LiveServerMessage, LiveSession, Blob } from '@google/genai';
import { connectToLiveSession } from '../services/geminiService';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { MicrophoneIcon, StopIcon, VolumeUpIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface TranscriptItem {
  speaker: 'Anda' | 'AI';
  text: string;
}

const ConversationPractice: FC = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isWordPracticeMode, setIsWordPracticeMode] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const { language, t } = useLanguage();

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    setStatus(t('statusChooseMode'));
  }, [t]);

  const stopSession = async () => {
    if (!sessionPromiseRef.current) return;
    
    setIsSessionActive(false);
    setStatus(t('statusPracticeEnded'));

    try {
        const session = await sessionPromiseRef.current;
        session.close();
    } catch (error) {
        console.error("Error closing session:", error);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      await outputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    sessionPromiseRef.current = null;
  };

  const startSession = async () => {
    setTranscript([]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setStatus(t('statusConnecting'));

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsSessionActive(true);
      setStatus(t('statusConnected'));

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const callbacks = {
        onopen: () => {
          if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
          const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
          scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            const pcmBlob: Blob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
            }
          };
          source.connect(scriptProcessorRef.current);
          scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
          }
          if (message.serverContent?.inputTranscription) {
            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
          }
          if (message.serverContent?.turnComplete) {
            const userTurn = currentInputTranscriptionRef.current.trim();
            const aiTurn = currentOutputTranscriptionRef.current.trim();
            setTranscript(prev => {
              const newTranscript = [...prev];
              if(userTurn) newTranscript.push({ speaker: 'Anda', text: userTurn });
              if(aiTurn) newTranscript.push({ speaker: 'AI', text: aiTurn });
              return newTranscript;
            });
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
          }

          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && outputAudioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);
            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(source => source.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error("Session error:", e);
          setStatus(t('statusError', e.message));
          stopSession();
        },
        onclose: (e: CloseEvent) => {
          console.log("Session closed.");
          if(isSessionActive) {
            stopSession();
          }
        },
      };

      const systemInstruction = isWordPracticeMode
        ? (language === 'id' 
            ? 'Anda adalah seorang pelatih pengucapan bahasa Inggris. Fokus pada pengucapan, intonasi, dan penggunaan kata yang benar oleh pengguna. Berikan koreksi yang jelas dan ringkas. Minta pengguna untuk mengulangi kata atau frasa jika mereka salah mengucapkannya. Jaga agar giliran bicara Anda singkat dan fokus pada latihan kata.' 
            : 'You are an English pronunciation coach. Focus on the user\'s pronunciation, intonation, and correct word usage. Provide clear and concise corrections. Ask the user to repeat words or phrases if they mispronounce them. Keep your turns short and focused on word practice.')
        : (language === 'id' 
            ? 'Peran Anda adalah sebagai tutor bahasa Inggris yang sangat ramah, sabar, dan interaktif dari Indonesia. **Gunakan Bahasa Indonesia SEPENUHNYA** untuk semua interaksi Anda: sapaan, penjelasan, umpan balik, dan koreksi. Tugas Anda adalah memandu pengguna dalam percakapan bahasa Inggris. Alur kerjanya seperti ini: 1. Sapa pengguna dengan hangat dalam Bahasa Indonesia. 2. Ajukan pertanyaan pembuka yang mudah dalam **bahasa Inggris**. 3. Dengarkan jawaban pengguna. 4. Berikan umpan balik yang positif dan membangun dalam **Bahasa Indonesia**. Jika ada kesalahan, berikan koreksi dengan lembut. 5. Ajukan pertanyaan lanjutan dalam **bahasa Inggris** untuk menjaga agar percakapan tetap mengalir. Buat suasana belajar menjadi santai dan menyenangkan.' 
            : 'Your role is a very friendly, patient, and interactive English tutor. **Use English ONLY** for all your interactions: greetings, explanations, feedback, and corrections. Your task is to guide the user in an English conversation. The workflow is as follows: 1. Greet the user warmly. 2. Ask an easy opening question in English. 3. Listen to the user\'s response. 4. Provide positive and constructive feedback. If there are mistakes, correct them gently. 5. Ask a follow-up question to keep the conversation flowing. Make the learning atmosphere relaxed and fun.');

      sessionPromiseRef.current = connectToLiveSession(callbacks, systemInstruction);

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus(t('statusMicError'));
      setIsSessionActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-shrink-0 mb-4">
            <h2 className="text-2xl font-bold text-sky-400">{t('realtimeConversation')}</h2>
            <p className="text-slate-400">
                {isWordPracticeMode
                    ? t('wordPracticeModeDesc')
                    : t('conversationModeDesc')}
            </p>
        </div>
        
        <div className="flex-grow bg-slate-900/50 rounded-lg p-4 overflow-y-auto mb-4 min-h-0">
            <div className="space-y-4">
                {transcript.length === 0 && <p className="text-slate-500 text-center">{status}</p>}
                {transcript.map((item, index) => (
                    <div key={index} className={`flex items-start gap-3 ${item.speaker === 'Anda' ? 'justify-end' : ''}`}>
                        {item.speaker === 'AI' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center"><VolumeUpIcon className="w-5 h-5 text-white"/></div>}
                        <div className={`max-w-md p-3 rounded-xl ${item.speaker === 'Anda' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                           <p className="text-sm">{item.text}</p>
                        </div>
                         {item.speaker === 'Anda' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><p className="font-bold text-sm">{t('you')}</p></div>}
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex-shrink-0 flex flex-col items-center justify-center space-y-4">
            {!isSessionActive && (
                <div className="flex items-center space-x-2 p-1 bg-slate-900/50 rounded-full">
                    <button
                        onClick={() => setIsWordPracticeMode(false)}
                        className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${!isWordPracticeMode ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        aria-pressed={!isWordPracticeMode}
                    >
                        {t('conversation')}
                    </button>
                    <button
                        onClick={() => setIsWordPracticeMode(true)}
                        className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${isWordPracticeMode ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        aria-pressed={isWordPracticeMode}
                    >
                        {t('wordPractice')}
                    </button>
                </div>
            )}
            
            <div className="flex items-center justify-center">
                {!isSessionActive ? (
                    <button onClick={startSession} className="flex items-center justify-center px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300">
                        <MicrophoneIcon className="w-6 h-6 mr-2" /> {t('startPractice')}
                    </button>
                ) : (
                    <button onClick={stopSession} className="flex items-center justify-center px-6 py-3 bg-red-500 text-white font-semibold rounded-full shadow-lg hover:bg-red-600 transition-colors duration-300">
                        <StopIcon className="w-6 h-6 mr-2" /> {t('stopPractice')}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default ConversationPractice;
