import React, { useState, FC } from 'react';
import { analyzeText } from '../services/geminiService';
import { CheckCircleIcon, SparklesIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const GrammarCoach: FC = () => {
  const [text, setText] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { t } = useLanguage();

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError(t('errorInputRequired'));
      return;
    }
    setError('');
    setIsLoading(true);
    setFeedback('');
    try {
      const result = await analyzeText(text);
      setFeedback(result);
    } catch (e) {
      setError(t('errorAnalyzing'));
      console.error(e);
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
    <div className="bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-4">
        <CheckCircleIcon className="w-8 h-8 text-green-400 mr-3"/>
        <div>
            <h2 className="text-2xl font-bold text-green-400">{t('grammarCoachTitle')}</h2>
            <p className="text-slate-400">{t('grammarCoachDescription')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('textAreaPlaceholder')}
          className="w-full h-40 p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-shadow"
          disabled={isLoading}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('analyzing')}
            </>
          ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                {t('analyzeText')}
              </>
          )}
        </button>
      </div>

      {feedback && (
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-green-400 mb-2">{t('feedback')}</h3>
            <div 
              className="prose prose-invert prose-sm max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(feedback) }}
            />
        </div>
      )}
    </div>
  );
};

export default GrammarCoach;
