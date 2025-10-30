import React, { useState, useEffect, FC, useRef } from 'react';
import { getTTSAudio } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';
import { ClipboardListIcon, VolumeUpIcon, PlayIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PhraseItem {
  phrase: string;
  translation: {
    id: string;
    en: string;
  };
}

const commonPhrasesList: PhraseItem[] = [
  { phrase: "How's it going?", translation: { id: 'Apa kabar? (informal)', en: 'How are you? (informal)' } },
  { phrase: "What have you been up to?", translation: { id: 'Apa saja kesibukanmu akhir-akhir ini?', en: 'What have you been doing recently?' } },
  { phrase: "It's nice to meet you.", translation: { id: 'Senang bertemu dengan Anda.', en: 'A polite greeting when meeting someone for the first time.' } },
  { phrase: "Long time no see!", translation: { id: 'Lama tidak bertemu!', en: 'Said when you meet someone you haven\'t seen in a while.' } },
  { phrase: "Could you repeat that, please?", translation: { id: 'Bisakah Anda mengulanginya?', en: 'A polite way to ask someone to say something again.' } },
  { phrase: "I'm sorry, I don't understand.", translation: { id: 'Maaf, saya tidak mengerti.', en: 'Used when you cannot comprehend what someone said.' } },
  { phrase: "What do you think?", translation: { id: 'Bagaimana menurutmu?', en: 'Asking for someone\'s opinion.' } },
  { phrase: "That's a good point.", translation: { id: 'Itu ide yang bagus.', en: 'Agreeing with someone\'s idea or opinion.' } },
  { phrase: "I really appreciate it.", translation: { id: 'Saya sangat menghargainya.', en: 'A sincere way to say thank you.' } },
  { phrase: "Could you give me a hand?", translation: { id: 'Bisakah Anda membantu saya?', en: 'Can you help me?' } },
  { phrase: "Can I ask you a favor?", translation: { id: 'Bolehkah saya minta tolong?', en: 'A polite way to ask for help.' } },
  { phrase: "I'll be right there.", translation: { id: 'Saya akan segera ke sana.', en: 'I will be there soon.' } },
  { phrase: "I'm running a bit late.", translation: { id: 'Sepertinya saya akan sedikit terlambat.', en: 'I will be slightly late.' } },
  { phrase: "Let's catch up soon.", translation: { id: 'Ayo kita bertemu/mengobrol lagi nanti.', en: 'Let\'s meet/talk again soon.' } },
  { phrase: "No worries.", translation: { id: 'Tidak masalah / Jangan khawatir.', en: 'No problem / Don\'t worry.' } },
  { phrase: "That makes sense.", translation: { id: 'Itu masuk akal.', en: 'That is logical or understandable.' } },
  { phrase: "Never mind.", translation: { id: 'Lupakan saja / Tidak apa-apa.', en: 'Forget it / It\'s okay.' } },
  { phrase: "What do you do for a living?", translation: { id: 'Apa pekerjaanmu?', en: 'What is your job?' } },
  { phrase: "Take care.", translation: { id: 'Jaga diri.', en: 'A common way to say goodbye.' } },
  { phrase: "Have a good one!", translation: { id: 'Semoga harimu menyenangkan! (informal)', en: 'Have a good day! (informal)' } },
  { phrase: 'How do you spell that?', translation: { id: 'Bagaimana cara mengejanya?', en: 'Asking for the spelling of a word.' } },
  { phrase: 'What does this mean?', translation: { id: 'Apa artinya ini?', en: 'Asking for the meaning of something.' } },
  { phrase: 'Could you speak a little slower?', translation: { id: 'Bisakah Anda berbicara lebih pelan?', en: 'A polite request to speak more slowly.' } },
  { phrase: "I'm looking forward to it.", translation: { id: 'Saya tidak sabar menantinya.', en: 'I am excited about a future event.' } },
  { phrase: 'It was nice chatting with you.', translation: { id: 'Senang mengobrol dengan Anda.', en: 'A polite way to end a conversation.' } },
  { phrase: 'What do you mean?', translation: { id: 'Apa maksudmu?', en: 'Asking for clarification.' } },
  { phrase: "I'm just browsing.", translation: { id: 'Saya hanya melihat-lihat. (saat berbelanja)', en: 'I am just looking around. (when shopping)' } },
  { phrase: 'How much does this cost?', translation: { id: 'Berapa harga ini?', en: 'What is the price of this?' } },
  { phrase: "I'll take it.", translation: { id: 'Saya beli yang ini.', en: 'I will buy this.' } },
  { phrase: 'Do you have any recommendations?', translation: { id: 'Apakah Anda punya rekomendasi?', en: 'Do you have any suggestions?' } },
  { phrase: "I'm on my way.", translation: { id: 'Saya sedang dalam perjalanan.', en: 'I am en route.' } },
  { phrase: "What's the weather like?", translation: { id: 'Seperti apa cuacanya?', en: 'How is the weather?' } },
  { phrase: "You can say that again!", translation: { id: 'Saya sangat setuju denganmu!', en: 'I strongly agree with you!' } },
  { phrase: "I couldn't agree more.", translation: { id: 'Saya sangat setuju.', en: 'I completely agree.' } },
  { phrase: "It's on the tip of my tongue.", translation: { id: 'Sudah di ujung lidah (hampir teringat).', en: 'I can almost remember it.' } },
  { phrase: "To make a long story short...", translation: { id: 'Singkatnya...', en: 'In summary...' } },
  { phrase: "Get well soon.", translation: { id: 'Semoga lekas sembuh.', en: 'Wishing you a speedy recovery from illness.' } },
  { phrase: "So far, so good.", translation: { id: 'Sejauh ini baik-baik saja.', en: 'Everything is going well up to this point.' } },
  { phrase: "I'm starving.", translation: { id: 'Saya sangat lapar.', en: 'I am very hungry.' } },
  { phrase: "What's the catch?", translation: { id: 'Apa ada udang di balik batu? (apa syaratnya?)', en: 'What is the hidden condition or drawback?' } },
  { phrase: "Sleep on it.", translation: { id: 'Pikirkan dulu semalaman.', en: 'Think about it overnight before deciding.' } },
  { phrase: "It's up to you.", translation: { id: 'Terserah kamu.', en: 'It is your decision.' } },
  { phrase: "Let's agree to disagree.", translation: { id: 'Mari kita setuju untuk tidak setuju.', en: 'Let\'s accept that we have different opinions.' } },
  { phrase: "My bad.", translation: { id: 'Salah saya. (informal)', en: 'My mistake. (informal)' } },
  { phrase: "Can't complain.", translation: { id: 'Baik-baik saja / Tidak ada yang perlu dikeluhkan.', en: 'I am doing well / Nothing to complain about.' } },
  { phrase: "It is what it is.", translation: { id: 'Apa boleh buat / Terima saja keadaannya.', en: 'Accept the situation as it is.' } },
  { phrase: "Keep me posted.", translation: { id: 'Kabari saya perkembangannya.', en: 'Keep me updated on the progress.' } },
  { phrase: "I'll get back to you on that.", translation: { id: 'Saya akan memberitahu Anda nanti.', en: 'I will inform you later about that.' } },
  { phrase: "Sounds good.", translation: { id: 'Kedengarannya bagus / Setuju.', en: 'That sounds like a good idea / I agree.' } },
  { phrase: "Not really.", translation: { id: 'Tidak juga.', en: 'A mild way to say no.' } },
  { phrase: "I'm not sure.", translation: { id: 'Saya tidak yakin.', en: 'I am uncertain.' } },
  { phrase: "Let's play it by ear.", translation: { id: 'Kita lihat saja nanti (tidak perlu rencana pasti).', en: 'Let\'s decide as we go (no fixed plan).' } },
  { phrase: "It's a small world.", translation: { id: 'Dunia ini sempit ya.', en: 'Said when you unexpectedly meet someone you know.' } },
  { phrase: "You bet!", translation: { id: 'Tentu saja! (dengan antusias)', en: 'Absolutely! (enthusiastic)' } },
  { phrase: "I'm beat.", translation: { id: 'Saya sangat lelah.', en: 'I am very tired.' } },
  { phrase: "Good for you!", translation: { id: 'Baguslah untukmu! (pujian)', en: 'That\'s great for you! (praise)' } },
  { phrase: "I'm just kidding.", translation: { id: 'Saya hanya bercanda.', en: 'I am only joking.' } },
  { phrase: "It slipped my mind.", translation: { id: 'Saya lupa.', en: 'I forgot.' } },
  { phrase: "What's up?", translation: { id: 'Ada apa? / Apa kabar? (sangat informal)', en: 'What\'s new? / How are you? (very informal)' } },
  { phrase: "Take it easy.", translation: { id: 'Santai saja.', en: 'Relax.' } },
  { phrase: "I'm off.", translation: { id: 'Saya pergi dulu.', en: 'I am leaving now.' } },
  { phrase: "Are you for real?", translation: { id: 'Apakah kamu serius?', en: 'Are you serious?' } },
  { phrase: "I'll have to pass.", translation: { id: 'Maaf, saya tidak bisa ikut.', en: 'Sorry, I cannot participate.' } },
  { phrase: "It's not my cup of tea.", translation: { id: 'Itu bukan selera saya.', en: 'It is not something I enjoy.' } },
  { phrase: "Let's get down to business.", translation: { id: 'Mari kita mulai bekerja/membahas hal penting.', en: 'Let\'s start working/discussing important matters.' } },
  { phrase: "Make yourself at home.", translation: { id: 'Anggap saja seperti di rumah sendiri.', en: 'Be comfortable as if you were in your own home.' } },
  { phrase: "The more, the merrier.", translation: { id: 'Makin ramai, makin seru.', en: 'The more people there are, the more fun it will be.' } },
  { phrase: "Time flies when you're having fun.", translation: { id: 'Waktu berlalu begitu cepat saat bersenang-senang.', en: 'Time passes quickly when you are enjoying yourself.' } },
  { phrase: "I'm all ears.", translation: { id: 'Saya mendengarkan dengan saksama.', en: 'I am listening attentively.' } },
  { phrase: "What are you up to?", translation: { id: 'Apa yang sedang kamu lakukan? (informal)', en: 'What are you doing? (informal)' } },
  { phrase: "I owe you one.", translation: { id: 'Saya berhutang budi padamu.', en: 'I am indebted to you for your help.' } },
  { phrase: "Fingers crossed.", translation: { id: 'Semoga berhasil.', en: 'Hoping for good luck.' } },
  { phrase: "I'm feeling under the weather.", translation: { id: 'Saya merasa tidak enak badan.', en: 'I am feeling unwell.' } },
  { phrase: "Could you do me a solid?", translation: { id: 'Bisakah kamu membantuku? (sangat informal)', en: 'Can you do me a big favor? (very informal)' } },
  { phrase: "That's lit!", translation: { id: 'Itu keren sekali! (slang)', en: 'That is really cool! (slang)' } },
  { phrase: "No cap.", translation: { id: 'Serius / Tidak bohong. (slang)', en: 'For real / Not lying. (slang)' } },
  { phrase: "Let's touch base later.", translation: { id: 'Mari kita bicara lagi nanti untuk update.', en: 'Let\'s talk again later for an update.' } },
];

const CommonPhrases: FC = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState<string | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setAudioContext(ctx);
    return () => {
      sourceRef.current?.stop();
      ctx.close();
    };
  }, []);

  const playAudio = async (phrase: string) => {
    if (!audioContext) return;

    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setPlayingPhrase(null);

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    setLoadingPhrase(phrase);

    try {
      const base64Audio = await getTTSAudio(phrase);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        sourceRef.current = source;
        setPlayingPhrase(phrase);

        source.onended = () => {
          if (sourceRef.current === source) {
            setPlayingPhrase(null);
            sourceRef.current = null;
          }
        };
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingPhrase(null);
      if (sourceRef.current) {
        sourceRef.current = null;
      }
    } finally {
        setLoadingPhrase(current => (current === phrase ? null : current));
    }
  };

  return (
     <div className="bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <ClipboardListIcon className="w-8 h-8 text-lime-400 mr-3"/>
        <div>
            <h2 className="text-2xl font-bold text-lime-400">{t('commonPhrasesTitle')}</h2>
            <p className="text-slate-400">{t('commonPhrasesDescription')}</p>
        </div>
      </div>
      <div className="space-y-3 h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {commonPhrasesList.map((item) => (
          <div key={item.phrase} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg">
            <div>
              <p className="font-semibold text-white">{item.phrase}</p>
              <p className="text-sm text-slate-400">{item.translation[language]}</p>
            </div>
            <button
              onClick={() => playAudio(item.phrase)}
              disabled={loadingPhrase === item.phrase}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 hover:bg-lime-500 text-slate-300 hover:text-white transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              aria-label={t('playPronunciation', item.phrase)}
            >
              {loadingPhrase === item.phrase ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : playingPhrase === item.phrase ? (
                <VolumeUpIcon className="w-5 h-5"/>
              ) : (
                <PlayIcon className="w-5 h-5"/>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommonPhrases;
