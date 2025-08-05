import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Avatar Graphics Generator using Google Gemini
 * Generates missing avatar components using AI art generation
 */
export class AvatarGraphicsGenerator {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  private graphicsDir = path.join(process.cwd(), 'client/src/assets/avatar-graphics');

  // Define comprehensive avatar component features
  static readonly AVATAR_FEATURES = {
    faces: [
      'round-happy', 'round-neutral', 'round-sad', 'round-excited', 'round-sleepy',
      'oval-happy', 'oval-neutral', 'oval-sad', 'oval-excited', 'oval-sleepy',
      'heart-happy', 'heart-neutral', 'heart-sad', 'heart-excited', 'heart-sleepy'
    ],
    eyes: [
      'large-brown', 'large-blue', 'large-green', 'large-hazel',
      'almond-brown', 'almond-blue', 'almond-green', 'almond-hazel',
      'round-brown', 'round-blue', 'round-green', 'round-hazel',
      'sparkling-brown', 'sparkling-blue', 'sparkling-green', 'sparkling-hazel'
    ],
    hair: [
      'long-straight-blonde', 'long-straight-brown', 'long-straight-black', 'long-straight-red',
      'long-curly-blonde', 'long-curly-brown', 'long-curly-black', 'long-curly-red',
      'short-straight-blonde', 'short-straight-brown', 'short-straight-black', 'short-straight-red',
      'short-curly-blonde', 'short-curly-brown', 'short-curly-black', 'short-curly-red',
      'braids-blonde', 'braids-brown', 'braids-black', 'braids-red',
      'ponytail-blonde', 'ponytail-brown', 'ponytail-black', 'ponytail-red',
      'bun-blonde', 'bun-brown', 'bun-black', 'bun-red'
    ],
    outfits: [
      'casual-tshirt-jeans', 'casual-hoodie-jeans', 'casual-dress-simple',
      'formal-blazer-skirt', 'formal-dress-elegant', 'formal-suit',
      'sporty-athletic-wear', 'sporty-tennis-outfit', 'sporty-dance-wear',
      'creative-artist-smock', 'creative-bohemian-dress', 'creative-unique-style',
      'seasonal-winter-coat', 'seasonal-summer-sundress', 'seasonal-autumn-layers',
      'party-sparkly-dress', 'party-fun-outfit', 'party-celebration-wear'
    ],
    accessories: [
      'glasses-round', 'glasses-square', 'glasses-cat-eye', 'glasses-sunglasses',
      'jewelry-earrings-studs', 'jewelry-earrings-hoops', 'jewelry-necklace-simple', 'jewelry-bracelet',
      'hair-accessories-headband', 'hair-accessories-bow', 'hair-accessories-clips',
      'bags-backpack', 'bags-purse', 'bags-messenger',
      'hats-baseball-cap', 'hats-beanie', 'hats-sun-hat'
    ],
    backgrounds: [
      'bedroom-cozy', 'bedroom-modern', 'bedroom-colorful',
      'school-classroom', 'school-library', 'school-cafeteria',
      'outdoor-park', 'outdoor-beach', 'outdoor-garden', 'outdoor-playground',
      'home-living-room', 'home-kitchen', 'home-study-room',
      'special-party-venue', 'special-concert-stage', 'special-art-studio'
    ]
  };

  constructor() {
    this.ensureGraphicsDirectoryExists();
  }

  private async ensureGraphicsDirectoryExists() {
    try {
      await fs.mkdir(this.graphicsDir, { recursive: true });
      
      // Create subdirectories for each feature category
      for (const category of Object.keys(AvatarGraphicsGenerator.AVATAR_FEATURES)) {
        await fs.mkdir(path.join(this.graphicsDir, category), { recursive: true });
      }
    } catch (error) {
      console.error('Error creating graphics directory:', error);
    }
  }

  /**
   * Get list of missing avatar graphics that need to be generated
   */
  async getMissingGraphics(): Promise<{
    category: string;
    feature: string;
    filePath: string;
  }[]> {
    const missing: { category: string; feature: string; filePath: string; }[] = [];

    for (const [category, features] of Object.entries(AvatarGraphicsGenerator.AVATAR_FEATURES)) {
      for (const feature of features) {
        const filePath = path.join(this.graphicsDir, category, `${feature}.svg`);
        
        try {
          await fs.access(filePath);
          // File exists, skip
        } catch {
          // File doesn't exist, add to missing list
          missing.push({
            category,
            feature,
            filePath
          });
        }
      }
    }

    return missing;
  }

