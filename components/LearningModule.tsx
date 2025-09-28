import React, { useState, useEffect, useCallback, FormEvent, useRef, useMemo } from 'react';
import type { Chat } from '@google/genai';
import type { Language, LearningMode, LearningContent, GrammarContent, VocabularyContent, ListeningContent, SpeakingContent, QuizContent, AnyQuizQuestion, QuizType, MatchItem, PictureMCQQuestion, VisualContextContent, Tone, StoryboardContent, SituationalPracticeInitContent, SituationalPracticeResponseContent, RolePlaySetupContent, RolePlayScenario, ChatMessage, AIFeedback, LanguageDetails, Difficulty, WordByWord } from '../types';
import { generateLearningContent, generateQuizExplanation, generateSituationalResponse, createChatSession, sendChatMessage } from '../services/geminiService';
import Spinner from './ui/Spinner';
import Button from './ui/Button';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import RefreshIcon from './icons/RefreshIcon';
import SpeakerIcon from './icons/SpeakerIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ChatMessageBubble from './ChatMessageBubble';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type QuizAnswer = string | boolean | Record<string, string>;

interface LearningModuleProps {
  language: Language;
  baseLanguage: Language;
  languages: LanguageDetails[];
  category: string;
  subCategory: string;
  mode: LearningMode;
  quizType: QuizType | null;
  tone: Tone | null;
  difficulty: Difficulty | null;
  onBack: () => void;
  onQuizComplete: (score: number) => void;
  onContentLoaded: (activityId: string) => void;
}

interface QuizState {
  currentQuestionIndex: number;
  userAnswers: Record<number, QuizAnswer>;
  isSubmitted: boolean;
  explanations: Record<number, string>;
}

interface SavedQuizState {
  currentQuestionIndex: number;
  userAnswers: Record<number, QuizAnswer>;
}

const getInitialQuizState = (quizId: string | null): QuizState => {
  if (quizId) {
    try {
      const savedStateJSON = localStorage.getItem(quizId);
      if (savedStateJSON) {
        const savedState: SavedQuizState = JSON.parse(savedStateJSON);
        if (typeof savedState.currentQuestionIndex === 'number' && typeof savedState.userAnswers === 'object') {
          return { ...savedState, isSubmitted: false, explanations: {} };
        }
      }
    } catch (error) {
      console.error("Error reading saved quiz state:", error);
      localStorage.removeItem(quizId);
    }
  }
  return { currentQuestionIndex: 0, userAnswers: {}, isSubmitted: false, explanations: {} };
};

const useSpeechRecognition = (lang: string) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<{ message: string; severity: 'warning' | 'error' } | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) { return; }

        const recognition = new SpeechRecognitionImpl();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang;

        recognition.onresult = (event) => { setTranscript(event.results[0][0].transcript); setError(null); };
        recognition.onerror = (event) => {
            if (event.error === 'no-speech') setError({ message: "I didn't catch that. Please try speaking again.", severity: 'warning' });
            else if (event.error === 'not-allowed') setError({ message: "Microphone access was denied. Please enable it in your browser settings.", severity: 'error' });
            else setError({ message: `An error occurred: ${event.error}`, severity: 'error' });
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;

        return () => { if (recognitionRef.current) { recognitionRef.current.stop(); } };
    }, [lang]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript(''); setError(null);
            try { recognitionRef.current.start(); setIsListening(true); }
            catch(e) { setError({ message: "Could not start microphone. It might be in use by another tab.", severity: 'error' }); }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) { recognitionRef.current.stop(); setIsListening(false); }
    }, [isListening]);
    
    return { isListening, transcript, error, startListening, stopListening, hasRecognitionSupport: !!recognitionRef.current };
};

const renderProTip = (proTip?: string) => {
    if (!proTip) return null;
    return (
        <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <LightbulbIcon /> Pro Tip
          </h3>
          <p className="mt-1 text-green-700 dark:text-green-300 whitespace-pre-line">{proTip}</p>
        </div>
    );
};

