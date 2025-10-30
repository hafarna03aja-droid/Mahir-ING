import React, { useState, useEffect, useRef, FC } from 'react';
import { Chat } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import { ChatIcon, UserIcon, SparklesIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const TutorBot: FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    const initChat = () => {
      const chatSession = createChatSession(language);
      setChat(chatSession);
      setMessages([{ sender: 'bot', text: t('initialBotMessage') }]);
    };
    initChat();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: input });
      let botResponse = '';
      setMessages(prev => [...prev, { sender: 'bot', text: '' }]);
      
      for await (const chunk of stream) {
        botResponse += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length-1].text = botResponse;
            return newMessages;
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: t('errorBotMessage') }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMarkdown = (text: string) => {
    // Handle lists, bold, and italics
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\s*[-*]\s+(.*)/gm, '<li>$1</li>')
      .replace(/(\<\/li\>)\s*(\<li\>)/g, '$1$2'); // Join adjacent list items
      
    // Wrap list items in <ul>
    if (/<li>/.test(html)) {
      html = `<ul>${html.match(/(<li>.*?<\/li>)/g)?.join('')}</ul>` + html.replace(/(<li>.*?<\/li>)/g, '');
    }

    return html.replace(/\n/g, '<br />'); // Preserve newlines that are not part of lists
  };


  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-shrink-0 flex items-center mb-4">
        <ChatIcon className="w-8 h-8 text-indigo-400 mr-3"/>
        <div>
            <h2 className="text-2xl font-bold text-indigo-400">{t('tutorBotTitle')}</h2>
            <p className="text-slate-400">{t('tutorBotDescription')}</p>
        </div>
      </div>

      <div className="flex-grow bg-slate-900/50 rounded-lg p-4 overflow-y-auto mb-4 min-h-0">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><SparklesIcon className="w-5 h-5 text-white"/></div>}
                <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                   {msg.sender === 'bot' ? (
                        <div 
                           className="prose prose-invert prose-sm max-w-none text-slate-300"
                           dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) + (isLoading && index === messages.length - 1 ? '<span class="inline-block animate-pulse">...</span>' : '') }}
                        />
                   ) : (
                        <p className="text-sm">{msg.text}</p>
                   )}
                </div>
                {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white"/></div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="flex-shrink-0 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">
          {t('send')}
        </button>
      </form>
    </div>
  );
};

export default TutorBot;
