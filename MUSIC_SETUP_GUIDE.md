# Music File Instructions

## Directory Structure
The background music system uses the following directory structure:

```
client/src/assets/background-music/
├── creative/           # Creative & Artistic music
├── playful/           # Playful & Fun music  
├── peaceful/          # Peaceful & Calm music
├── confident/         # Confident & Empowering music
├── dreamy/            # Dreamy & Magical music
└── music-metadata.json # Auto-generated metadata file
```

## How to Add MP3 Files

### Method 1: Automatic Category Detection (Recommended)
1. Place MP3 files in the appropriate category folder based on mood:
   - **creative/**: Inspiring, artistic, creative background music
   - **playful/**: Upbeat, fun, energetic music for playful moments
   - **peaceful/**: Calm, relaxing, meditative music for thoughtful design
   - **confident/**: Empowering, strong, confidence-building music
   - **dreamy/**: Fantasy, magical, dreamlike music for imagination

### Method 2: MP3 Metadata
The system automatically extracts metadata from MP3 files:
- **Title**: From ID3 tag or filename
- **Artist**: From ID3 tag or 'Unknown Artist'
- **Duration**: Automatically calculated
- **Category**: Based on folder location

### File Requirements
- Format: MP3 only
- Recommended bitrate: 128kbps or higher
- Age-appropriate content for 10-14 year olds
- Instrumental or clean lyrics preferred

### How the System Works
1. **Scanning**: System scans category folders for MP3 files
2. **Metadata Extraction**: Reads ID3 tags (title, artist, duration)
3. **Category Assignment**: Based on folder location
4. **Serving**: Files served via /api/background-music/:category/:filename

### Admin Management
Use the admin panel at `test-background-music-admin.html` to:
- View music library statistics
- Rescan for new files
- Check category distribution
- Monitor uncategorized files

### Integration with Avatar Game
The BackgroundMusicPlayer component provides:
- Category-based music selection
- Mood-responsive recommendations  
- Play/pause/skip controls
- Volume control
- Track progress display