  /**
   * Generate SVG graphic for specific avatar component using Gemini
   */
  async generateAvatarComponent(category: string, feature: string): Promise<string> {
    console.log(`🎨 Generating ${category}/${feature} avatar component`);

    const prompt = this.buildPromptForComponent(category, feature);
    
    try {
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `${prompt}

IMPORTANT: You are an APPLICATION generating avatar graphics, not a user. Respond only with clean SVG code without any explanatory text, markdown formatting, or code blocks. The SVG should be production-ready for a young girl's avatar creation game.`
          }]
        }]
      });

      const response = result.response.text();
      
      // Clean the response to ensure it's pure SVG
      const svgContent = this.cleanSvgResponse(response);
      
      if (!svgContent.includes('<svg')) {
        throw new Error('Generated content is not valid SVG');
      }

      console.log(`✅ Generated ${category}/${feature} (${svgContent.length} chars)`);
      return svgContent;

    } catch (error) {
      console.error(`❌ Failed to generate ${category}/${feature}:`, error);
      throw error;
    }
  }

  private buildPromptForComponent(category: string, feature: string): string {
    const basePrompts = {
      faces: `Create a cute, child-friendly face shape for a young girl's avatar. Style: ${feature}. Make it warm, welcoming, and age-appropriate for 10-14 year olds.`,
      eyes: `Create beautiful, expressive eyes for a young girl's avatar. Style: ${feature}. Make them bright, friendly, and full of personality.`,
      hair: `Create a stylish hairstyle for a young girl's avatar. Style: ${feature}. Make it trendy, well-groomed, and suitable for school/casual settings.`,
      outfits: `Create a fashionable outfit for a young girl's avatar. Style: ${feature}. Make it age-appropriate, trendy, and something a 10-14 year old would love to wear.`,
      accessories: `Create a cute accessory for a young girl's avatar. Style: ${feature}. Make it fun, stylish, and something that adds personality to the character.`,
      backgrounds: `Create a pleasant background scene for a young girl's avatar. Style: ${feature}. Make it colorful, inviting, and suitable for a positive social environment.`
    };

    const categoryPrompt = basePrompts[category as keyof typeof basePrompts] || 
      `Create a ${category} component for a young girl's avatar with style: ${feature}`;

    return `${categoryPrompt}

Requirements:
- Create as SVG format with viewBox="0 0 200 200"
- Use bright, cheerful colors appropriate for young girls
- Ensure clean, simple lines suitable for UI display
- Make it scalable and crisp at different sizes
- Style should be modern, friendly, and encouraging
- Avoid overly complex details that won't render well at small sizes
- Use safe, web-compatible colors
- Ensure the design promotes self-confidence and positivity`;
  }

  private cleanSvgResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```svg\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace and explanatory text
    cleaned = cleaned.trim();
    
    // Extract SVG content if there's extra text
    const svgMatch = cleaned.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      cleaned = svgMatch[0];
    }
    
    // Ensure proper SVG structure
    if (!cleaned.startsWith('<svg')) {
      throw new Error('Invalid SVG format in generated content');
    }
    
    return cleaned;
  }

  /**
   * Save generated SVG to file system
   */
  async saveAvatarGraphic(category: string, feature: string, svgContent: string): Promise<string> {
    const filePath = path.join(this.graphicsDir, category, `${feature}.svg`);
    
    try {
      await fs.writeFile(filePath, svgContent, 'utf8');
      console.log(`💾 Saved ${category}/${feature} to ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`❌ Failed to save ${category}/${feature}:`, error);
      throw error;
    }
  }

  /**
   * Generate all missing avatar graphics
   */
  async generateAllMissingGraphics(): Promise<{
    generated: number;
    failed: number;
    results: Array<{
      category: string;
      feature: string;
      success: boolean;
      error?: string;
      filePath?: string;
    }>;
  }> {
    console.log('🎨 Starting comprehensive avatar graphics generation...');
    
    const missing = await this.getMissingGraphics();
    console.log(`📋 Found ${missing.length} missing graphics to generate`);
    
    const results = [];
    let generated = 0;
    let failed = 0;
    
    // Generate graphics in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missing.length / batchSize)}`);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const svgContent = await this.generateAvatarComponent(item.category, item.feature);
          const filePath = await this.saveAvatarGraphic(item.category, item.feature, svgContent);
          
          generated++;
          return {
            category: item.category,
            feature: item.feature,
            success: true,
            filePath
          };
        } catch (error) {
          failed++;
          return {
            category: item.category,
            feature: item.feature,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches to be respectful of API limits
      if (i + batchSize < missing.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`🎉 Generation complete: ${generated} succeeded, ${failed} failed`);
    
    return {
      generated,
      failed,
      results
    };
  }

  /**
   * Get statistics about current avatar graphics library
   */
  async getGraphicsStats(): Promise<{
    totalFeatures: number;
    existingGraphics: number;
    missingGraphics: number;
    completionPercentage: number;
    categoriesSummary: Record<string, {
      total: number;
      existing: number;
      missing: number;
    }>;
  }> {
    const missing = await this.getMissingGraphics();
    const totalFeatures = Object.values(AvatarGraphicsGenerator.AVATAR_FEATURES)
      .reduce((sum, features) => sum + features.length, 0);
    const existingGraphics = totalFeatures - missing.length;
    
    const categoriesSummary: Record<string, { total: number; existing: number; missing: number; }> = {};
    
    for (const [category, features] of Object.entries(AvatarGraphicsGenerator.AVATAR_FEATURES)) {
      const categoryMissing = missing.filter(item => item.category === category).length;
      categoriesSummary[category] = {
        total: features.length,
        existing: features.length - categoryMissing,
        missing: categoryMissing
      };
    }
    
    return {
      totalFeatures,
      existingGraphics,
      missingGraphics: missing.length,
      completionPercentage: (existingGraphics / totalFeatures) * 100,
      categoriesSummary
    };
  }
}

export const avatarGraphicsGenerator = new AvatarGraphicsGenerator();