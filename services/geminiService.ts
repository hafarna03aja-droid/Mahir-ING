import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality } from '@google/genai';

// Get API key from environment variables
// @ts-ignore
const API_KEY = import.meta.env?.VITE_API_KEY || 
                process.env.VITE_API_KEY || 
                process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY environment variable not set");
    throw new Error("API_KEY environment variable not set. Please set VITE_API_KEY in your .env file or Vercel environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getGroundedAnswer = async (prompt: string, lang: 'id' | 'en'): Promise<GenerateContentResponse> => {
    const langInstruction = lang === 'id' 
        ? 'Jawab pertanyaan berikut dalam Bahasa Indonesia' 
        : 'Answer the following question in English';

    const fullPrompt = `${langInstruction} dan format jawabannya sebagai markdown (gunakan **bold** dan *italic* jika perlu): "${prompt}"`;
    return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
};

export const analyzeText = async (text: string): Promise<string> => {
    const prompt = `You are an expert English grammar and style coach. Analyze the following text and provide constructive feedback. Focus on clarity, tone, grammar, and suggest improvements to make it sound more natural for everyday conversation. Format your response clearly. Text to analyze: "${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text;
};

export const createChatSession = (lang: 'id' | 'en'): Chat => {
    const systemInstruction = lang === 'id'
      ? 'Anda adalah tutor bahasa Inggris yang ramah dan membantu. Jaga agar jawaban Anda ringkas dan mudah dipahami oleh pembelajar bahasa. Gunakan format Markdown (seperti **tebal** untuk istilah penting, *miring* untuk penekanan, dan daftar berpoin untuk contoh) untuk membuat penjelasan Anda jelas dan mudah dibaca.'
      : 'You are a friendly and helpful English language tutor. Keep your answers concise and easy for a language learner to understand. Use Markdown formatting (like **bold** for key terms, *italics* for emphasis, and bulleted lists for examples) to make your explanations clear and readable.';
    
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction,
        },
    });
};

export const getTTSAudio = async (text: string): Promise<string | undefined> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};


export const connectToLiveSession = async (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}, systemInstruction: string) => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
        },
    });
};
