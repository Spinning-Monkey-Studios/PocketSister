import fs from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';

/**
 * Background Music Manager for Avatar Creation Game
 * Manages MP3 files with category-based organization
 */
export class BackgroundMusicManager {
  private musicDir = path.join(process.cwd(), 'client/src/assets/background-music');
  private metadataFile = path.join(this.musicDir, 'music-metadata.json');

  // Music categories for avatar creation game
  static readonly MUSIC_CATEGORIES = {
    creative: {
      name: 'Creative & Artistic',
      description: 'Inspiring music for creative avatar design',
      mood: 'inspiring, creative, artistic'
    },
    playful: {
      name: 'Playful & Fun',
      description: 'Upbeat music for playful avatar creation',
      mood: 'happy, energetic, fun'
    },
    peaceful: {
      name: 'Peaceful & Calm',
      description: 'Relaxing music for thoughtful avatar design',
      mood: 'calm, peaceful, relaxing'
    },
    confident: {
      name: 'Confident & Empowering',
      description: 'Empowering music for bold avatar choices',
      mood: 'confident, empowering, strong'
    },
    dreamy: {
      name: 'Dreamy & Magical',
      description: 'Fantasy-inspired music for imaginative avatars',
      mood: 'dreamy, magical, fantasy'
    }
  };

  constructor() {
    this.ensureMusicDirectoryExists();
  }

