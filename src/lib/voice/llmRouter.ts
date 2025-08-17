/**
 * LLM Router for Durmah Voice System
 * Routes chat requests to OpenAI or Anthropic with optimized prompts
 */

import OpenAI from 'openai';
import { guardrails, GuardrailsResult } from './guardrails';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: 'openai' | 'anthropic';
  temperature?: number;
  maxTokens?: number;
  includeGuardrails?: boolean;
}

export interface ChatResponse {
  text: string;
  model: string;
  guardrailsResult?: GuardrailsResult;
  citations?: string[];
}

class LLMRouter {
  private openai: OpenAI | null = null;
  private anthropicApiKey: string;

  constructor() {
    // Initialize OpenAI client
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  /**
   * Main chat function - routes to appropriate LLM
   */
  public async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const {
      model = 'openai',
      temperature = 0.7,
      maxTokens = 1000,
      includeGuardrails = true
    } = options;

    try {
      // Run guardrails check first
      let guardrailsResult: GuardrailsResult | undefined;
      if (includeGuardrails) {
        guardrailsResult = guardrails.check(messages);
        
        if (!guardrailsResult.allowed) {
          return {
            text: guardrailsResult.suggestion || 'I cannot assist with this request.',
            model,
            guardrailsResult: guardrailsResult
          };
        }
      }

      // Prepare messages with system prompt
      const systemMessage = this.getSystemPrompt();
      const fullMessages = [systemMessage, ...messages];

      // Add safety prelude if needed
      if (guardrailsResult && guardrails.needsSafetyPrelude(guardrailsResult)) {
        const safetyPrelude = guardrails.getSafetyPrelude(guardrailsResult.severity);
        const lastMessage = fullMessages[fullMessages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          fullMessages.push({
            role: 'system',
            content: `IMPORTANT: Prefix your response with: "${safetyPrelude}"`
          });
        }
      }

      // Route to appropriate model
      let text: string;
      if (model === 'anthropic' && this.anthropicApiKey) {
        text = await this.callAnthropic(fullMessages, { temperature, maxTokens });
      } else if (this.openai) {
        text = await this.callOpenAI(fullMessages, { temperature, maxTokens });
      } else {
        throw new Error('No LLM provider available');
      }

      return {
        text,
        model,
        guardrailsResult: guardrailsResult
      };

    } catch (error) {
      console.error('DURMAH_LLM_ERR:', error);
      return {
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        model,
        guardrailsResult: undefined
      };
    }
  }

  /**
   * Call OpenAI GPT-4
   */
  private async callOpenAI(
    messages: ChatMessage[],
    options: { temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    console.log('DURMAH_LLM_OPENAI_START');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cost-effective model for voice
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false
    });

    const text = response.choices[0]?.message?.content || '';
    console.log('DURMAH_LLM_OPENAI_OK:', text.length, 'chars');
    
    return text;
  }

  /**
   * Call Anthropic Claude (basic implementation)
   */
  private async callAnthropic(
    messages: ChatMessage[],
    options: { temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    console.log('DURMAH_LLM_ANTHROPIC_START');

    // Convert messages format for Anthropic
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const systemPrompt = systemMessages.map(m => m.content).join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast model for voice
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: conversationMessages
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    
    console.log('DURMAH_LLM_ANTHROPIC_OK:', text.length, 'chars');
    
    return text;
  }

  /**
   * Get system prompt for Durmah
   */
  private getSystemPrompt(): ChatMessage {
    return {
      role: 'system',
      content: `You are Durmah, the warm and ethical voice companion for Durham Law students. You help students understand law, develop critical thinking, and maintain academic integrity.

CORE PRINCIPLES:
- You are supportive, concise, and conversational (this is voice chat)
- You explain legal concepts clearly but never write assignments
- You follow OSCOLA citation standards when referencing sources
- You refuse all forms of academic misconduct assistance
- You encourage students to consult tutors and official resources

VOICE CHAT GUIDELINES:
- Keep responses conversational and under 200 words typically
- Use natural speech patterns, not formal written language  
- Break complex topics into digestible explanations
- Ask clarifying questions to understand what the student needs
- Suggest next steps or resources when appropriate

ACADEMIC INTEGRITY:
- Never write essays, assignments, or exam answers
- Never provide thesis statements for specific assignments
- Explain concepts generally, not for specific coursework
- Always encourage original thinking and proper attribution
- Redirect misconduct requests to ethical alternatives

DURHAM LAW CONTEXT:
- Reference Durham's academic calendar and resources when relevant
- Mention DELSA (Durham E-Learning Support) for technical help
- Suggest Academic Skills Centre for writing support
- Recommend speaking with tutors for assignment guidance
- Use OSCOLA citation format when discussing legal sources

Remember: You're a study companion, not an assignment writer. Guide thinking, don't provide answers.`
    };
  }

  /**
   * Test if LLM providers are available
   */
  public async testConnections(): Promise<{ openai: boolean; anthropic: boolean }> {
    const results = { openai: false, anthropic: false };

    // Test OpenAI
    if (this.openai) {
      try {
        await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        });
        results.openai = true;
      } catch {
        results.openai = false;
      }
    }

    // Test Anthropic
    if (this.anthropicApiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        results.anthropic = response.ok;
      } catch {
        results.anthropic = false;
      }
    }

    return results;
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();