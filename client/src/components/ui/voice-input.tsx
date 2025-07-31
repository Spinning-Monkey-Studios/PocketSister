import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onVoicePlay?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceInput({ onTranscript, onVoicePlay, disabled = false, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(supported);
  }, []);

  const startListening = () => {
    if (!isSupported || disabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const playVoice = async (text: string) => {
    if (onVoicePlay) {
      await onVoicePlay(text);
    } else {
      // Try ElevenLabs first, fallback to browser speech synthesis
      try {
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'demo-key'
          },
          body: JSON.stringify({ text })
        });

        const result = await response.json();
        
        if (result.success && result.audioData) {
          // Play ElevenLabs audio
          const audio = new Audio(result.audioData);
          audio.play();
        } else {
          // Fallback to browser speech synthesis
          playBrowserVoice(text);
        }
      } catch (error) {
        console.error('Voice synthesis error:', error);
        playBrowserVoice(text);
      }
    }
  };

  const playBrowserVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      // Try to use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('zira')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={cn(
          "rounded-full transition-colors",
          isListening && "bg-red-100 text-red-600 animate-pulse"
        )}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isListening && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Listening...
        </span>
      )}
    </div>
  );
}

export function VoicePlayback({ 
  text, 
  onPlay, 
  disabled = false, 
  className 
}: { 
  text: string;
  onPlay?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (disabled || isPlaying) return;

    setIsPlaying(true);
    
    try {
      if (onPlay) {
        await onPlay(text);
      } else {
        // Try ElevenLabs first, fallback to browser speech synthesis
        try {
          const response = await fetch('/api/voice/synthesize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'demo-key'
            },
            body: JSON.stringify({ text })
          });

          const result = await response.json();
          
          if (result.success && result.audioData) {
            // Play ElevenLabs audio
            const audio = new Audio(result.audioData);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            await audio.play();
          } else {
            // Fallback to browser speech synthesis
            playBrowserVoice(text);
          }
        } catch (error) {
          console.error('Voice synthesis error:', error);
          playBrowserVoice(text);
        }
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      setIsPlaying(false);
    }

    function playBrowserVoice(text: string) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handlePlay}
      disabled={disabled || isPlaying}
      className={cn("rounded-full", className)}
    >
      <Volume2 className={cn("h-3 w-3", isPlaying && "animate-pulse")} />
    </Button>
  );
}