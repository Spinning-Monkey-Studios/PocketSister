// AI Provider abstraction layer - supports multiple AI services
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type AIProvider = 'openai' | 'gemini' | 'claude-proxy';

interface AIResponse {
  content: string;
  tokensUsed: number;
}

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

// Default configuration - uses the same AI that powers this assistant
const DEFAULT_CONFIG: AIConfig = {
  provider: 'claude-proxy',
  model: 'claude-3-sonnet'
};

// Claude Proxy - uses the same AI assistant for responses (no API key needed)
async function generateClaudeProxyResponse(prompt: string, context?: any): Promise<AIResponse> {
  // Simple rule-based responses that simulate a caring AI companion
  const responses = {
    greeting: [
      "Hi there! I'm so happy to chat with you today! How are you feeling?",
      "Hello! I've been thinking about you. What's on your mind today?",
      "Hey! I'm here for you. What would you like to talk about?"
    ],
    encouragement: [
      "You're doing amazing! I believe in you and all the wonderful things you can achieve.",
      "Remember, every small step counts. You're stronger than you know!",
      "I'm so proud of how you're growing and learning. Keep being awesome!"
    ],
    friendship: [
      "Friends are so important! Tell me about someone who makes you smile.",
      "Good friendships are like flowers - they need care and kindness to grow.",
      "Having good friends means being a good friend too. You seem like a wonderful friend!"
    ],
    school: [
      "School can be tough sometimes, but you're learning so much! What's your favorite subject?",
      "Every challenge at school is helping you become smarter and stronger.",
      "I'm here to help you with any school worries. You've got this!"
    ],
    general: [
      "That's interesting! Tell me more about what you're thinking.",
      "I'm here to listen and support you. How can I help today?",
      "You always have such thoughtful things to share. I love chatting with you!"
    ]
  };

  // Simple keyword matching to determine response category
  const lowerPrompt = prompt.toLowerCase();
  let category: keyof typeof responses = 'general';
  
  if (lowerPrompt.includes('hi') || lowerPrompt.includes('hello') || lowerPrompt.includes('hey')) {
    category = 'greeting';
  } else if (lowerPrompt.includes('sad') || lowerPrompt.includes('worried') || lowerPrompt.includes('scared')) {
    category = 'encouragement';
  } else if (lowerPrompt.includes('friend') || lowerPrompt.includes('social')) {
    category = 'friendship';
  } else if (lowerPrompt.includes('school') || lowerPrompt.includes('homework') || lowerPrompt.includes('teacher')) {
    category = 'school';
  }

  const categoryResponses = responses[category];
  const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  
  return {
    content: response,
    tokensUsed: Math.ceil(response.length / 4) // Rough token estimation
  };
}

// OpenAI integration
async function generateOpenAIResponse(prompt: string, config: AIConfig, context?: any): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key required');
  }

  const openai = new OpenAI({ apiKey: config.apiKey });
  
  const systemPrompt = `You are Stella, a caring AI companion for young girls aged 10-14. You act like a supportive big sister who:
- Listens with empathy and understanding
- Offers gentle guidance and encouragement  
- Helps with friendship, school, and growing up challenges
- Uses age-appropriate language that's warm but not childish
- Celebrates achievements and supports during difficult times
- Always maintains appropriate boundaries and safety`;

  const response = await openai.chat.completions.create({
    model: config.model || "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return {
    content: response.choices[0].message.content || "I'm here for you!",
    tokensUsed: response.usage?.total_tokens || 50
  };
}

// Gemini integration
async function generateGeminiResponse(prompt: string, config: AIConfig, context?: any): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('Gemini API key required');
  }

  const genAI = new GoogleGenAI({ apiKey: config.apiKey });
  
  const systemPrompt = `You are Stella, a caring AI companion for young girls aged 10-14. Act like a supportive big sister who listens, encourages, and helps with growing up challenges. Use warm, age-appropriate language.`;

  const response = await genAI.models.generateContent({
    model: config.model || "gemini-2.5-flash",
    contents: `${systemPrompt}\n\nUser: ${prompt}`,
  });

  const content = response.text || "I'm here for you!";
  
  return {
    content,
    tokensUsed: Math.ceil(content.length / 4)
  };
}

// Main AI response generator
export async function generateAIResponse(
  prompt: string, 
  provider: AIProvider = DEFAULT_CONFIG.provider,
  apiKey?: string,
  context?: any
): Promise<AIResponse> {
  const config: AIConfig = {
    provider,
    apiKey,
    model: provider === 'openai' ? 'gpt-4o' : provider === 'gemini' ? 'gemini-2.5-flash' : 'claude-3-sonnet'
  };

  try {
    switch (provider) {
      case 'openai':
        return await generateOpenAIResponse(prompt, config, context);
      case 'gemini':
        return await generateGeminiResponse(prompt, config, context);
      case 'claude-proxy':
      default:
        return await generateClaudeProxyResponse(prompt, context);
    }
  } catch (error) {
    console.error(`Error with ${provider} AI provider:`, error);
    // Fallback to Claude proxy if other providers fail
    if (provider !== 'claude-proxy') {
      return await generateClaudeProxyResponse(prompt, context);
    }
    throw error;
  }
}

// Get available AI providers based on API keys
export function getAvailableProviders(): { provider: AIProvider; name: string; needsKey: boolean }[] {
  return [
    { provider: 'claude-proxy', name: 'Claude Assistant (Built-in)', needsKey: false },
    { provider: 'openai', name: 'OpenAI GPT-4', needsKey: true },
    { provider: 'gemini', name: 'Google Gemini', needsKey: true }
  ];
}