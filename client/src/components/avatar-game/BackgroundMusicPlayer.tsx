import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, SkipBack } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface MusicTrack {
  filename: string;
  title: string;
  artist: string;
  duration: number;
  category: string;
  filePath: string;
}

interface MusicCategory {
  name: string;
  description: string;
  mood: string;
}

interface BackgroundMusicPlayerProps {
  mood?: string;
  onMoodChange?: (mood: string) => void;
  className?: string;
}

export function BackgroundMusicPlayer({ 
  mood = 'creative', 
  onMoodChange,
  className = '' 
}: BackgroundMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState([0.7]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(mood);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch music recommendations based on mood
  const { data: musicData, isLoading } = useQuery({
    queryKey: ['/api/background-music/recommendations', selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/background-music/recommendations?mood=${selectedCategory}`);
      return response.json();
    }
  });

  // Get current category tracks
  const currentCategoryTracks = musicData?.recommendations?.find(
    (rec: any) => rec.category === selectedCategory
  )?.tracks || [];

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [currentTrack]);

  // Auto-select first track when category changes
  useEffect(() => {
    if (currentCategoryTracks.length > 0 && !currentTrack) {
      setCurrentTrack(currentCategoryTracks[0]);
    }
  }, [currentCategoryTracks, currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0];
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentCategoryTracks.length === 0) return;
    
    const currentIndex = currentCategoryTracks.findIndex(
      (track: MusicTrack) => track.filename === currentTrack?.filename
    );
    const nextIndex = (currentIndex + 1) % currentCategoryTracks.length;
    setCurrentTrack(currentCategoryTracks[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (currentCategoryTracks.length === 0) return;
    
    const currentIndex = currentCategoryTracks.findIndex(
      (track: MusicTrack) => track.filename === currentTrack?.filename
    );
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentCategoryTracks.length - 1;
    setCurrentTrack(currentCategoryTracks[prevIndex]);
    setIsPlaying(true);
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setCurrentTrack(null); // Will auto-select first track of new category
    setIsPlaying(false);
    onMoodChange?.(newCategory);
  };

  const handleSeek = (newTime: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 animate-pulse" />
            <span>Loading music library...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!musicData?.recommendations || musicData.recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Music className="w-4 h-4" />
            <span>No music available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Background Music
            </CardTitle>
            <CardDescription>
              Set the mood for your avatar creation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Music Category</label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {musicData.recommendations.map((rec: any) => (
                <SelectItem key={rec.category} value={rec.category}>
                  {rec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600">
            {musicData.recommendations.find((rec: any) => rec.category === selectedCategory)?.description}
          </p>
        </div>

        {/* Current Track Info */}
        {currentTrack && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="font-medium text-sm">{currentTrack.title}</div>
            <div className="text-xs text-gray-600">{currentTrack.artist}</div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={playPrevious}
            disabled={currentCategoryTracks.length <= 1}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={togglePlayPause}
            disabled={!currentTrack}
            className="w-12 h-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={playNext}
            disabled={currentCategoryTracks.length <= 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        {currentTrack && duration > 0 && (
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Slider
            value={volume}
            max={1}
            step={0.1}
            onValueChange={setVolume}
            className="flex-1"
          />
        </div>

        {/* Track List */}
        {currentCategoryTracks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Tracks</label>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {currentCategoryTracks.map((track: MusicTrack) => (
                <button
                  key={track.filename}
                  onClick={() => {
                    setCurrentTrack(track);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    currentTrack?.filename === track.filename
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{track.title}</div>
                  <div className="text-gray-500 truncate">{track.artist}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        {currentTrack && (
          <audio
            ref={audioRef}
            src={currentTrack.filePath}
            preload="metadata"
          />
        )}
      </CardContent>
    </Card>
  );
}