
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import type { Language, LearningMode, LearningContent, QuizType, AnyQuizQuestion, PictureMCQQuestion, QuizOption, Tone, SituationalPracticeResponseContent, Difficulty, GrammarTopicDetails } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- API RETRY HELPER ---
// FIX: The retry logic has been expanded to handle transient server errors (5xx) and network issues ("Rpc failed"),
// in addition to the existing rate limit (429) handling. This improves app resilience.
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> => {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            attempts++;
            const errorString = error.toString().toLowerCase();
            // Check for various retryable error conditions
            const isRetryableError =
                errorString.includes('429') || // Rate limit
                errorString.includes('resource_exhausted') ||
                errorString.includes('rate limit') ||
                errorString.includes('500') || // Internal Server Error
                errorString.includes('503') || // Service Unavailable
                errorString.includes('rpc failed'); // Potentially transient network error

            if (isRetryableError && attempts < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempts - 1) * (0.8 + Math.random() * 0.4); // Add jitter
                console.warn(`API call failed with a retryable error. Retrying in ${Math.round(delay)}ms... (Attempt ${attempts}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`API call failed after ${attempts} attempts.`, error);
                throw error;
            }
        }
    }
    throw new Error("Max retries reached. API call failed.");
};


// --- IMAGE GENERATION HELPER ---
const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        // FIX: The type for `withRetry` was too strict, as `generatedImages` is an optional property on the response.
        const imageResponse = await withRetry<{ generatedImages?: Array<{ image?: { imageBytes?: string } }> }>(() => ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: "16:9" }
        }));
        return imageResponse.generatedImages?.[0]?.image?.imageBytes ?? '';
    } catch (error) {
        console.warn(`Could not generate image from prompt:`, error);
        return '';
    }
};

const generateImageForTerm = async (term: string, context: string): Promise<string> => {
    const imagePrompt = `A clear, high-quality, photorealistic image of a "${term}" in the context of ${context}. No text, no logos, just the object or scene.`;
    return generateImageFromPrompt(imagePrompt);
};

// --- MAIN FUNCTION ---

export const generateLearningContent = async (
    language: Language,
    baseLanguage: Language,
    category: string,
    subCategory: string,
    mode: LearningMode,
    history: LearningContent[] = [],
    options: { quizType?: QuizType; tone?: Tone; difficulty?: Difficulty | null; } = {}
): Promise<LearningContent> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    
    const { quizType, tone, difficulty } = options;

    // --- REUSABLE SCHEMA PARTS (DYNAMIC) ---
    const wordByWordSchemaPart = {
        type: Type.ARRAY,
        description: `A word-by-word breakdown with ${baseLanguage} translations.`,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "A word from the source sentence/paragraph." },
            translation: { type: Type.STRING, description: `The ${baseLanguage} translation of the word.` },
            pronunciationInBase: { type: Type.STRING, description: `OPTIONAL: For non-English/Hindi languages, the pronunciation of the word in ${baseLanguage} script.` },
            alphabets: {
                type: Type.ARRAY,
                description: `OPTIONAL: For non-English/Hindi languages, a breakdown of each character in the word and its ${baseLanguage} pronunciation.`,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        character: { type: Type.STRING, description: "A single character/alphabet from the word." },
                        pronunciationInBase: { type: Type.STRING, description: `The ${baseLanguage} pronunciation of this single character.` }
                    },
                    required: ["character", "pronunciationInBase"]
                }
            }
          },
          required: ["word", "translation"]
        }
    };

    const proTipSchemaPart = {
        type: Type.STRING,
        description: `OPTIONAL: A helpful 'Pro Tip' in ${baseLanguage} about grammar, usage, or culture related to the lesson.`
    };
    
    // --- SCHEMAS (DYNAMIC) ---
    const rolePlayScenarioSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['role_play_setup'] },
            scenarios: {
                type: Type.ARRAY,
                description: "A list of 2 to 3 distinct role-playing scenarios.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: `A short, catchy title for the scenario in ${'English'}.` },
                        description: { type: Type.STRING, description: `A one-sentence description of the scenario in ${baseLanguage}.` },
                        userPersona: { type: Type.STRING, description: `The role the user will play, described in ${baseLanguage}.` },
                        aiPersona: { type: Type.STRING, description: `The role the AI will play, described in ${'English'}.` },
                        openingLine: { type: Type.STRING, description: `The first line the AI will say to start the conversation, in the target language.` },
                    },
                    required: ["title", "description", "userPersona", "aiPersona", "openingLine"]
                }
            }
        },
        required: ["type", "scenarios"]
    };

    const storyboardSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['storyboard'] },
            title: { type: Type.STRING, description: `A creative, short title for the story in ${'English'}.`},
            scenes: {
                type: Type.ARRAY,
                description: "A list of 2 to 3 scenes that tell a short story.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneNumber: { type: Type.INTEGER },
                        imagePrompt: { type: Type.STRING, description: "A detailed, SFW, photorealistic image prompt for an image generation model to create a visual for this scene." },
                        paragraph: { type: Type.STRING, description: `A short paragraph (1-2 sentences) in the target language describing this scene's action or dialogue.` },
                        pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the paragraph using English letters." },
                        pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the paragraph using ${baseLanguage} script.` },
                        translation: { type: Type.STRING, description: `The full, accurate translation of the paragraph in ${baseLanguage}.` },
                        wordByWord: wordByWordSchemaPart,
                        proTip: proTipSchemaPart,
                    },
                    required: ["sceneNumber", "imagePrompt", "paragraph", "pronunciationEn", "pronunciationInBase", "translation", "wordByWord"]
                }
            }
        }, required: ["type", "title", "scenes"]
    };
    
    const grammarSchema = {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['grammar'] },
        explanation: { type: Type.STRING, description: `Explain the grammar rule in detail. This explanation MUST be in ${baseLanguage}.` },
        examples: {
          type: Type.ARRAY, description: "Provide 2-3 clear example sentences in the target language.",
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING, description: "The example sentence in the target language." },
              pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the sentence using English letters." },
              pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the sentence using ${baseLanguage} script.` },
              meaning: { type: Type.STRING, description: `The complete meaning of the sentence in ${baseLanguage}.` },
              wordByWord: wordByWordSchemaPart,
              visualizableNoun: { type: Type.STRING, description: "A single, concrete, easily visualizable noun from the sentence. If none, this MUST be null." }
            }, required: ["sentence", "pronunciationEn", "pronunciationInBase", "meaning", "wordByWord", "visualizableNoun"]
          }
        },
        proTip: { type: Type.STRING, description: `A helpful 'Pro Tip' in ${baseLanguage}.` },
        comparisonTable: {
          type: Type.OBJECT, description: "OPTIONAL: A comparison table to contrast related concepts. This MUST be included if the topic is inherently comparative (e.g., comparing verb tenses, articles, prepositions). The table should have clear headers and rows with examples to highlight the differences. For example, headers could be ['Concept', 'Use Case', 'Example'].",
          properties: { headers: { type: Type.ARRAY, items: { type: Type.STRING } }, rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } } }
        }
      }, required: ["type", "explanation", "examples", "proTip"]
    };

    const vocabularySchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['vocabulary'] },
            intro: { type: Type.STRING, description: `A brief, encouraging instruction in ${baseLanguage}.` },
            words: {
                type: Type.ARRAY, description: "A list of 3 key vocabulary words related to the sub-category.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING, description: "The vocabulary word in the target language." },
                        pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the word using English letters." },
                        pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the word using ${baseLanguage} script.` },
                        meaning: { type: Type.STRING, description: `The ${baseLanguage} meaning of the word.` },
                        exampleSentence: { type: Type.STRING, description: "An example sentence using the word in the target language." },
                        exampleSentenceMeaning: { type: Type.STRING, description: `The complete meaning of the example sentence in ${baseLanguage}.` },
                        examplePronunciationEn: { type: Type.STRING, description: "Phonetic guide for the example sentence using English letters." },
                        examplePronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the example sentence using ${baseLanguage} script.` },
                        exampleWordByWord: wordByWordSchemaPart,
                        isVisualizable: { type: Type.BOOLEAN, description: "True if the word represents a concrete, easily visualizable object, otherwise false." }
                    },
                    required: ["word", "pronunciationEn", "pronunciationInBase", "meaning", "exampleSentence", "exampleSentenceMeaning", "examplePronunciationEn", "examplePronunciationInBase", "exampleWordByWord", "isVisualizable"]
                }
            },
            proTip: proTipSchemaPart,
        }, required: ["type", "intro", "words"]
    };

    const visualContextSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['visual_context'] },
            instruction: { type: Type.STRING, description: `A simple instruction in ${baseLanguage}.` },
            imagePrompt: { type: Type.STRING, description: "A detailed, SFW, photorealistic image prompt for an image generation model based on the paragraph below." },
            paragraph: { type: Type.STRING, description: "A short, interesting paragraph (2-3 sentences) in the target language describing the scene in the image prompt." },
            pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the entire paragraph using English letters." },
            pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the entire paragraph using ${baseLanguage} script.` },
            translation: { type: Type.STRING, description: `The full, accurate translation of the paragraph in ${baseLanguage}.` },
            wordByWord: wordByWordSchemaPart,
            proTip: proTipSchemaPart,
        }, required: ["type", "instruction", "imagePrompt", "paragraph", "pronunciationEn", "pronunciationInBase", "translation", "wordByWord"]
    };

    const listeningSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['listening'] },
            instruction: { type: Type.STRING, description: `A simple instruction in ${baseLanguage}.` },
            paragraph: { type: Type.STRING, description: "A short, interesting paragraph (2-3 sentences) in the target language about the sub-category." },
            pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the entire paragraph using English letters." },
            pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the entire paragraph using ${baseLanguage} script.` },
            translation: { type: Type.STRING, description: `The full, accurate translation of the paragraph in ${baseLanguage}.` },
            wordByWord: wordByWordSchemaPart,
            proTip: proTipSchemaPart,
        }, required: ["type", "instruction", "paragraph", "pronunciationEn", "pronunciationInBase", "translation", "wordByWord"]
    };

    const speakingSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['speaking'] },
            instruction: { type: Type.STRING, description: `A simple instruction in ${baseLanguage}.` },
            phrase: { type: Type.STRING, description: "A common, practical question or phrase in the target language related to the sub-category." },
            pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the phrase using English letters." },
            pronunciationInBase: { type: Type.STRING, description: `Phonetic guide for the phrase using ${baseLanguage} script.` },
            meaning: { type: Type.STRING, description: `The meaning of the phrase in ${baseLanguage}.` },
            wordByWord: wordByWordSchemaPart,
            proTip: proTipSchemaPart,
        }, required: ["type", "instruction", "phrase", "pronunciationEn", "pronunciationInBase", "meaning", "wordByWord"]
    };
    
    const quizSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['quiz'] },
            intro: { type: Type.STRING, description: `A brief, encouraging instruction in ${baseLanguage}.` },
            comprehensionText: { type: Type.STRING, description: "OPTIONAL: A paragraph for comprehension-based questions. Only include for 'Comprehension' quiz type." },
            questions: {
                type: Type.ARRAY,
                description: "A list of 2-4 questions with a mix of formats.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionType: { type: Type.STRING, enum: ["MCQ", "FILL_BLANK", "TRUE_FALSE", "SCRAMBLE", "MATCHING", "ERROR_CORRECTION", "DIALOGUE_COMPLETION", "PICTURE_MCQ"], description: "The format of the question." },
                        questionText: { type: Type.STRING, description: "The main question or instruction text in the target language. For FILL_BLANK, it should contain '___'." },
                        questionTextInBase: { type: Type.STRING, description: `The question text translated into ${baseLanguage} for clarity.` },
                        // MCQ / PICTURE_MCQ
                        options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING } } } },
                        correctAnswerId: { type: Type.STRING },
                        // PICTURE_MCQ
                        imagePrompt: { type: Type.STRING, description: "For PICTURE_MCQ type only. A detailed, SFW, photorealistic image prompt for an image generation model that relates to the question." },
                        // FILL_BLANK / SCRAMBLE / ERROR_CORRECTION / DIALOGUE_COMPLETION
                        correctAnswer: { type: Type.STRING },
                        // TRUE_FALSE
                        correctAnswerBool: { type: Type.BOOLEAN },
                        // SCRAMBLE
                        jumbledWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        // MATCHING
                        premises: { type: Type.ARRAY, description: "Column A items", items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, text: {type: Type.STRING}}}},
                        responses: { type: Type.ARRAY, description: "Column B items", items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, text: {type: Type.STRING}}}},
                        correctPairs: { type: Type.OBJECT, description: "An object mapping premise IDs to response IDs." },
                        // ERROR_CORRECTION
                        incorrectSentence: { type: Type.STRING },
                        // DIALOGUE_COMPLETION
                        dialogueContext: { type: Type.ARRAY, description: "The lines of conversation before the blank.", items: { type: Type.OBJECT, properties: { speaker: {type: Type.STRING}, line: {type: Type.STRING}}}},
                        lineWithBlank: { type: Type.STRING, description: "The line of conversation containing the blank." }
                    },
                    required: ["questionType", "questionText", "questionTextInBase"]
                }
            }
        }, required: ["type", "intro", "questions"]
    };

    if (mode === 'Situational Practice') {
        return {
            type: 'situational_practice_init',
            title: "Situational Practice",
            instruction: `Describe a real-world situation you're facing. For example, "How do I prepare for a job interview?" or "How do I order politely at a restaurant?"`
        };
    }

    if (mode === 'Quiz' && quizType === 'Visual Association') {
        try {
            const visualQuestion = await generateVisualQuizQuestion(language, subCategory, baseLanguage);
            return {
                type: 'quiz',
                intro: 'Look at the image and choose the correct word.',
                questions: [visualQuestion]
            };
        } catch(error) {
             console.error("Error generating visual quiz content:", error);
             if (error instanceof Error) {
                 throw new Error(`Failed to generate visual quiz: ${error.message}`);
             }
             throw new Error("An unknown error occurred while generating the visual quiz.");
        }
    }

    const historyInstruction = history.length > 0
        ? `\n\nCRITICAL INSTRUCTION: You have already provided the following content. Generate a new, different response. Do not repeat any of the following: ${JSON.stringify(history)}`
        : '';
        
    let schema, prompt;
    const difficultyInstruction = difficulty ? `The lesson MUST be tailored for a '${difficulty}' level.` : 'The difficulty level is not specified, assume an intermediate level.';
    const basePrompt = `You are an expert language tutor creating a structured JSON lesson for a user who speaks ${baseLanguage} and wants to learn ${language}. The topic is Category '${category}', Sub-Category '${subCategory}'. ${difficultyInstruction} All explanations, instructions, and meanings MUST be in clear, accessible ${baseLanguage}.
CRITICAL RULE FOR WORD-BY-WORD: For any sentence, phrase, or paragraph you generate in the target language, you MUST also provide a complete, word-by-word breakdown with its corresponding ${baseLanguage} translation (in the 'wordByWord' or 'exampleWordByWord' field).
IMPORTANT DETAIL: For languages OTHER THAN English and Hindi, for each word in the breakdown, you MUST ALSO provide a ${baseLanguage} pronunciation for the full word ('pronunciationInBase') AND a breakdown of each alphabet in the word with its ${baseLanguage} pronunciation ('alphabets'). For English and Hindi, these 'pronunciationInBase' and 'alphabets' fields MUST be omitted entirely.
Where relevant, also provide a helpful 'Pro Tip' in ${baseLanguage}.`;

    switch(mode) {
        case "AI Tutor":
            schema = {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['ai_tutor_init'] },
                    initialMessage: { type: Type.STRING, description: `An engaging opening question or greeting in ${language} to start a conversation about ${subCategory}.` },
                    tutorPersona: { type: Type.STRING, description: `A short description of the tutor's personality (e.g., 'Friendly & Patient', 'Strict but Fair').` }
                },
                required: ["type", "initialMessage", "tutorPersona"]
            };
            prompt = `${basePrompt} The user wants an 'AI Tutor' session. Create an initial state for a conversation about '${subCategory}'. The tutor should be helpful and correct mistakes.`;
            break;
        case "AI Role-Play":
            schema = rolePlayScenarioSchema;
            prompt = `${basePrompt} The user wants to do an 'AI Role-Play'. Create 2-3 distinct, engaging role-playing scenarios related to the sub-category. Follow the JSON schema precisely. Each scenario needs personas for the user and AI, and a good opening line for the AI to start the conversation in ${language}.`;
            break;
        case "Storyboard Scenario":
            schema = storyboardSchema;
            const toneInstructionStoryboard = tone ? `The story MUST be written in a ${tone} tone.` : "The tone should be neutral and narrative.";
            prompt = `${basePrompt} The user wants a 'Storyboard Scenario'. Create a short, engaging 2-3 scene story related to the sub-category. ${toneInstructionStoryboard} Follow the JSON schema precisely.${historyInstruction}`;
            break;
        case "Visual Context":
            schema = visualContextSchema;
            const toneInstruction = tone ? `The paragraph MUST be written in a ${tone} tone.` : "The tone should be neutral and descriptive.";
            prompt = `${basePrompt} The user wants a 'Visual Context' lesson. Create content according to the JSON schema. The paragraph must describe a vivid scene related to the sub-category, and the imagePrompt must be a good prompt to generate a picture of that scene. ${toneInstruction}${historyInstruction}`;
            break;
        case "Core Grammar":
            schema = grammarSchema;
            prompt = `${basePrompt} The user is studying 'Core Grammar' on the topic '${subCategory}'. Create a detailed lesson according to the provided JSON schema. CRITICAL: If the grammar topic involves comparing or contrasting related concepts (e.g., different verb tenses, articles 'a' vs 'an', or prepositions 'in' vs 'on'), you MUST provide a 'comparisonTable' to clearly illustrate the differences with examples. For each example sentence in the main lesson, identify a single 'visualizableNoun' if one exists (otherwise null).${historyInstruction}`;
            break;
        case "New Vocabulary":
            schema = vocabularySchema;
            prompt = `${basePrompt} The user wants to learn 'New Vocabulary'. Create a lesson with 3 new words according to the JSON schema. For each word, determine if it is 'isVisualizable'. Ensure each example sentence has a clear, corresponding translation in ${baseLanguage}.${historyInstruction}`;
            break;
        case "Listening":
            schema = listeningSchema;
            prompt = `${basePrompt} The user wants to practice 'Listening'. Create a lesson with a short paragraph according to the JSON schema.${historyInstruction}`;
            break;
        case "Speaking":
            schema = speakingSchema;
            prompt = `${basePrompt} The user wants to practice 'Speaking'. Create a lesson with a practical phrase to repeat, according to the JSON schema.${historyInstruction}`;
            break;
        case "Quiz":
            if (!quizType) throw new Error("Quiz type is required for Quiz mode.");
            schema = quizSchema;
            let quizFocusPrompt = "IMPORTANT: Quizzes do not need word-by-word breakdowns or pro-tips.";
            
            switch (difficulty) {
                case "Beginner": quizFocusPrompt += " For this 'Beginner' level quiz, all questions must be simple, direct, and test fundamental knowledge."; break;
                case "Intermediate": quizFocusPrompt += " For this 'Intermediate' level quiz, questions should require some inference or understanding of nuance."; break;
                case "Advanced": quizFocusPrompt += " For this 'Advanced' level quiz, questions must be challenging, testing subtle grammar points or idiomatic expressions."; break;
            }

            switch(quizType) {
                case "Vocabulary": quizFocusPrompt += " This is a Vocabulary quiz. Focus on definitions, synonyms, antonyms, and using the correct word in a sentence. Use question types: MCQ, FILL_BLANK."; break;
                case "Grammar Usage": quizFocusPrompt += " This is a Grammar Usage quiz. Focus on applying grammar rules correctly. Use question types: MCQ, TRUE_FALSE."; break;
                case "Comprehension": quizFocusPrompt += " This is a Comprehension quiz. FIRST, create a short paragraph (as `comprehensionText`). THEN, create questions (MCQ, TRUE_FALSE) that can ONLY be answered by reading it."; break;
                case "Error Correction": quizFocusPrompt += " This is an Error Correction quiz. ONLY use the 'ERROR_CORRECTION' question type."; break;
                case "Matching Pairs": quizFocusPrompt += " This is a Matching Pairs quiz. ONLY use the 'MATCHING' question type."; break;
                case "Dialogue Completion": quizFocusPrompt += " This is a Dialogue Completion quiz. ONLY use the 'DIALOGUE_COMPLETION' question type."; break;
                case "Mixed Review": quizFocusPrompt += " This is a Mixed Review quiz. Use a wide mix of ALL available question formats. For PICTURE_MCQ questions, you MUST provide a detailed `imagePrompt`."; break;
                case "Visual Association": throw new Error("Visual Association quiz should be handled separately.");
            }
            prompt = `${basePrompt} The user wants to take a '${quizType} Quiz'. ${quizFocusPrompt} Create a quiz with 2-4 questions based on the JSON schema. Questions must be in ${language}, but provide a ${baseLanguage} translation for the question text itself for clarity.${historyInstruction}`;
            break;
        default:
            throw new Error(`Unsupported learning mode: ${mode}`);
    }

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6,
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        }));

        let parsed = JSON.parse(response.text.trim());

        if (parsed.type === 'storyboard') {
            for (const scene of parsed.scenes) { if (scene.imagePrompt) { scene.imageBytes = await generateImageFromPrompt(scene.imagePrompt); } }
        } else if (parsed.type === 'visual_context') {
            if (parsed.imagePrompt) { parsed.imageBytes = await generateImageFromPrompt(parsed.imagePrompt); }
        } else if (parsed.type === 'vocabulary') {
            for (const word of parsed.words) { if (word.isVisualizable) { word.imageBytes = await generateImageForTerm(word.word, subCategory); } }
        } else if (parsed.type === 'grammar') {
            for (const ex of parsed.examples) { if (ex.visualizableNoun) { ex.imageBytes = await generateImageForTerm(ex.visualizableNoun, ex.sentence); } }
        }

        if (parsed.type === 'quiz' && parsed.questions) {
            for (const q of parsed.questions as AnyQuizQuestion[]) {
                if (q.questionType === 'PICTURE_MCQ' && q.imagePrompt) { q.imageBytes = await generateImageFromPrompt(q.imagePrompt); }
                if (q.questionType === 'TRUE_FALSE' && 'correctAnswer' in q) {
                    (q as any).correctAnswerBool = String((q as any).correctAnswer).toLowerCase() === 'true';
                    delete (q as any).correctAnswer;
                }
            }
        }

        return parsed as LearningContent;

    } catch (error) {
        console.error("Error generating content from Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.includes("JSON")) {
                 throw new Error(`The AI returned an invalid format. Please try again. Details: ${error.message}`);
            }
            throw new Error(`Failed to generate content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating content.");
    }
};

const generateVisualQuizQuestion = async (language: Language, subCategory: string, baseLanguage: string): Promise<PictureMCQQuestion> => {
    const conceptSchema = {
        type: Type.OBJECT,
        properties: {
            correctTerm: { type: Type.STRING, description: `A single, concrete, easily visualizable noun in ${language} related to ${subCategory}.` },
            distractors: { type: Type.ARRAY, items: { type: Type.STRING }, description: `Three other plausible but incorrect nouns in ${language}, from the same general domain.`}
        },
        required: ["correctTerm", "distractors"]
    };

    const conceptPrompt = `Generate one concrete noun and three distractor nouns in ${language} for a visual quiz about "${subCategory}". Return a JSON object matching the schema.`;
    
    const conceptResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conceptPrompt,
        config: { responseMimeType: "application/json", responseSchema: conceptSchema }
    }));
    
    const { correctTerm, distractors } = JSON.parse(conceptResponse.text);
    const imageBytes = await generateImageForTerm(correctTerm, subCategory);
    const allOptions = [correctTerm, ...distractors].sort(() => Math.random() - 0.5);

    const quizOptions: QuizOption[] = allOptions.map((text, index) => ({ id: String.fromCharCode(65 + index), text: text }));
    const correctAnswerId = quizOptions.find(opt => opt.text === correctTerm)!.id;

    return {
        questionType: "PICTURE_MCQ",
        questionText: "Which word best describes the image?",
        questionTextInBase: `Which word in ${language} best describes the image?`,
        imageBytes: imageBytes,
        options: quizOptions,
        correctAnswerId: correctAnswerId
    };
};

const subCategoryGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        subCategories: { type: Type.ARRAY, description: "An array of 5 to 8 distinct string values for the sub-topics.", items: { type: Type.STRING } }
    },
    required: ["subCategories"]
};

export const generateSubCategories = async (categoryName: string): Promise<string[]> => {
    const prompt = `Generate a list of 5 to 8 relevant sub-category topics for the main category: "${categoryName}". Return a JSON object matching the required schema.`;
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: subCategoryGenerationSchema }
        }));
        return JSON.parse(response.text.trim()).subCategories || [];
    } catch (error) {
        console.error(`Error generating sub-categories for ${categoryName}:`, error);
        return [];
    }
};

const languageDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        nativeName: { type: Type.STRING, description: "The name of the language in the requested base language." },
        emoji: { type: Type.STRING, description: "A single, representative emoji for the language." },
        ttsCode: { type: Type.STRING, description: "The BCP-47 language tag for Text-to-Speech (e.g., 'ja-JP' for Japanese)." },
        greeting: { type: Type.STRING, description: "A common greeting or short friendly phrase in the language." },
        greetingInBase: { type: Type.STRING, description: "The meaning of the greeting in the base language." }
    },
    required: ["nativeName", "emoji", "ttsCode", "greeting", "greetingInBase"]
};

export const generateLanguageDetails = async (languageName: string, baseLanguage: string): Promise<{ nativeName: string; emoji: string; ttsCode: string; greeting: string; greetingInBase: string; }> => {
    const prompt = `For the language "${languageName}", provide its name in the ${baseLanguage} language, a single suitable emoji, its standard BCP-47 TTS code, and a common greeting with its meaning in ${baseLanguage}. Return a JSON object matching the schema.`;
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: languageDetailsSchema }
    }));
    return JSON.parse(response.text.trim());
};

export const generateQuizExplanation = async (language: Language, baseLanguage: Language, question: AnyQuizQuestion, userAnswer: any, correctAnswer: any): Promise<string> => {
    const prompt = `A user is learning ${language} and answered a quiz question incorrectly. The user needs a concise explanation in ${baseLanguage} about why their answer was wrong and why the correct answer is right. Question: ${JSON.stringify(question.questionText)}. User's Answer: ${JSON.stringify(userAnswer)}. Correct Answer: ${JSON.stringify(correctAnswer)}. Provide a short, clear explanation in ${baseLanguage}.`;
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.3 }
    }));
    return response.text.trim();
};

