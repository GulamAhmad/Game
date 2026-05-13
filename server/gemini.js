const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Question archetypes ──────────────────────────────────────────────────────
const QUESTION_TYPES = [
  {
    type: "personal preference",
    instruction: "Ask about a specific personal preference or opinion — but make it niche, not generic (avoid 'what do you like about X').",
    example: "What's one thing about {topic} that most people overlook but you think is the best part?"
  },
  {
    type: "would you rather",
    instruction: "Create a 'would you rather' dilemma with two specific {topic}-related options.",
    example: "Would you rather [specific option A related to {topic}] or [specific option B]?"
  },
  {
    type: "hot take",
    instruction: "Ask for an unpopular or controversial opinion about {topic}.",
    example: "What's your most controversial take about {topic} that most people would disagree with?"
  },
  {
    type: "ranking",
    instruction: "Ask the player to rank 3 specific things within {topic} — list those 3 things explicitly.",
    example: "Rank these from best to worst: [thing1], [thing2], [thing3] — all related to {topic}."
  },
  {
    type: "hypothetical scenario",
    instruction: "Create a fun 'what if' scenario involving {topic}.",
    example: "If {topic} suddenly disappeared from the world, what would you miss most?"
  },
  {
    type: "embarrassing or funny memory",
    instruction: "Ask about an embarrassing, funny, or unexpected moment related to {topic}.",
    example: "Describe a time {topic} completely surprised or embarrassed you."
  },
  {
    type: "describe to a stranger",
    instruction: "Ask the player to describe something about {topic} in a very specific, limited way.",
    example: "How would you describe your experience with {topic} in exactly 3 words?"
  },
  {
    type: "overrated vs underrated",
    instruction: "Ask what is overrated or underrated within {topic}.",
    example: "What's one thing about {topic} that everyone hypes up but you think is totally overrated?"
  },
  {
    type: "first time experience",
    instruction: "Ask about their first real encounter or memory related to {topic}.",
    example: "What was your very first experience with {topic} like, and how has your opinion changed since?"
  },
  {
    type: "this or that",
    instruction: "Give two specific sub-categories or styles within {topic} and ask them to pick and defend one.",
    example: "Are you more of a [sub-type A] or [sub-type B] person when it comes to {topic}?"
  },
  {
    type: "recommendation",
    instruction: "Ask what they would recommend to a total beginner about {topic}, and why.",
    example: "If someone had never experienced {topic} before, what's the one thing you'd tell them to try first?"
  },
  {
    type: "dealbreaker",
    instruction: "Ask what would completely ruin their experience of {topic}.",
    example: "What's the one thing that instantly kills your enjoyment of {topic}?"
  },
];

// ── Fallbacks per topic (used when API fails) ────────────────────────────────
const FALLBACKS = {
  food: { normal: "What's a food combo you love that others find weird?", imposter: "What's a food most people eat the wrong way?" },
  travel: { normal: "What's the most underrated place you've ever visited?", imposter: "What do most tourists get wrong about travelling?" },
  movies: { normal: "What film made you cry that you'd never publicly admit to?", imposter: "What movie genre do people take too seriously?" },
  animals: { normal: "Which animal do you think is secretly smarter than it looks?", imposter: "What animal do people treat too much like a pet?" },
  default: { normal: "What's your most unpopular opinion on this topic?", imposter: "What do most people misunderstand about this topic?" },
};

// ── Main function ─────────────────────────────────────────────────────────────
async function generateQuestions(userTopic) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const topics = [
    "food", "travel", "hobbies", "childhood", "superpowers",
    "movies", "work", "technology", "daily routines", "animals"
  ];

  const topic = (userTopic && userTopic !== "Random")
    ? userTopic
    : topics[Math.floor(Math.random() * topics.length)];

  // Pick a random question archetype each call
  const archetype = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];

  const prompt = `
You are writing questions for a party game called "Who is the Imposter?".

Topic: ${topic}
Question style you MUST use: "${archetype.type}"
Style instruction: ${archetype.instruction}
Style example (adapt this, don't copy it): "${archetype.example.replace(/\{topic\}/g, topic)}"

Rules:
- NEVER use the pattern "What do you like/enjoy about ${topic}?" — this is banned.
- The question MUST match the "${archetype.type}" style above.
- Question A (normal) → for players who know the topic well. Specific and natural.
- Question B (imposter) → a subtly different version. Close enough that an imposter thinks they can fake it, but a real fan would notice the difference. 
  Examples of subtle differences: wrong framing, slightly off assumption, too vague, or reversed premise.
- Both questions must be SHORT (one sentence), fun, and conversational.
- Do NOT explain your reasoning. Return ONLY valid JSON.

Return this exact JSON structure:
{
  "normal": "Question A here",
  "imposter": "Question B here"
}
`;

  try {
    console.log(`Generating [${archetype.type}] question for topic: ${topic}...`);

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      throw new Error("Gemini API Key is missing or not configured in .env");
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in Gemini response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Safety check — reject if it still slips through a generic pattern
    const banned = ["what do you like", "what do you enjoy", "what is something you really"];
    const isBanned = banned.some(phrase =>
      parsed.normal?.toLowerCase().includes(phrase) ||
      parsed.imposter?.toLowerCase().includes(phrase)
    );

    if (isBanned) {
      console.warn("Banned question pattern detected — retrying...");
      return generateQuestions(userTopic); // retry once
    }

    console.log(`✅ [${archetype.type}] →`, parsed);
    return { ...parsed, topic, questionType: archetype.type }; // optional: expose type for debugging
  } catch (error) {
    console.error("GEMINI ERROR:", error.message || error);
    const fallback = FALLBACKS[topic] || FALLBACKS["default"];
    return { ...fallback, topic };
  }
}

module.exports = { generateQuestions };