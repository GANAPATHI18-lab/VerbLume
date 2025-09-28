import type { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    name: "Core Grammar",
    icon: "✍️",
    subCategories: [
      // Verbs & Tenses
      "Verbs: To Be (Present/Past/Future)",
      "Verbs: To Have (Present/Past/Future)",
      "Verbs: To Do (Present/Past/Future)",
      "Simple Present Tense",
      "Simple Past Tense",
      "Simple Future Tense",
      "Present Continuous Tense",
      "Past Continuous Tense",
      "Future Continuous Tense",
      "Present Perfect Tense",
      "Past Perfect Tense",
      "Future Perfect Tense",
      "Present Perfect Continuous",
      "Past Perfect Continuous",
      "Future Perfect Continuous",
      "Regular vs. Irregular Verbs",
      "Transitive & Intransitive Verbs",
      "Active vs. Passive Voice",
      "The Imperative Mood",
      "The Subjunctive Mood",
      "Gerunds & Infinitives",
      "Participles (Present & Past)",

      // Nouns, Pronouns, & Determiners
      "Nouns: Singular & Plural (Regular/Irregular)",
      "Nouns: Countable & Uncountable",
      "Nouns: Common & Proper",
      "Nouns: Concrete & Abstract",
      "Nouns: Collective Nouns",
      "Possessive Nouns ('s)",
      "Pronouns: Subject & Object",
      "Pronouns: Possessive (my, your, mine, yours)",
      "Pronouns: Reflexive (myself, yourself)",
      "Pronouns: Demonstrative (this, that, these, those)",
      "Pronouns: Interrogative (who, what, which)",
      "Pronouns: Relative (who, which, that, whose)",
      "Pronouns: Indefinite (someone, anything, nobody)",
      "Determiners: Quantifiers (some, any, many, much, few)",

      // Articles
      "Articles: Definite (the) vs. Indefinite (a/an)",
      "Articles: Zero Article (No Article)",
      "Articles with Geographical Names",

      // Adjectives & Adverbs
      "Adjectives: Descriptive, Quantitative, Demonstrative",
      "Adjectives: Order of Adjectives",
      "Adjectives: Comparatives & Superlatives",
      "Adjectives ending in -ed vs. -ing",
      "Adverbs: Manner, Place, Time, Frequency",
      "Adverbs: Position in a Sentence",
      "Adverbs: Comparatives & Superlatives",
      "Adverbs of Degree (very, too, enough)",

      // Sentence Structure
      "Basic Sentence Structure (SVO)",
      "Compound Sentences (Conjunctions: for, and, nor, but, or, yet, so)",
      "Complex Sentences (Subordinating Conjunctions)",
      "Clauses: Main and Subordinate",
      "Clauses: Noun, Adjective, and Adverb Clauses",
      "Relative Clauses (Defining vs. Non-defining)",
      "Forming Questions: Yes/No",
      "Forming Questions: Wh- Questions (who, what, where)",
      "Tag Questions",
      "Negation (not, n't)",
      "Word Order & Inversion",

      // Prepositions & Conjunctions
      "Prepositions of Place (in, on, at, under, behind)",
      "Prepositions of Time (on, in, at, for, since, during)",
      "Prepositions of Movement (to, from, into, through)",
      "Prepositions with Verbs (Phrasal Verbs)",
      "Prepositions with Adjectives",
      "Conjunctions: Coordinating (and, but, or)",
      "Conjunctions: Subordinating (because, although, while)",
      "Conjunctions: Correlative (either/or, neither/nor, not only/but also)",

      // Conditionals
      "Zero Conditional (General Truths)",
      "First Conditional (Real Future Possibility)",
      "Second Conditional (Unreal Present/Future)",
      "Third Conditional (Unreal Past)",
      "Mixed Conditionals",
      "Wishes and Regrets (I wish / If only)",

      // Advanced Topics
      "Reported Speech (Direct & Indirect)",
      "Punctuation: Commas, Periods, Apostrophes",
      "Punctuation: Semicolons & Colons",
      "Causative Verbs (have, let, make)",
      "Emphasis and Inversion"
    ],
  },
  {
    name: "Auxiliary & Modal Verbs",
    icon: "🗣️",
    subCategories: [
      // Primary Auxiliaries
      "Primary Auxiliary: Forms of 'Be'",
      "Primary Auxiliary: Using 'Be' for Continuous Tenses",
      "Primary Auxiliary: Using 'Be' for Passive Voice",
      "Primary Auxiliary: Forms of 'Have'",
      "Primary Auxiliary: Using 'Have' for Perfect Tenses",
      "Primary Auxiliary: Forms of 'Do'",
      "Primary Auxiliary: Using 'Do' for Questions & Negatives",
      "Primary Auxiliary: Using 'Do' for Emphasis",

      // Modals: Ability & Possibility
      "Modal: 'Can' for Ability and Permission",
      "Modal: 'Could' for Past Ability and Polite Requests",
      "Modal: 'May' for Permission and Possibility",
      "Modal: 'Might' for Future Possibility",
      "Comparing 'Can', 'Could', 'May', 'Might'",

      // Modals: Obligation, Necessity & Advice
      "Modal: 'Must' for Strong Obligation",
      "Modal: 'Have to' for External Obligation",
      "Comparing 'Must' and 'Have to'",
      "Modal: 'Should' for Advice and Recommendations",
      "Modal: 'Ought to' for Moral Duty",
      "Modal: 'Had Better' for Strong Advice/Warnings",
      
      // Modals: Futurity & Intention
      "Modal: 'Will' for Future Actions and Promises",
      "Modal: 'Shall' for Formal Future and Offers",
      "Modal: 'Would' for Past Habits and Hypotheticals",
      "'Be Going To' for Future Plans",
      "Comparing 'Will' and 'Be Going To'",
      
      // Modals: Deduction & Speculation
      "Modals of Deduction (Present): Must, Might, Can't",
      "Modals of Deduction (Past): Must have, Might have, Can't have",
      
      // Semi-Modals & Phrasal Modals
      "Semi-Modal: 'Need to' for Necessity",
      "Semi-Modal: 'Used to' for Past Habits",
      "Semi-Modal: 'Be supposed to' for Expectations",
      "Semi-Modal: 'Be able to' for Ability",
      "Semi-Modal: 'Dare' for Courage",

      // Advanced Concepts
      "Perfect Modals: Should Have, Could Have, Would Have",
      "Negative Forms of Modal Verbs",
      "Questions with Modal Verbs"
    ]
  },
  {
    name: "Health & Wellness",
    icon: "⚕️",
    subCategories: ["Fitness", "Nutrition", "Mental Wellness", "Medicine", "Psychology", "Public Health"],
  },
  {
    name: "Business & Finance",
    icon: "💼",
    subCategories: ["Entrepreneurship", "Finance", "Marketing", "Leadership", "Economics", "Investing"],
  },
  {
    name: "Education & Learning",
    icon: "🎓",
    subCategories: ["Pedagogy", "Exam Preparation", "Academia", "Learning Techniques"],
  },
  {
    name: "Technology & Innovation",
    icon: "💻",
    subCategories: ["AI & Machine Learning", "Coding", "Cybersecurity", "Robotics", "Innovation"],
  },
  {
    name: "Environment & Sustainability",
    icon: "🌳",
    subCategories: ["Climate Change", "Ecology", "Conservation", "Renewable Energy"],
  },
  {
    name: "Society & Culture",
    icon: "🏛️",
    subCategories: ["Ethics", "Law & Politics", "Human Rights", "Anthropology"],
  },
  {
    name: "Arts & Literature",
    icon: "🎨",
    subCategories: ["Music", "Cinema", "Painting", "Storytelling", "Poetry", "Translation"],
  },
  {
    name: "Travel & History",
    icon: "✈️",
    subCategories: ["Geography", "World History", "Urban Planning", "Architecture"],
  },
  {
    name: "Sports & Athletics",
    icon: "⚽",
    subCategories: ["Training & Coaching", "Teamwork & Strategy", "Major Competitions"],
  },
   {
    name: "Science & Space",
    icon: "🚀",
    subCategories: ["Astronomy", "Astrophysics", "Space Exploration", "Cosmology"],
  },
  {
    name: "Lifestyle & Hobbies",
    icon: "🎮",
    subCategories: ["Culinary Arts", "Fashion Design", "Gaming", "Interior Design", "Pet Care"],
  }
];