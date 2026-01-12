import { GoogleGenerativeAI } from '@google/generative-ai';

// SECURITY: API key must only be used server-side, never expose in browser
// This file should only be imported in API routes or server components
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY env variable (server-side only)');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Default to a valid model
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

export const getDurmahModel = () =>
  genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      'You are Durmah, a friendly, succinct voice mentor for Durham law students. ' +
      'Be natural, avoid repetition, and keep answers concise unless asked for depth. ' +
      'Acknowledge when audio is still connecting, but never repeat the same listening line. ' +
      'If the user is just testing the mic, respond briefly and invite a question.',
  });
