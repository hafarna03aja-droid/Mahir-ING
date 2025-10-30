import React, { useState, FC } from 'react';
import { getGroundedAnswer } from '../services/geminiService';
import { GroundingChunk } from '@google/genai';
import { GlobeIcon, LinkIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const CulturalQA: FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { language, t } = useLanguage();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError(t('errorQuestionRequired'));
      return;
    }
    setError('');
    setIsLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const response = await getGroundedAnswer(question, language);
      setAnswer(response.text);
      setSources(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (e) {
      setError(t('errorFetching'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    // Fungsi sederhana untuk mengubah Markdown dasar (tebal/miring) menjadi HTML.
    // Class 'prose' akan menangani tipografi secara keseluruhan.
    // Kita menggunakan 'whitespace-pre-wrap' sehingga tidak perlu mengubah baris baru menjadi <br>.
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-4">
        <GlobeIcon className="w-8 h-8 text-teal-400 mr-3"/>
        <div>
            <h2 className="text-2xl font-bold text-teal-400">{t('culturalQATitle')}</h2>
            <p className="text-slate-400">{t('culturalQADescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('qaInputPlaceholder')}
          className="flex-grow p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="flex justify-center items-center px-4 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed min-w-[130px]">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('searching')}</span>
            </>
          ) : t('ask')}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      
      {isLoading && (
         <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <svg className="animate-spin h-8 w-8 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <p className="text-slate-400">{t('searchingWeb')}</p>
            </div>
        </div>
      )}

      {answer && !isLoading && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-teal-400 mb-2">{t('answer')}</h3>
              <div 
                className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }} 
              />
          </div>
          {sources.length > 0 && (
             <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-teal-400 mb-2">{t('sources')}</h3>
                <ul className="space-y-2">
                    {sources.map((source, index) => (
                       source.web && (
                        <li key={index}>
                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-sky-400 hover:text-sky-300 hover:underline">
                               <LinkIcon className="w-4 h-4 mr-2" /> {source.web.title || source.web.uri}
                            </a>
                        </li>
                       )
                    ))}
                </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CulturalQA;
