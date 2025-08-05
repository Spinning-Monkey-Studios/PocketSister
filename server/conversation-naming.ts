import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Conversation Naming Service - Uses Gemini to intelligently name conversations
 * This system identifies us as the APPLICATION when communicating with Gemini
 */
export class ConversationNamingService {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: this.getNamingInstruction()
    });
  }

  private getNamingInstruction(): string {
    return `You are the CONVERSATION NAMING SYSTEM for "My Pocket Sister" AI companion app.

    IMPORTANT: You are NOT talking to a child. You are an internal system component helping the application manage conversation organization.

    Your role is to analyze conversation content and generate intelligent titles and descriptions that help children organize their saved conversations.

    NAMING GUIDELINES:
    - Create short, memorable titles (2-6 words)
    - Focus on the main topic or theme of the conversation
    - Use child-friendly language
    - Make titles specific enough to distinguish from other conversations
    - Avoid generic titles like "Chat" or "Conversation"

    DESCRIPTION GUIDELINES:
    - Write 1-2 sentence descriptions (under 100 characters)
    - Capture the key topics discussed
    - Use engaging, child-friendly language
    - Help the child remember what the conversation was about

    EXAMPLES:
    - Title: "My Cat Trixie's Tricks" / Description: "Talked about teaching Trixie to sit and shake hands"
    - Title: "Science Fair Project Ideas" / Description: "Brainstormed cool experiments with planets and space"
    - Title: "Friendship Drama Help" / Description: "Got advice about handling a conflict with best friend"
    - Title: "Art Class Painting Tips" / Description: "Learned watercolor techniques and color mixing"

    Respond with a JSON object containing:
    {
      "title": "Generated title",
      "description": "Generated description"
    }`;
  }

  async generateConversationName(conversationText: string): Promise<{
    title: string;
    description: string;
  }> {
    try {
      const prompt = `
        SYSTEM CONVERSATION NAMING REQUEST
        
        Please analyze the following conversation and generate an intelligent title and description:
        
        CONVERSATION CONTENT:
        ${conversationText.substring(0, 2000)} ${conversationText.length > 2000 ? '...' : ''}
        
        Generate a title and description that would help a child easily identify and find this conversation later.
      `;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        const parsed = JSON.parse(responseText);
        return {
          title: parsed.title || 'Untitled Conversation',
          description: parsed.description || 'A conversation with your AI companion'
        };
      } catch (parseError) {
        // Fallback: extract title and description from response
        return this.extractFromResponse(responseText, conversationText);
      }

    } catch (error) {
      console.error('Error generating conversation name:', error);
      return this.generateFallbackName(conversationText);
    }
  }

  private extractFromResponse(responseText: string, conversationText: string): {
    title: string;
    description: string;
  } {
    // Try to extract title and description from the response
    const titleMatch = responseText.match(/title['":\s]*([^,}\n]+)/i);
    const descMatch = responseText.match(/description['":\s]*([^,}\n]+)/i);
    
    return {
      title: titleMatch?.[1]?.replace(/['"]/g, '').trim() || this.generateFallbackName(conversationText).title,
      description: descMatch?.[1]?.replace(/['"]/g, '').trim() || this.generateFallbackName(conversationText).description
    };
  }

  private generateFallbackName(conversationText: string): {
    title: string;
    description: string;
  } {
    // Simple fallback naming based on content analysis
    const text = conversationText.toLowerCase();
    const words = text.split(/\s+/).slice(0, 100); // First 100 words
    
    // Look for common topics
    const topics = {
      pets: ['cat', 'dog', 'pet', 'animal', 'puppy', 'kitten'],
      school: ['school', 'homework', 'teacher', 'class', 'test', 'project'],
      friends: ['friend', 'friends', 'friendship', 'play', 'hang', 'together'],
      family: ['mom', 'dad', 'sister', 'brother', 'family', 'parent'],
      hobbies: ['draw', 'paint', 'art', 'music', 'dance', 'sing', 'read'],
      feelings: ['sad', 'happy', 'worried', 'excited', 'nervous', 'proud']
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        const date = new Date().toLocaleDateString();
        return {
          title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Chat`,
          description: `Conversation about ${topic} from ${date}`
        };
      }
    }

    // Default fallback
    const date = new Date().toLocaleDateString();
    return {
      title: `Chat from ${date}`,
      description: 'A conversation with your AI companion'
    };
  }

  async generateGroupSuggestions(childId: string, conversationTitles: string[]): Promise<{
    suggestedGroups: Array<{
      name: string;
      color: string;
      icon: string;
      conversations: string[];
    }>;
  }> {
    try {
      const prompt = `
        SYSTEM GROUP SUGGESTION REQUEST
        
        Analyze these conversation titles and suggest logical groups for organization:
        
        CONVERSATION TITLES:
        ${conversationTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')}
        
        Suggest 2-4 groups that would help organize these conversations. Respond with JSON:
        {
          "suggestedGroups": [
            {
              "name": "Group Name",
              "color": "#3B82F6",
              "icon": "📚",
              "conversations": ["Title 1", "Title 2"]
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        return JSON.parse(responseText);
      } catch {
        return { suggestedGroups: [] };
      }

    } catch (error) {
      console.error('Error generating group suggestions:', error);
      return { suggestedGroups: [] };
    }
  }
}

export const conversationNamingService = new ConversationNamingService();