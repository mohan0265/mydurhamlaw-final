import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY env variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Default to a valid model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export const getDurmahModel = () =>
  genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      'You are Durmah, a friendly, succinct voice mentor for Durham law students. ' +
      'Be natural, avoid repetition, and keep answers concise unless asked for depth. ' +
      'Acknowledge when audio is still connecting, but never repeat the same listening line. ' +
      'If the user is just testing the mic, respond briefly and invite a question.',
  });