const renderWordByWord = (words: WordByWord[] | undefined, handleSpeak: (text: string) => void, baseLanguage: string) => {
    if (!words || words.length === 0) return null;
    return (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Word-by-word Translation (in {baseLanguage})</h4>
            <div className="space-y-3">
            {words.map((w, wIndex) => (
                <div key={wIndex} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{w.word}</span>
                    <button onClick={() => handleSpeak(w.word)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" title={`Listen to "${w.word}"`}>
                        <SpeakerIcon className="w-5 h-5" />
                    </button>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">— {w.translation}</span>
                  </div>
                  
                  {w.pronunciationInBase && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      <span className="font-semibold">Pronunciation:</span> {w.pronunciationInBase}
                    </p>
                  )}

                  {w.alphabets && w.alphabets.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600/50">
                        <h5 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Alphabet Breakdown</h5>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            {w.alphabets.map((alpha, aIndex) => (
                                <div key={aIndex} className="flex items-baseline gap-1">
                                    <span className="font-mono text-md text-gray-800 dark:text-gray-200">{alpha.character}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">({alpha.pronunciationInBase})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>
            ))}
            </div>
        </div>
    );
};

const renderPronunciationGuide = (en: string, base: string, size: 'sm' | 'xs' = 'sm') => {
    if (!en && !base) return null;
    const baseClasses = `inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full font-medium ${size === 'sm' ? 'text-sm' : 'text-xs'}`;
    const enClasses = `bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200`;
    const teClasses = `bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200`;
    const langLabelClasses = `font-bold ${size === 'sm' ? 'text-xs' : 'text-[10px]'}`;

    const pills = (
        <div className="flex flex-wrap items-center gap-2">
            {en && <span className={`${baseClasses} ${enClasses}`}><span className={langLabelClasses}>EN</span><span className="font-mono">/{en}/</span></span>}
            {base && <span className={`${baseClasses} ${teClasses}`}><span className={langLabelClasses}>SCRIPT</span><span>/{base}/</span></span>}
        </div>
    );

    if (size === 'xs') {
        return <div className="mt-2">{pills}</div>;
    }

    return (
        <div className="mt-2">
            <h5 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Pronunciation Guide</h5>
            <div className="mt-1">{pills}</div>
        </div>
    );
};

const LearningModule: React.FC<LearningModuleProps> = ({
  language, baseLanguage, languages, category, subCategory, mode, quizType, tone, difficulty, onBack, onQuizComplete, onContentLoaded
}) => {
  const [content, setContent] = useState<LearningContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LearningContent[]>([]);
  const [contentKey, setContentKey] = useState(0);
  const ttsLanguageCode = languages.find(l => l.name === language)?.ttsCode || 'en-US';
  const { isListening, transcript, error: speechError, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition(ttsLanguageCode);
  
  const quizId = useMemo(() => mode === 'Quiz' && quizType ? `quiz-progress-${language}-${subCategory}-${quizType}` : null, [language, subCategory, mode, quizType]);

  const [quizState, setQuizState] = useState<QuizState>(() => getInitialQuizState(quizId));
  const [visibleExplanations, setVisibleExplanations] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    if (quizId && content?.type === 'quiz' && !quizState.isSubmitted) {
      const stateToSave: SavedQuizState = { currentQuestionIndex: quizState.currentQuestionIndex, userAnswers: quizState.userAnswers };
      try { localStorage.setItem(quizId, JSON.stringify(stateToSave)); } catch (e) { console.error("Error saving quiz state:", e); }
    }
  }, [quizId, quizState, content]);

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const situationInputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedScenario, setSelectedScenario] = useState<RolePlayScenario | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const handleSpeak = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLanguageCode;
    speechSynthesis.speak(utterance);
  };

  const fetchContent = useCallback(async () => {
    setLoading(true); setError(null); setContent(null);
    try {
      const newContent = await generateLearningContent(language, baseLanguage, category, subCategory, mode, history, { quizType, tone, difficulty });
      setContent(newContent);
      onContentLoaded(`${language}:${subCategory}:${mode}${quizType || ''}${tone || ''}`);
      if (newContent.type === 'quiz') setVisibleExplanations(new Set());
      if (newContent.type === 'storyboard') setCurrentSceneIndex(0);
      if (newContent.type === 'role_play_setup') { setSelectedScenario(null); setChatMessages([]); }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setContentKey(k => k + 1);
    }
  }, [language, baseLanguage, category, subCategory, mode, quizType, tone, difficulty, history, onContentLoaded]);

  useEffect(() => { fetchContent(); }, []);

  const handleRefresh = () => {
    if (content) {
      if (quizId) localStorage.removeItem(quizId);
      setHistory(prev => [...prev, content]);
    }
    fetchContent();
  };
  
  const handleAnswerChange = (questionIndex: number, answer: QuizAnswer) => {
    setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [questionIndex]: answer } }));
  };

  const handleSubmitQuiz = async () => {
    const quizContent = content as QuizContent;
    let correctCount = 0;
    const newExplanations: Record<number, string> = {};
    
    for (let i = 0; i < quizContent.questions.length; i++) {
        const q = quizContent.questions[i];
        const userAnswer = quizState.userAnswers[i];
        let isCorrect = false;
        switch (q.questionType) {
            case 'MCQ': case 'PICTURE_MCQ': isCorrect = userAnswer === q.correctAnswerId; break;
            case 'FILL_BLANK': case 'SCRAMBLE': case 'ERROR_CORRECTION': case 'DIALOGUE_COMPLETION': isCorrect = typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase(); break;
            case 'TRUE_FALSE': isCorrect = userAnswer === q.correctAnswerBool; break;
            case 'MATCHING': isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.correctPairs); break;
        }
        
        if (isCorrect) correctCount++;
        else {
            const getCorrect = (q: AnyQuizQuestion) => {
                 switch (q.questionType) {
                    case 'MCQ': case 'PICTURE_MCQ': return q.options.find(o => o.id === q.correctAnswerId)?.text;
                    case 'TRUE_FALSE': return q.correctAnswerBool;
                    case 'MATCHING': return q.correctPairs;
                    default: return q.correctAnswer;
                }
            }
            newExplanations[i] = await generateQuizExplanation(language, baseLanguage, q, userAnswer, getCorrect(q));
        }
    }
    
    onQuizComplete(correctCount / quizContent.questions.length);
    setQuizState(prev => ({ ...prev, isSubmitted: true, explanations: newExplanations }));
    if (quizId) localStorage.removeItem(quizId);
  };

  const getCorrectAnswerForQuestion = (q: AnyQuizQuestion): string => {
    switch (q.questionType) {
        case 'MCQ': case 'PICTURE_MCQ': return q.options.find(opt => opt.id === q.correctAnswerId)?.text || '';
        case 'TRUE_FALSE': return q.correctAnswerBool ? 'True' : 'False';
        case 'MATCHING': return 'See correct pairs below.';
        default: return q.correctAnswer;
    }
  }

  const handleSituationalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const situation = situationInputRef.current?.value;
    if (!situation) return;
    setLoading(true); setError(null);
    try {
        const responseContent = await generateSituationalResponse(language, baseLanguage, situation);
        setContent(responseContent);
        onContentLoaded(`${language}:Situational Practice:${situation.slice(0, 20)}`);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  }

  const handleStartRolePlay = (scenario: RolePlayScenario) => {
    const systemInstruction = `You are playing the role of: ${scenario.aiPersona}. The user is playing the role of: ${scenario.userPersona}. Your conversation should be in ${language}. You must also provide feedback on the user's grammar. Respond with a JSON object: {"response": "your response text...", "feedback": {"hasError": boolean, "correctedSentence": "...", "explanation": "..."}}. The feedback explanation MUST be in ${baseLanguage}. If there's no error, set hasError to false and other fields to empty strings. Start the conversation with your opening line now.`;
    const newChat = createChatSession(systemInstruction);
    setChatSession(newChat);
    setSelectedScenario(scenario);
    setChatMessages([{ id: `ai-${Date.now()}`, sender: 'ai', text: scenario.openingLine }]);
  }

  const handleSendChatMessage = async (e: FormEvent) => {
      e.preventDefault();
      const text = chatInputRef.current?.value;
      if (!text || !chatSession || isAiTyping) return;
      
      const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text };
      setChatMessages(prev => [...prev, newUserMessage]);
      if (chatInputRef.current) chatInputRef.current.value = '';
      setIsAiTyping(true);
      onContentLoaded(`${language}:AI Role-Play:${selectedScenario?.title}`);
      
      try {
          const response = await sendChatMessage(chatSession, text);
          const parsed = JSON.parse(response.text.trim());
          setChatMessages(prev => prev.map(msg => msg.id === newUserMessage.id ? {...msg, feedback: parsed.feedback as AIFeedback} : msg));
          setChatMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: parsed.response }]);
      } catch (err: any) {
          setChatMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'ai', text: `Sorry, I had trouble responding. (${err.message})` }]);
      } finally {
          setIsAiTyping(false);
      }
  }

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <Button variant="secondary" onClick={onBack}><ArrowLeftIcon /> Back</Button>
      <div className="flex-1 text-center mx-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{mode}{quizType && ` - ${quizType}`}{tone && ` - ${tone}`}{difficulty && ` - ${difficulty}`}</h2>
        <h3 className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">{subCategory}</h3>
      </div>
      <Button variant="secondary" onClick={handleRefresh} disabled={loading}><RefreshIcon className={loading ? 'animate-spin' : ''} /> New</Button>
    </div>
  );

  const renderGrammarContent = (c: GrammarContent) => (
    <div className="space-y-6">
        <div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Explanation (in {baseLanguage})</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{c.explanation}</p>
        </div>
        {c.comparisonTable && (
          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Comparison</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>{c.comparisonTable.headers.map((h, i) => <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{h}</th>)}</tr></thead><tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">{c.comparisonTable.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{cell}</td>)}</tr>)}</tbody></table>
            </div>
          </div>
        )}
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Examples</h3>
            {c.examples.map((ex, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {ex.imageBytes && <img src={`data:image/jpeg;base64,${ex.imageBytes}`} alt={ex.sentence} className="rounded-lg mb-4 w-full h-48 object-cover" />}
                    <div className="flex items-center gap-3"><p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{ex.sentence}</p><Button variant="secondary" size="sm" onClick={() => handleSpeak(ex.sentence)}><SpeakerIcon/></Button></div>
                    {renderPronunciationGuide(ex.pronunciationEn, ex.pronunciationInBase)}
                    <p className="mt-2 text-md text-gray-800 dark:text-gray-300"><b>Meaning:</b> {ex.meaning}</p>
                    {renderWordByWord(ex.wordByWord, handleSpeak, baseLanguage)}
                </div>
            ))}
        </div>
        {renderProTip(c.proTip)}
    </div>
  );

  const renderVocabularyContent = (c: VocabularyContent) => (
      <div className="space-y-6">
        <p className="text-center text-lg">{c.intro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.words.map((word, index) => (
                <div key={index} className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 shadow-sm">
                    {word.imageBytes && <img src={`data:image/jpeg;base64,${word.imageBytes}`} alt={word.word} className="rounded-lg mb-4 w-full h-40 object-cover" />}
                    <div className="flex items-center gap-3"><h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{word.word}</h3><Button variant="secondary" size="sm" onClick={() => handleSpeak(word.word)}><SpeakerIcon/></Button></div>
                    {renderPronunciationGuide(word.pronunciationEn, word.pronunciationInBase)}
                    <p className="mt-2 text-lg text-gray-800 dark:text-gray-300"><b>Meaning:</b> {word.meaning}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Example Sentence:</p>
                        <div className="flex items-center gap-2 mt-1"><p className="font-medium text-gray-800 dark:text-gray-200">"{word.exampleSentence}"</p><Button variant="secondary" size="sm" onClick={() => handleSpeak(word.exampleSentence)}><SpeakerIcon/></Button></div>
                        {renderPronunciationGuide(word.examplePronunciationEn, word.examplePronunciationInBase, 'xs')}
                        {renderWordByWord(word.exampleWordByWord, handleSpeak, baseLanguage)}
                    </div>
                </div>
            ))}
        </div>
        {renderProTip(c.proTip)}
      </div>
  );

  const renderListeningContent = (c: ListeningContent) => (
    <div>
        <p className="text-lg text-center mb-4">{c.instruction}</p>
        <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-4 mb-3"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Listen to this paragraph:</h3><Button variant="primary" onClick={() => handleSpeak(c.paragraph)}><SpeakerIcon/> Listen</Button></div>
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">{c.paragraph}</p>
            {renderPronunciationGuide(c.pronunciationEn, c.pronunciationInBase)}
            <p className="mt-4 text-md text-gray-800 dark:text-gray-300"><b>Translation:</b> {c.translation}</p>
            {renderWordByWord(c.wordByWord, handleSpeak, baseLanguage)}
        </div>
        {renderProTip(c.proTip)}
    </div>
  );
  
  const renderSpeakingContent = (c: SpeakingContent) => (
    <div>
        <p className="text-lg text-center mb-4">{c.instruction}</p>
        <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phrase to practice:</p>
            <div className="flex items-center gap-3 mt-1"><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{c.phrase}</p><Button variant="secondary" size="sm" onClick={() => handleSpeak(c.phrase)}><SpeakerIcon/></Button></div>
            {renderPronunciationGuide(c.pronunciationEn, c.pronunciationInBase)}
            <p className="mt-2 text-md text-gray-800 dark:text-gray-300"><b>Meaning:</b> {c.meaning}</p>
            {renderWordByWord(c.wordByWord, handleSpeak, baseLanguage)}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Your Turn:</h4>
                <div className="mt-4 flex items-center gap-4"><Button variant={isListening ? "secondary" : "primary"} onClick={isListening ? stopListening : startListening} disabled={!hasRecognitionSupport} className={`min-w-[150px] ${isListening ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' : ''}`}><MicrophoneIcon className={isListening ? 'animate-pulse' : ''} />{isListening ? "Listening..." : "Record"}</Button></div>
                {speechError && <div className={`mt-4 p-3 rounded-lg border ${speechError.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'}`}><p className={`font-semibold flex items-center gap-2 ${speechError.severity === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>{speechError.severity === 'warning' ? <ExclamationTriangleIcon /> : <XCircleIcon/>} {speechError.severity === 'warning' ? 'Heads-up' : 'Error'}</p><p className={`mt-1 text-sm pl-7 ${speechError.severity === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{speechError.message}</p></div>}
                {transcript && !speechError && <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"><p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2"><CheckCircleIcon /> I heard:</p><p className="mt-1 text-lg text-green-900 dark:text-green-200 pl-7">"{transcript}"</p></div>}
            </div>
        </div>
        {renderProTip(c.proTip)}
    </div>
  );
  
  const renderVisualContextContent = (c: VisualContextContent) => (
    <div>
        <p className="text-lg text-center mb-4">{c.instruction}</p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <img src={`data:image/jpeg;base64,${c.imageBytes}`} alt="Visual context" className="rounded-lg mb-4 w-full h-auto max-h-[400px] object-cover" />
            <div className="flex items-center gap-4 mb-3"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Listen to the description:</h3><Button variant="primary" onClick={() => handleSpeak(c.paragraph)}><SpeakerIcon/> Listen</Button></div>
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">{c.paragraph}</p>
            {renderPronunciationGuide(c.pronunciationEn, c.pronunciationInBase)}
            <p className="mt-4 text-md text-gray-800 dark:text-gray-300"><b>Translation:</b> {c.translation}</p>
            {renderWordByWord(c.wordByWord, handleSpeak, baseLanguage)}
        </div>
        {renderProTip(c.proTip)}
    </div>
  );

  const renderStoryboardContent = (c: StoryboardContent) => {
    const scene = c.scenes[currentSceneIndex];
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">{c.title}</h2>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-center font-semibold mb-4">Scene {scene.sceneNumber} of {c.scenes.length}</p>
                <img src={`data:image/jpeg;base64,${scene.imageBytes}`} alt={`Scene ${scene.sceneNumber}`} className="rounded-lg mb-4 w-full h-auto max-h-[400px] object-cover" />
                <div className="flex items-center gap-3"><p className="text-lg text-gray-800 dark:text-gray-200">{scene.paragraph}</p><Button variant="secondary" size="sm" onClick={() => handleSpeak(scene.paragraph)}><SpeakerIcon/></Button></div>
                {renderPronunciationGuide(scene.pronunciationEn, scene.pronunciationInBase)}
                <p className="mt-2 text-md text-gray-800 dark:text-gray-300"><b>Translation:</b> {scene.translation}</p>
                {renderWordByWord(scene.wordByWord, handleSpeak, baseLanguage)}
                {renderProTip(scene.proTip)}
            </div>
            <div className="flex justify-between items-center"><Button onClick={() => setCurrentSceneIndex(p => p - 1)} disabled={currentSceneIndex === 0}><ArrowLeftIcon /> Previous</Button><Button onClick={() => setCurrentSceneIndex(p => p + 1)} disabled={currentSceneIndex === c.scenes.length - 1}>Next <ArrowRightIcon /></Button></div>
        </div>
    );
  };

  const renderQuizContent = (c: QuizContent) => {
    const questionIndex = quizState.currentQuestionIndex;
    const question = c.questions[questionIndex];
    const userAnswer = quizState.userAnswers[questionIndex];
    const isSubmitted = quizState.isSubmitted;
    const explanationText = quizState.explanations[questionIndex];
    const wasAnsweredIncorrectly = isSubmitted && !!explanationText;

    const renderQuestionBody = () => {
        const getOptionClass = (q: AnyQuizQuestion, optionId: string) => {
            if (!isSubmitted) return 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
            const isCorrect = optionId === (q as PictureMCQQuestion).correctAnswerId;
            if (isCorrect) return 'bg-green-100 dark:bg-green-900 ring-2 ring-green-500';
            if (optionId === userAnswer) return 'bg-red-100 dark:bg-red-900 ring-2 ring-red-500';
            return 'bg-white dark:bg-gray-700 opacity-70';
        };

        switch (question.questionType) {
            case 'MCQ': case 'PICTURE_MCQ': return (<div className="space-y-3">{(question as PictureMCQQuestion).imageBytes && <img src={`data:image/jpeg;base64,${(question as PictureMCQQuestion).imageBytes}`} alt="Quiz visual" className="rounded-lg mb-4 w-full max-w-sm mx-auto object-cover" />}{question.options.map(opt => (<button key={opt.id} onClick={() => !isSubmitted && handleAnswerChange(questionIndex, opt.id)} disabled={isSubmitted} className={`w-full text-left p-3 rounded-lg transition-all ${getOptionClass(question, opt.id)}`}>{opt.text}</button>))}</div>);
            case 'FILL_BLANK': return <input type="text" defaultValue={userAnswer as string || ''} disabled={isSubmitted} onChange={e => handleAnswerChange(questionIndex, e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500"/>;
            case 'TRUE_FALSE': return (<div className="flex gap-4">{[true, false].map(val => (<button key={String(val)} onClick={() => !isSubmitted && handleAnswerChange(questionIndex, val)} disabled={isSubmitted} className={`w-full p-3 rounded-lg transition-all ${userAnswer === val ? 'ring-2 ring-blue-500' : ''} ${isSubmitted ? (val === question.correctAnswerBool ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900') : 'bg-white dark:bg-gray-700 hover:bg-gray-100'}`}>{String(val)}</button>))}</div>);
            default: return <p>Unsupported question type: {question.questionType}</p>
        }
    };
    
    return (
        <div className="space-y-6">
            <p className="text-center">{c.intro}</p>
            {c.comprehensionText && <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p>{c.comprehensionText}</p></div>}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Question {questionIndex + 1} of {c.questions.length}</p>
                <h3 className="text-xl font-semibold my-2 text-gray-800 dark:text-gray-200">{question.questionText}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">({question.questionTextInBase})</p>
                {renderQuestionBody()}
            </div>
            {isSubmitted && (<div className={`p-4 rounded-lg ${wasAnsweredIncorrectly ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}><h4 className="font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">{wasAnsweredIncorrectly ? <XCircleIcon className="text-red-500" /> : <CheckCircleIcon className="text-green-500" />}Correct Answer</h4><p className="mt-1 text-gray-700 dark:text-gray-300">{getCorrectAnswerForQuestion(question)}</p>{wasAnsweredIncorrectly && (<div className="mt-3">{!visibleExplanations.has(questionIndex) ? (<Button variant="secondary" size="sm" onClick={() => setVisibleExplanations(p => new Set(p).add(questionIndex))}><LightbulbIcon />Show Explanation</Button>) : (<div className="pt-3 border-t border-red-200 dark:border-red-800/50 animate-fade-in"><p className="text-sm font-semibold text-red-800 dark:text-red-300">Explanation:</p><p className="mt-1 text-sm text-red-700 dark:text-red-400 whitespace-pre-line">{explanationText}</p></div>)}</div>)}</div>)}
            <div className="flex justify-between items-center"><Button variant="secondary" onClick={() => setQuizState(p => ({...p, currentQuestionIndex: p.currentQuestionIndex - 1}))} disabled={questionIndex === 0}>Previous</Button>{questionIndex === c.questions.length - 1 ? (<Button variant="primary" onClick={handleSubmitQuiz} disabled={isSubmitted}>Submit</Button>) : (<Button variant="primary" onClick={() => setQuizState(p => ({...p, currentQuestionIndex: p.currentQuestionIndex + 1}))}>Next</Button>)}</div>
        </div>
    );
  };
  
  const renderSituationalPractice = (c: SituationalPracticeInitContent | SituationalPracticeResponseContent) => {
    if (c.type === 'situational_practice_init') {
        return (
            <div className="text-center space-y-4"><h2 className="text-2xl font-bold">{c.title}</h2><p>{c.instruction}</p><form onSubmit={handleSituationalSubmit} className="max-w-xl mx-auto space-y-3"><textarea ref={situationInputRef} rows={4} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500" placeholder="e.g., How do I politely ask for directions?"></textarea><Button type="submit" variant="primary">Get Advice</Button></form></div>
        );
    }
    return (
        <div className="space-y-6">
            <div><p className="font-semibold text-gray-600 dark:text-gray-400">Your Situation:</p><p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg italic">"{c.situation}"</p></div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30"><h3 className="font-bold text-lg text-blue-800 dark:text-blue-300">Advice</h3><p className="mt-1 whitespace-pre-line">{c.response.advice}</p></div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30"><h3 className="font-bold text-lg text-green-800 dark:text-green-300">Key Phrases</h3><ul className="mt-2 space-y-2 list-disc list-inside">{c.response.keyPhrases.map((p, i) => <li key={i}><span className="font-semibold">{p.phrase}</span> - {p.meaning}</li>)}</ul></div>
            <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30"><h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300">Example Dialogue</h3><div className="mt-2 space-y-2">{c.response.exampleDialogue.map((d, i) => <p key={i}><span className="font-semibold">{d.speaker}:</span> {d.line}</p>)}</div></div>
        </div>
    );
  };
  
  const renderRolePlay = (c: RolePlaySetupContent) => {
    if (!selectedScenario) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center">Choose a Role-Play Scenario</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{c.scenarios.map((sc, i) => (<div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex flex-col"><h3 className="font-bold text-lg">{sc.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{sc.description}</p><p className="flex-grow text-sm"><b className="dark:text-gray-300">Your Role:</b> {sc.userPersona}</p><Button variant="primary" size="sm" onClick={() => handleStartRolePlay(sc)} className="mt-4 self-start">Start Scenario</Button></div>))}</div>
            </div>
        );
    }
    return (
        <div className="h-[70vh] flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600"><h3 className="font-bold text-lg">{selectedScenario.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400">You: {selectedScenario.userPersona}. AI: {selectedScenario.aiPersona}.</p></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">{chatMessages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)}{isAiTyping && <ChatMessageBubble message={{id:'typing', sender:'ai', text:'...'}} isTyping />}</div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-600"><form onSubmit={handleSendChatMessage} className="flex items-center gap-2"><input ref={chatInputRef} type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none" placeholder={`Type in ${language}...`} disabled={isAiTyping}/><Button type="submit" variant="primary" className="rounded-full !p-3" disabled={isAiTyping}><PaperAirplaneIcon /></Button></form></div>
        </div>
    );
  };
  
  const renderContent = () => {
    if (loading) return <div className="flex flex-col items-center justify-center h-64"><Spinner /><p className="mt-4 text-lg">Generating lesson<span className="inline-block animate-pulse">.</span><span className="inline-block animate-pulse [animation-delay:0.1s]">.</span><span className="inline-block animate-pulse [animation-delay:0.2s]">.</span></p></div>;
    if (error) return <div className="text-center p-8 bg-red-50 dark:bg-red-900/30 rounded-lg"><p className="text-red-600 dark:text-red-300 font-semibold">Oops, something went wrong!</p><p className="mt-2 text-red-500 dark:text-red-400">{error}</p><Button variant="primary" onClick={handleRefresh} className="mt-4">Try Again</Button></div>;
    if (!content) return <p>No content. Try refreshing.</p>;
    switch (content.type) {
      case 'grammar': return renderGrammarContent(content);
      case 'vocabulary': return renderVocabularyContent(content);
      case 'listening': return renderListeningContent(content);
      case 'speaking': return renderSpeakingContent(content);
      case 'visual_context': return renderVisualContextContent(content);
      case 'storyboard': return renderStoryboardContent(content);
      case 'quiz': return renderQuizContent(content);
      case 'situational_practice_init': case 'situational_practice_response': return renderSituationalPractice(content);
      case 'role_play_setup': return renderRolePlay(content);
      default: return <p>Unsupported content type.</p>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 animate-fade-in">
      {renderHeader()}
      <div key={contentKey} className="mt-4 animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
};

export default LearningModule;