export const generateSituationalResponse = async (language: Language, baseLanguage: Language, situation: string): Promise<SituationalPracticeResponseContent> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['situational_practice_response'] },
            response: {
                type: Type.OBJECT,
                properties: {
                    advice: { type: Type.STRING, description: `Actionable advice for the user's situation, in ${baseLanguage}.` },
                    keyPhrases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT, properties: {
                                phrase: { type: Type.STRING, description: `A key phrase in ${language}.` },
                                meaning: { type: Type.STRING, description: `The meaning of the phrase in ${baseLanguage}.` }
                            }, required: ["phrase", "meaning"]
                        }
                    },
                    exampleDialogue: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT, properties: {
                                speaker: { type: Type.STRING },
                                line: { type: Type.STRING, description: `A line of dialogue in ${language}.` }
                            }, required: ["speaker", "line"]
                        }
                    }
                },
                required: ["advice", "keyPhrases", "exampleDialogue"]
            }
        },
        required: ["type", "response"]
    };

    const prompt = `A user who speaks ${baseLanguage} is learning ${language} and needs help with a real-world situation. Situation: "${situation}". Provide a structured JSON response containing: 1. 'advice' in clear ${baseLanguage}. 2. A list of 'keyPhrases' in ${language} with their ${baseLanguage} meanings. 3. A short 'exampleDialogue' in ${language} demonstrating the phrases. Follow the provided JSON schema precisely.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema }
    }));

    const parsed = JSON.parse(response.text.trim());
    return { ...parsed, situation: situation };
};

export const createChatSession = (systemInstruction: string): Chat => {
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: systemInstruction } });
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
    return await withRetry(() => chat.sendMessage({ message }));
};

export const generateCoDeveloperResponse = async (userPrompt: string, appContext: string = ''): Promise<string> => {
    const systemPrompt = `