  private async ensureMusicDirectoryExists() {
    try {
      await fs.mkdir(this.musicDir, { recursive: true });
      
      // Create category subdirectories
      for (const category of Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES)) {
        await fs.mkdir(path.join(this.musicDir, category), { recursive: true });
      }
    } catch (error) {
      console.error('Error creating music directory:', error);
    }
  }

  /**
   * Scan music directory and extract metadata from MP3 files
   */
  async scanMusicLibrary(): Promise<{
    totalFiles: number;
    categorizedFiles: Record<string, Array<{
      filename: string;
      title?: string;
      artist?: string;
      duration?: number;
      category: string;
      filePath: string;
    }>>;
    uncategorizedFiles: string[];
  }> {
    console.log('🎵 Scanning background music library...');

    const categorizedFiles: Record<string, any[]> = {};
    const uncategorizedFiles: string[] = [];
    let totalFiles = 0;

    // Initialize category arrays
    Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES).forEach(category => {
      categorizedFiles[category] = [];
    });

    try {
      // Scan each category directory
      for (const category of Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES)) {
        const categoryDir = path.join(this.musicDir, category);
        
        try {
          const files = await fs.readdir(categoryDir);
          const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
          
          for (const filename of mp3Files) {
            const filePath = path.join(categoryDir, filename);
            totalFiles++;
            
            try {
              // Extract metadata from MP3
              const metadata = await mm.parseFile(filePath);
              
              categorizedFiles[category].push({
                filename,
                title: metadata.common.title || filename.replace('.mp3', ''),
                artist: metadata.common.artist || 'Unknown Artist',
                duration: metadata.format.duration || 0,
                category,
                filePath: `/background-music/${category}/${filename}`,
                fileSize: (await fs.stat(filePath)).size
              });
              
              console.log(`✅ Processed ${category}/${filename}: ${metadata.common.title || filename}`);
              
            } catch (metadataError) {
              console.warn(`⚠️ Could not read metadata for ${filename}:`, metadataError);
              
              // Add file without metadata
              categorizedFiles[category].push({
                filename,
                title: filename.replace('.mp3', ''),
                artist: 'Unknown Artist',
                duration: 0,
                category,
                filePath: `/background-music/${category}/${filename}`,
                fileSize: (await fs.stat(filePath)).size
              });
            }
          }
        } catch (dirError) {
          console.warn(`⚠️ Could not read category directory ${category}:`, dirError);
        }
      }

      // Also check root music directory for uncategorized files
      try {
        const rootFiles = await fs.readdir(this.musicDir);
        const uncategorizedMp3s = rootFiles.filter(file => 
          file.toLowerCase().endsWith('.mp3') && 
          !file.startsWith('.')
        );
        
        uncategorizedFiles.push(...uncategorizedMp3s);
        totalFiles += uncategorizedMp3s.length;
        
      } catch (rootError) {
        console.warn('⚠️ Could not read root music directory:', rootError);
      }

      console.log(`🎵 Music library scan complete: ${totalFiles} files found`);
      
      return {
        totalFiles,
        categorizedFiles,
        uncategorizedFiles
      };

    } catch (error) {
      console.error('❌ Failed to scan music library:', error);
      throw error;
    }
  }

  /**
   * Save music library metadata to JSON file
   */
  async saveMusicMetadata(libraryData: any): Promise<void> {
    try {
      const metadataWithTimestamp = {
        ...libraryData,
        lastScanned: new Date().toISOString(),
        categories: BackgroundMusicManager.MUSIC_CATEGORIES
      };

      await fs.writeFile(
        this.metadataFile,
        JSON.stringify(metadataWithTimestamp, null, 2),
        'utf8'
      );

      console.log(`💾 Music metadata saved to ${this.metadataFile}`);
      
    } catch (error) {
      console.error('❌ Failed to save music metadata:', error);
      throw error;
    }
  }

  /**
   * Load music library metadata from JSON file
   */
  async loadMusicMetadata(): Promise<any> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️ Could not load existing music metadata, will rescan');
      return null;
    }
  }

  /**
   * Get music recommendations for avatar creation context
   */
  getMusicRecommendations(avatarMood?: string): {
    category: string;
    name: string;
    description: string;
    tracks: any[];
  }[] {
    const recommendations = [];
    
    // Default recommendations based on avatar creation phases
    const phases = {
      creative: ['creative', 'dreamy'],
      customization: ['playful', 'confident'],
      reflection: ['peaceful', 'dreamy']
    };

    // If specific mood provided, prioritize matching categories
    let priorityCategories = Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES);
    if (avatarMood) {
      priorityCategories = Object.entries(BackgroundMusicManager.MUSIC_CATEGORIES)
        .filter(([_, info]) => info.mood.toLowerCase().includes(avatarMood.toLowerCase()))
        .map(([category, _]) => category);
    }

    for (const category of priorityCategories) {
      const categoryInfo = BackgroundMusicManager.MUSIC_CATEGORIES[category as keyof typeof BackgroundMusicManager.MUSIC_CATEGORIES];
      recommendations.push({
        category,
        name: categoryInfo.name,
        description: categoryInfo.description,
        tracks: [] // Will be populated from actual library scan
      });
    }

    return recommendations;
  }

  /**
   * Get music library statistics
   */
  async getMusicStats(): Promise<{
    totalCategories: number;
    totalTracks: number;
    categoriesPopulated: number;
    averageTracksPerCategory: number;
    categoryBreakdown: Record<string, {
      name: string;
      trackCount: number;
      totalDuration: number;
      averageDuration: number;
    }>;
  }> {
    const libraryData = await this.scanMusicLibrary();
    
    const categoryBreakdown: Record<string, any> = {};
    let totalTracks = 0;
    let categoriesPopulated = 0;

    Object.entries(libraryData.categorizedFiles).forEach(([category, tracks]) => {
      const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
      const trackCount = tracks.length;
      
      if (trackCount > 0) categoriesPopulated++;
      totalTracks += trackCount;

      categoryBreakdown[category] = {
        name: BackgroundMusicManager.MUSIC_CATEGORIES[category as keyof typeof BackgroundMusicManager.MUSIC_CATEGORIES].name,
        trackCount,
        totalDuration,
        averageDuration: trackCount > 0 ? totalDuration / trackCount : 0
      };
    });

    return {
      totalCategories: Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES).length,
      totalTracks,
      categoriesPopulated,
      averageTracksPerCategory: categoriesPopulated > 0 ? totalTracks / categoriesPopulated : 0,
      categoryBreakdown
    };
  }

  /**
   * Move uncategorized MP3 file to appropriate category
   */
  async categorizeMusic(filename: string, targetCategory: string): Promise<void> {
    if (!Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES).includes(targetCategory)) {
      throw new Error(`Invalid category: ${targetCategory}`);
    }

    const sourcePath = path.join(this.musicDir, filename);
    const targetPath = path.join(this.musicDir, targetCategory, filename);

    try {
      await fs.rename(sourcePath, targetPath);
      console.log(`📁 Moved ${filename} to ${targetCategory} category`);
    } catch (error) {
      console.error(`❌ Failed to move ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get file serving path for music files
   */
  getServingPath(category: string, filename: string): string {
    return `/api/background-music/${category}/${filename}`;
  }
}

export const backgroundMusicManager = new BackgroundMusicManager();