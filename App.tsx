import React, { useState, FC, SVGProps } from 'react';
import ConversationPractice from './components/ConversationPractice';
import GrammarCoach from './components/GrammarCoach';
import TutorBot from './components/TutorBot';
import CulturalQA from './components/CulturalQA';
import Vocabulary from './components/Vocabulary';
import CommonPhrases from './components/CommonPhrases';
import { ChatIcon, CheckCircleIcon, GlobeIcon, MicrophoneIcon, SparklesIcon, BookOpenIcon, MenuIcon, XIcon, ClipboardListIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';

type Feature = 'conversation' | 'grammar' | 'bot' | 'qa' | 'vocabulary' | 'phrases';

const App: FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('conversation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const features: { id: Feature; name: string; icon: FC<SVGProps<SVGSVGElement>>; description: string }[] = [
    { id: 'conversation', name: t('conversationPractice'), icon: MicrophoneIcon, description: 'Bicara dengan AI secara real-time.' },
    { id: 'bot', name: t('tutorBot'), icon: ChatIcon, description: 'Ajukan pertanyaan dan dapatkan jawaban.' },
    { id: 'grammar', name: t('grammarCoach'), icon: CheckCircleIcon, description: 'Tingkatkan gaya tulisan Anda.' },
    { id: 'qa', name: t('culturalQA'), icon: GlobeIcon, description: 'Dapatkan info budaya terkini.' },
    { id: 'vocabulary', name: t('vocabularyBuilder'), icon: BookOpenIcon, description: 'Pelajari kata dan frasa baru.' },
    { id: 'phrases', name: t('commonPhrases'), icon: ClipboardListIcon, description: 'Pelajari frasa yang sering digunakan.' },
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'conversation':
        return <ConversationPractice />;
      case 'grammar':
        return <GrammarCoach />;
      case 'bot':
        return <TutorBot />;
      case 'qa':
        return <CulturalQA />;
      case 'vocabulary':
        return <Vocabulary />;
      case 'phrases':
        return <CommonPhrases />;
      default:
        return <ConversationPractice />;
    }
  };

  const NavLink: FC<{ feature: typeof features[0]; isActive: boolean; onClick: () => void }> = ({ feature, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-sky-500 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <feature.icon className="w-5 h-5 mr-3" />
      <span>{feature.name}</span>
    </button>
  );

  const navContent = (
      <>
        <nav className="flex flex-col p-4 space-y-2 grow">
          {features.map((feature) => (
            <NavLink
              key={feature.id}
              feature={feature}
              isActive={activeFeature === feature.id}
              onClick={() => {
                setActiveFeature(feature.id);
                setIsMenuOpen(false);
              }}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">{t('language')}</p>
          <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-lg">
            <button 
              onClick={() => setLanguage('id')} 
              className={`w-full text-center px-3 py-1 text-sm rounded-md transition-colors ${language === 'id' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              ID
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className={`w-full text-center px-3 py-1 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              EN
            </button>
          </div>
        </div>
      </>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Mobile Menu Button */}
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-slate-800/50 backdrop-blur-sm">
        {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
      </button>
      
      {/* Sidebar Navigation */}
       <aside className={`fixed lg:relative z-20 w-64 h-full bg-slate-800 border-r border-slate-700/50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex-shrink-0 flex items-center justify-center h-20 border-b border-slate-700/50">
          <SparklesIcon className="w-8 h-8 text-sky-400" />
          <h1 className="ml-2 text-2xl font-bold text-white">{t('fluentifyAI')}</h1>
        </div>
        <div className="flex-grow flex flex-col overflow-y-auto">
         {navContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {renderFeature()}
        </div>
        <footer className="text-center pt-8 pb-4 text-sm text-slate-500">
          {t('footerText')}
        </footer>
      </main>
    </div>
  );
};

export default App;
