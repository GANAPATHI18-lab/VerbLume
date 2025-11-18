
import type { ReactNode } from 'react';
import type { Chat } from '@google/genai';

export type Language = string;

export interface LanguageDetails {
    name: string;
    nativeName: string;
    emoji: string;
    ttsCode: string;
    isCustom?: boolean;
    greeting?: string;
    greetingInBase?: string;
}

export const LEARNING_MODES = ["Listening", "Speaking", "New Vocabulary", "Core Grammar", "Visual Context", "Storyboard Scenario", "Situational Practice", "AI Role-Play", "AI Tutor", "Quiz"] as const;
export type LearningMode = typeof LEARNING_MODES[number];

export const QUIZ_TYPES = ["Vocabulary", "Grammar Usage", "Comprehension", "Error Correction", "Matching Pairs", "Dialogue Completion", "Visual Association", "Mixed Review"] as const;
export type QuizType = typeof QUIZ_TYPES[number];

export const TONES = [
  "Professional", "Conversational", "Sarcastic", "Formal", "Informal",
  "Poetic", "Humorous", "Cinematic", "Inspirational", "Mysterious",
  "Playful", "Dark", "Assertive", "Empathetic", "Motivational",
  "Explanatory", "Narrative", "Reflective", "Dramatic", "Promotional"
] as const;
export type Tone = typeof TONES[number];

export const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Difficulty = typeof DIFFICULTY_LEVELS[number];


export interface Category {
  name: string;
  icon: string;
  subCategories: string[];
}

export interface Selection {
  language: Language | null;
  category: string | null;
  subCategory: string | null;
  mode: LearningMode | null;
  quizType: QuizType | null;
  tone: Tone | null;
  difficulty: Difficulty | null;
}

// --- SAVED LESSONS FOR OFFLINE ---
export interface SavedLesson {
    id: string;
    timestamp: number;
    language: Language;
    baseLanguage: Language;
    category: string;
    subCategory: string;
    mode: LearningMode;
    content: LearningContent;
    quizType?: QuizType | null;
    tone?: Tone | null;
    difficulty?: Difficulty | null;
}

// --- QUIZ QUESTION TYPES (DISCRIMINATED UNION) ---
export type QuestionFormat = "MCQ" | "FILL_BLANK" | "TRUE_FALSE" | "SCRAMBLE" | "MATCHING" | "ERROR_CORRECTION" | "DIALOGUE_COMPLETION" | "PICTURE_MCQ";

export interface QuizOption {
  id: string;
  text: string;
}

export interface BaseQuestion {
  questionType: QuestionFormat;
  questionText: string;
  questionTextInBase: string;
}

export interface MCQQuestion extends BaseQuestion {
  questionType: "MCQ";
  options: QuizOption[];
  correctAnswerId: string;
}

export interface PictureMCQQuestion extends BaseQuestion {
    questionType: "PICTURE_MCQ";
    imagePrompt?: string; // Optional prompt from AI for regular quizzes
    imageBytes?: string; // Optional base64 image, populated after generation
    options: QuizOption[];
    correctAnswerId: string;
}

export interface FillBlankQuestion extends BaseQuestion {
  questionType: "FILL_BLANK";
  correctAnswer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  questionType: "TRUE_FALSE";
  correctAnswerBool: boolean;
}

export interface ScrambleQuestion extends BaseQuestion {
  questionType: "SCRAMBLE";
  jumbledWords: string[];
  correctAnswer: string;
}

export interface MatchItem {
  id: string;
  text: string;
}

export interface MatchingQuestion extends BaseQuestion {
  questionType: "MATCHING";
  premises: MatchItem[]; // Column A
  responses: MatchItem[]; // Column B
  correctPairs: Record<string, string>; // Maps premise.id to response.id
}

export interface ErrorCorrectionQuestion extends BaseQuestion {
    questionType: "ERROR_CORRECTION";
    incorrectSentence: string;
    correctAnswer: string; // The full corrected sentence
}

export interface DialogueLine {
    speaker: string;
    line: string;
}

export interface DialogueCompletionQuestion extends BaseQuestion {
    questionType: "DIALOGUE_COMPLETION";
    dialogueContext: DialogueLine[]; // Previous lines
    lineWithBlank: string; // The line with the blank, e.g., "Speaker A: ___"
    correctAnswer: string;
}


export type AnyQuizQuestion = MCQQuestion | FillBlankQuestion | TrueFalseQuestion | ScrambleQuestion | MatchingQuestion | ErrorCorrectionQuestion | DialogueCompletionQuestion | PictureMCQQuestion;


