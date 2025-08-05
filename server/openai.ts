import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import type { User, ChildProfile, PersonalityProfile } from "@shared/schema";

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export class ChatService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private currentProvider: AIProvider = 'openai';

  constructor(config?: AIConfig) {
    if (config) {
      this.setProvider(config);
    }
  }

  setProvider(config: AIConfig) {
    this.currentProvider = config.provider;
    
    switch (config.provider) {
      case 'openai':
        this.openai = new OpenAI({ apiKey: config.apiKey });
        break;
      case 'gemini':
        this.gemini = new GoogleGenerativeAI(config.apiKey);
        break;
      case 'claude':
        // Claude integration would go here
        throw new Error('Claude integration not yet implemented');
    }
  }

  private getPersonalizedPrompt(child: ChildProfile, user: User, personality?: PersonalityProfile): string {
    const ageGroup = child.age <= 12 ? "younger child" : child.age <= 15 ? "young teen" : "teen";
    const supportLevel = personality?.traits?.supportiveness || 0.8;
    const playfulness = personality?.traits?.playfulness || 0.7;
    const empathy = personality?.traits?.empathy || 0.9;

    return `You are ${child.companionName || 'Stella'}, a caring AI sister and companion for ${child.name}, a ${child.age}-year-old girl. 

PERSONALITY TRAITS (scale 0-1):
- Supportiveness: ${supportLevel}
- Playfulness: ${playfulness} 
- Empathy: ${empathy}

AGE-APPROPRIATE GUIDELINES for ${ageGroup}:
- Use language appropriate for a ${child.age}-year-old
- Focus on ${child.age <= 12 ? 'fun activities, friendship, and building confidence' : 'personal growth, handling challenges, and developing independence'}
- ${child.age <= 12 ? 'Keep conversations light and encouraging' : 'Can discuss more complex topics like identity, goals, and relationships'}

CORE PRINCIPLES:
- Always be encouraging, positive, and supportive
- Remember previous conversations and reference them naturally
- Provide age-appropriate advice on friendship, school, creativity, and self-care
- Use emojis moderately to keep conversations warm but not overwhelming
- If concerning topics arise (bullying, depression, family issues), provide support but suggest talking to a trusted adult
- Encourage healthy habits, creativity, and personal growth
- Never provide inappropriate content or advice beyond your role as a supportive companion

CONVERSATION STYLE:
- Be like a caring older sister - understanding, fun, but responsible
- Ask follow-up questions to show genuine interest
- Celebrate achievements and provide comfort during challenges
- Share relevant tips, activities, or encouragement based on the conversation

Remember: You're building a trusting relationship with ${child.name}. Be consistent, caring, and always prioritize her wellbeing and positive development.`;
  }

  async generateResponse(
    userId: string, 
    message: string, 
    conversationHistory: Array<{role: string, content: string}> = [],
    imageData?: { base64: string; mimeType: string; filename: string }
  ): Promise<{ content: string; metadata: any }> {
    if (this.currentProvider === 'openai' && !this.openai) {
      throw new Error("OpenAI API key not configured");
    }
    if (this.currentProvider === 'gemini' && !this.gemini) {
      throw new Error("Gemini API key not configured");
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get child profiles for the user
    const childProfiles = await storage.getChildProfiles(userId);
    if (childProfiles.length === 0) {
      throw new Error("No child profile found for user");
    }
    
    const child = childProfiles[0]; // Use first child profile for now
    const personality = await storage.getPersonalityProfile(userId);
    const systemPrompt = this.getPersonalizedPrompt(child, user, personality);

    // Analyze message for metadata
    let metadata: any = {};
    
    if (this.currentProvider === 'openai') {
      return await this.generateOpenAIResponse(userId, message, conversationHistory, systemPrompt, imageData);
    } else if (this.currentProvider === 'gemini') {
      return await this.generateGeminiResponse(userId, message, conversationHistory, systemPrompt, imageData);
    }

    throw new Error("No AI provider configured");
  }

  private async generateOpenAIResponse(
    userId: string,
    message: string,
    conversationHistory: Array<{role: string, content: string}>,
    systemPrompt: string,
    imageData?: { base64: string; mimeType: string; filename: string }
  ): Promise<{ content: string; metadata: any }> {
    if (!this.openai) throw new Error("OpenAI not configured");

    // Analyze message for metadata
    const metadata = await this.analyzeMessage(message);

    // Build conversation context with optional image
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
    ];

    // Add user message with optional image
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: message || "What do you see in this image?" },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageData.mimeType};base64,${imageData.base64}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: message });
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        max_tokens: 500,
        temperature: 0.8,
      });

      const content = response.choices[0].message.content || "I'm sorry, I couldn't generate a response right now.";

      // Update personality profile based on interaction
      await this.updatePersonalityProfile(userId, message, content, metadata);

      return {
        content,
        metadata: {
          ...metadata,
          tokenUsage: response.usage,
          model: "gpt-4o",
          provider: "openai",
          hasImage: !!imageData
        }
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate response");
    }
  }

  private async generateGeminiResponse(
    userId: string,
    message: string,
    conversationHistory: Array<{role: string, content: string}>,
    systemPrompt: string,
    imageData?: { base64: string; mimeType: string; filename: string }
  ): Promise<{ content: string; metadata: any }> {
    if (!this.gemini) throw new Error("Gemini not configured");

    try {
      // Prepare content array for Gemini
      const contents: any[] = [
        { role: "user", parts: [{ text: systemPrompt }] }
      ];

      // Add conversation history
      conversationHistory.slice(-10).forEach(msg => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      });

      // Add current message with optional image
      const currentParts: any[] = [{ text: message || "What do you see in this image?" }];
      
      if (imageData) {
        currentParts.push({
          inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType
          }
        });
      }

      contents.push({
        role: "user",
        parts: currentParts
      });

      const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const response = await model.generateContent({
        contents
      });

      const content = response.response.text() || "I'm sorry, I couldn't generate a response right now.";

      // Simple metadata for Gemini (no built-in analysis like OpenAI)
      const metadata = {
        provider: "gemini",
        model: "gemini-2.0-flash-exp",
        hasImage: !!imageData,
        sentiment: "neutral", // Could enhance with separate analysis
        topics: []
      };

      // Update personality profile
      await this.updatePersonalityProfile(userId, message, content, metadata);

      return { content, metadata };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate response");
    }
  }

  private async analyzeMessage(message: string): Promise<any> {
    if (!this.openai) return {};

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze this message and return JSON with: sentiment (positive/neutral/negative), topics (array), mood (happy/sad/excited/worried/confused/angry), concerningContent (boolean for anything parents should know about)"
          },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Failed to analyze message:", error);
      return {};
    }
  }

  private async updatePersonalityProfile(userId: string, userMessage: string, aiResponse: string, metadata: any): Promise<void> {
    try {
      let profile = await storage.getPersonalityProfile(userId);
      
      if (!profile) {
        // Create initial personality profile
        await storage.updatePersonalityProfile(userId, {
          traits: {
            supportiveness: 0.8,
            playfulness: 0.7,
            formality: 0.3,
            empathy: 0.9
          },
          learningData: {
            interactions: 1,
            positiveResponses: 0,
            preferredTopics: metadata.topics || [],
            adaptationNotes: []
          }
        });
      } else {
        // Update existing profile
        const updatedLearningData = {
          ...profile.learningData,
          interactions: (profile.learningData?.interactions || 0) + 1,
          positiveResponses: profile.learningData?.positiveResponses || 0,
          preferredTopics: Array.from(new Set([...(profile.learningData?.preferredTopics || []), ...(metadata.topics || [])])),
          adaptationNotes: profile.learningData?.adaptationNotes || []
        };

        await storage.updatePersonalityProfile(userId, {
          learningData: updatedLearningData
        });
      }
    } catch (error) {
      console.error("Failed to update personality profile:", error);
    }
  }
}