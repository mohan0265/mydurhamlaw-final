// src/server/openai.ts (server-only)
import OpenAI from "openai";

export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

// Helper to validate OpenAI API key on server startup
export function validateOpenAIKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY must start with "sk-" prefix');
  }
}

// Default model configurations
export const DEFAULT_MODEL = 'gpt-4';
export const DEFAULT_VOICE_MODEL = process.env.OPENAI_VOICE_MODEL || 'shimmer';