// --- AI ROLE PLAY ---
export interface RolePlayScenario {
    title: string;
    description: string;
    aiPersona: string;
    userPersona: string;
    openingLine: string;
}

export interface RolePlaySetupContent {
    type: 'role_play_setup';
    scenarios: RolePlayScenario[];
}

export interface AIFeedback {
    hasError: boolean;
    correctedSentence: string;
    explanation: string;
    pronunciationTip?: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    feedback?: AIFeedback | null;
}


// --- Structured Content Types ---

export interface Alphabet {
  character: string;
  pronunciationInBase: string;
}

export interface WordByWord {
  word: string;
  translation: string;
  pronunciationInBase?: string; // Pronunciation of the whole word in Base language
  alphabets?: Alphabet[];   // Breakdown of the word into alphabets
}


export interface GrammarExample {
  sentence: string;
  pronunciationEn: string; // Phonetic guide using English letters
  pronunciationInBase: string; // Phonetic guide using Base language script
  meaning: string; // Full sentence meaning in Base language
  wordByWord: WordByWord[];
  imageBytes?: string;
}

export interface GrammarContent {
  type: 'grammar';
  explanation: string; // in Base language
  examples: GrammarExample[];
  proTip: string; // in Base language
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
}

export interface VocabularyItem {
  word: string;
  pronunciationEn: string;
  pronunciationInBase: string;
  meaning: string; // Base language meaning of the word
  exampleSentence: string;
  exampleSentenceMeaning?: string; // Meaning of the sentence in Base language
  examplePronunciationEn: string;
  examplePronunciationInBase: string;
  exampleWordByWord: WordByWord[];
  imageBytes?: string;
  isVisualizable: boolean;
}

export interface VocabularyContent {
  type: 'vocabulary';
  intro: string; // Instruction in Base language
  words: VocabularyItem[];
  proTip?: string;
}

export interface ListeningContent {
  type: 'listening';
  instruction: string; // Instruction in Base language
  paragraph: string; // Target language paragraph
  pronunciationEn: string;
  pronunciationInBase: string;
  translation: string; // Full paragraph translation in Base language
  wordByWord: WordByWord[];
  proTip?: string;
}

export interface VisualContextContent {
  type: 'visual_context';
  instruction: string; // Instruction in Base language
  imageBytes: string;
  paragraph: string; // Target language paragraph
  pronunciationEn: string;
  pronunciationInBase: string;
  translation: string; // Full paragraph translation in Base language
  wordByWord: WordByWord[];
  proTip?: string;
}

export interface SpeakingContent {
  type: 'speaking';
  instruction: string; // Instruction in Base language
  phrase: string; // Target language phrase
  pronunciationEn: string;
  pronunciationInBase: string;
  meaning: string; // Meaning of the phrase in Base language
  wordByWord: WordByWord[];
  proTip?: string;
}

export interface QuizContent {
  type: 'quiz';
  intro: string;
  comprehensionText?: string; // For comprehension quizzes
  questions: AnyQuizQuestion[];
}

export interface StoryboardScene {
    sceneNumber: number;
    imageBytes: string;
    paragraph: string;
    pronunciationEn: string;
    pronunciationInBase: string;
    translation: string;
    wordByWord: WordByWord[];
    proTip?: string;
}

export interface StoryboardContent {
    type: 'storyboard';
    title: string;
    scenes: StoryboardScene[];
}

export interface SituationalPracticeInitContent {
    type: 'situational_practice_init';
    instruction: string;
    title: string;
}

export interface SituationalPracticeResponseContent {
    type: 'situational_practice_response';
    situation: string; // The user's original query
    response: {
        advice: string; // In Base language
        keyPhrases: Array<{
            phrase: string; // In target language
            meaning: string; // In Base language
        }>;
        exampleDialogue: Array<{
            speaker: string;
            line: string; // In target language
        }>;
    };
}

export interface AiTutorInitContent {
    type: 'ai_tutor_init';
    initialMessage: string;
    tutorPersona: string;
}

export interface GrammarTopicDetails {
    originalTopic: string;
    topicInTargetLanguage: string;
    topicInBaseLanguage: string;
    pronunciationEn: string;
    pronunciationInBase: string;
}


export type LearningContent =
  | GrammarContent
  | VocabularyContent
  | ListeningContent
  | SpeakingContent
  | QuizContent
  | VisualContextContent
  | StoryboardContent
  | SituationalPracticeInitContent
  | SituationalPracticeResponseContent
  | RolePlaySetupContent
  | AiTutorInitContent;