You are an expert AI Co-Developer embedded in "VerbLume", a modern React/TypeScript language learning application.
Your goal is to help the user understand the app, debug issues, or brainstorm features.

### Tech Stack
- Framework: React 19 (Functional Components, Hooks)
- Language: TypeScript
- Styling: Tailwind CSS
- AI: Google Gemini API (@google/genai)
- Build Tool: Vite

### Project Structure
- /App.tsx: Main entry, handles global state (selection, baseLanguage) and routing.
- /services/geminiService.ts: Handles all interactions with Gemini API (content generation, chat).
- /hooks/: Custom hooks for state (useLanguages, useSavedLessons, usePerformance, useCategories, useStreak, usePoints, useActivityLog, useZoom).
- /components/: UI components.
  - /LearningModule.tsx: The core learning interface for all modes.
  - /CategoryView.tsx: Topic selection.
  - /LanguageSelector.tsx, /BaseLanguageSelector.tsx: Language management.
  - /ui/: Reusable UI (Button, Card, Spinner).

### Current App Context
${appContext}

### Instructions
1. **Be Context-Aware**: Use the provided "Current App Context" to tailor your answers. If the user is in a quiz, talk about quiz logic.
2. **Technical & Educational**: You can explain how the code works or suggest improvements.
3. **Code Snippets**: If asked for code, provide clean, modern React/Tailwind snippets enclosed in markdown code blocks (\`\`\`).
4. **Tone**: Friendly, professional, and encouraging.
5. **Brevity**: Keep explanations concise unless asked for detail.
`;

    const fullPrompt = `${systemPrompt}\n\nUser Query: "${userPrompt}"`;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt }));
        return response.text.trim();
    } catch (error) {
        console.error("Error in CoDeveloper response generation:", error);
        return "I'm sorry, I encountered an issue while processing that request.";
    }
};

const grammarTopicDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        topics: {
            type: Type.ARRAY,
            description: "An array containing details for each provided grammar topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    originalTopic: { type: Type.STRING, description: "The original English topic name provided in the input." },
                    topicInTargetLanguage: { type: Type.STRING, description: "The topic name accurately translated into the target language." },
                    topicInBaseLanguage: { type: Type.STRING, description: "The topic name accurately translated into the base language." },
                    pronunciationEn: { type: Type.STRING, description: "Phonetic guide for the target language topic name, using English letters." },
                    pronunciationInBase: { type: Type.STRING, description: "Phonetic guide for the target language topic name, using the base language's native script." },
                },
                required: ["originalTopic", "topicInTargetLanguage", "topicInBaseLanguage", "pronunciationEn", "pronunciationInBase"]
            }
        }
    },
    required: ["topics"]
};

export const generateGrammarTopicDetails = async (
    topics: string[],
    language: Language,
    baseLanguage: Language
): Promise<GrammarTopicDetails[]> => {
    const BATCH_SIZE = 25;
    const allDetails: GrammarTopicDetails[] = [];

    for (let i = 0; i < topics.length; i += BATCH_SIZE) {
        const batchTopics = topics.slice(i, i + BATCH_SIZE);

        const prompt = `You are a linguistics expert. For the following list of English grammar topics, provide translations and phonetic guides.
        Target Language: ${language}
        Base Language: ${baseLanguage}

        For each topic, provide:
        1. The translation in the target language.
        2. The translation in the base language.
        3. A phonetic pronunciation guide for the target language translation using simple English letters.
        4. A phonetic pronunciation guide for the target language translation using the native script of the base language.

        List of topics:
        ${batchTopics.join('\n')}

        Return the data as a JSON object matching the provided schema. Ensure every original topic from the list is present in the response.`;

        try {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: grammarTopicDetailsSchema,
                }
            }));

            const parsed = JSON.parse(response.text.trim());
            if (parsed.topics && Array.isArray(parsed.topics)) {
                allDetails.push(...parsed.topics);
            }
        } catch (error) {
            console.error(`Error generating grammar topic details for batch starting with "${batchTopics[0]}":`, error);
            // Continue with the next batch, so a single failure doesn't stop everything.
        }
    }

    return allDetails;
};
