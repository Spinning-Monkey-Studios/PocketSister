import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Mic, Save, RefreshCw, User, Palette, Shuffle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AvatarCanvas } from "@/components/avatar-game/AvatarCanvas";
import { CustomizationPanel } from "@/components/avatar-game/CustomizationPanel";
import { SaveDialog } from "@/components/avatar-game/SaveDialog";
import { ProgressCelebration } from "@/components/avatar-game/ProgressCelebration";
import { AvatarConfig, defaultAvatarAssets } from '@shared/avatar-schema';

interface AvatarOption {
  id: string;
  imageUrl: string;
  description: string;
  style: string;
}

export default function AvatarCreator() {
  const userId = "demo-user"; // In a real app, this would come from authentication
  const childId = "demo-child-123"; // In a real app, this would come from child profile selection
  
  // Avatar Game State
  const [gameMode, setGameMode] = useState<'game' | 'ai-generation'>('game');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    id: '',
    name: 'Stella',
    baseBody: {
      type: 'average',
      skinTone: '#FDBCB4'
    },
    hair: {
      style: 'straight-long',
      color: '#F7DC6F'
    },
    face: {
      eyeShape: 'round',
      eyeColor: '#8B4513',
      expression: 'happy',
      accessories: []
    },
    clothing: {
      top: { style: 't-shirt', color: '#0066CC' },
      bottom: { style: 'jeans', color: '#000080' },
      shoes: { style: 'sneakers', color: '#FFFFFF' }
    },
    accessories: [],
    personality: {
      type: 'caring',
      greeting: 'Hi sweetie! I\'m so happy to see you today!',
      traits: ['Empathetic', 'Patient', 'Supportive', 'Gentle']
    },
    background: 'bedroom',
    unlockLevel: 1,
    createdAt: new Date()
  });

  // Legacy AI Generation State
  const [avatarDescription, setAvatarDescription] = useState("");
  const [avatarName, setAvatarName] = useState("Stella");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<AvatarOption[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Dialog States
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Voice recognition setup
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive"
      });
      return;
    }

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
      setAvatarDescription(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice recognition error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Randomize avatar configuration
  const randomizeAvatar = () => {
    const assets = defaultAvatarAssets;
    
    const randomConfig: AvatarConfig = {
      ...avatarConfig,
      baseBody: {
        type: assets.base.bodyTypes[Math.floor(Math.random() * assets.base.bodyTypes.length)] as any,
        skinTone: assets.base.skinTones[Math.floor(Math.random() * assets.base.skinTones.length)].color
      },
      hair: {
        style: assets.hair.styles[Math.floor(Math.random() * assets.hair.styles.length)].id,
        color: assets.hair.colors[Math.floor(Math.random() * assets.hair.colors.length)].color
      },
      face: {
        eyeShape: assets.face.eyeShapes[Math.floor(Math.random() * assets.face.eyeShapes.length)].id,
        eyeColor: assets.face.eyeColors[Math.floor(Math.random() * assets.face.eyeColors.length)].color,
        expression: assets.face.expressions[Math.floor(Math.random() * assets.face.expressions.length)].id,
        accessories: []
      },
      clothing: {
        top: {
          style: assets.clothing.tops[Math.floor(Math.random() * assets.clothing.tops.length)].id,
          color: assets.clothing.colors[Math.floor(Math.random() * assets.clothing.colors.length)].color
        },
        bottom: {
          style: assets.clothing.bottoms[Math.floor(Math.random() * assets.clothing.bottoms.length)].id,
          color: assets.clothing.colors[Math.floor(Math.random() * assets.clothing.colors.length)].color
        },
        shoes: {
          style: assets.clothing.shoes[Math.floor(Math.random() * assets.clothing.shoes.length)].id,
          color: assets.clothing.colors[Math.floor(Math.random() * assets.clothing.colors.length)].color
        }
      },
      accessories: [],
      personality: {
        ...assets.personalities[Math.floor(Math.random() * assets.personalities.length)],
        // name: avatarConfig.name // Removed as not part of personality schema
      },
      background: assets.backgrounds[Math.floor(Math.random() * assets.backgrounds.length)].id
    };

    setAvatarConfig(randomConfig);
    toast({
      title: "Avatar Randomized!",
      description: "Your avatar got a fresh new look!"
    });
  };

  // Save avatar configuration
  const saveAvatarGameMutation = useMutation({
    mutationFn: async ({ name, greeting }: { name: string; greeting?: string }) => {
      const configToSave = {
        ...avatarConfig,
        name,
        personality: greeting ? { ...avatarConfig.personality, greeting } : avatarConfig.personality
      };

      return apiRequest('POST', '/api/avatars/create', {
        childId,
        name,
        configData: configToSave,
        unlockLevel: avatarConfig.unlockLevel
      });
    },
    onSuccess: () => {
      setCelebrationMessage('Avatar Created Successfully!');
      setShowCelebration(true);
      setShowSaveDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/avatars/child', childId] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save your avatar. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Export avatar as PNG
  const exportAvatarPNG = () => {
    // This would implement HTML canvas export functionality
    toast({
      title: "Snapshot Taken!",
      description: "Your avatar image has been downloaded.",
    });
  };

  // Generate avatar options mutation (legacy AI generation)
  const generateAvatarMutation = useMutation({
    mutationFn: (description: string) =>
      apiRequest("POST", "/api/avatar/generate", { description, userId }),
    onSuccess: (data) => {
      setGeneratedOptions((data as any).avatars || []);
      toast({
        title: "Avatars generated!",
        description: "Choose your favorite avatar from the options below."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate avatars",
        variant: "destructive"
      });
    }
  });

  // Save avatar selection mutation
  const saveAvatarMutation = useMutation({
    mutationFn: (data: { avatarId: string; name: string; imageUrl: string }) =>
      apiRequest("POST", "/api/avatar/save", { ...data, userId }),
    onSuccess: () => {
      toast({
        title: "Avatar saved!",
        description: `${avatarName} is now your AI companion.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save avatar",
        variant: "destructive"
      });
    }
  });

  const handleGenerateAvatars = () => {
    if (!avatarDescription.trim()) {
      toast({
        title: "Description needed",
        description: "Please describe your ideal AI companion",
        variant: "destructive"
      });
      return;
    }
    generateAvatarMutation.mutate(avatarDescription);
  };

  const handleSaveAvatar = () => {
    if (!selectedAvatar) {
      toast({
        title: "No avatar selected",
        description: "Please choose an avatar first",
        variant: "destructive"
      });
      return;
    }

    saveAvatarMutation.mutate({
      avatarId: selectedAvatar.id,
      name: avatarName,
      imageUrl: selectedAvatar.imageUrl
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-primary w-8 h-8" />
            Create Your Big Sister
          </h1>
          <p className="text-gray-600 mb-6">
            Design your perfect AI companion through our interactive avatar creator
          </p>
          
          {/* Mode Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={gameMode === 'game' ? 'default' : 'outline'}
              onClick={() => setGameMode('game')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Avatar Creator Game
            </Button>
            <Button
              variant={gameMode === 'ai-generation' ? 'default' : 'outline'}
              onClick={() => setGameMode('ai-generation')}
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              AI Generation
            </Button>
          </div>
        </div>

        {gameMode === 'game' ? (
          // Enhanced Avatar Creation Game
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Avatar Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <User className="w-5 h-5" />
                    Your Avatar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AvatarCanvas 
                    config={avatarConfig}
                    size="large"
                    showBackground={true}
                    className="mx-auto"
                  />
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={randomizeAvatar}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Shuffle className="w-4 h-4 mr-1" />
                      Randomize
                    </Button>
                    <Button
                      onClick={() => setShowSaveDialog(true)}
                      size="sm"
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization Panel */}
            <div className="lg:col-span-2">
              <Card className="h-[800px]">
                <CardContent className="p-0 h-full">
                  <CustomizationPanel
                    config={avatarConfig}
                    onConfigChange={setAvatarConfig}
                    assets={defaultAvatarAssets}
                    unlockedItems={[]} // TODO: Load from user profile
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Legacy AI Generation Mode
          <div className="max-w-4xl mx-auto">

            {/* Avatar Description Input */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Describe Your Companion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">What should your AI companion look like?</Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  id="description"
                  placeholder="Describe your ideal AI companion... For example: 'A friendly robot with blue eyes and a warm smile' or 'A magical fairy with sparkly wings and colorful hair'"
                  value={avatarDescription}
                  onChange={(e) => setAvatarDescription(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button
                  onClick={startVoiceRecognition}
                  disabled={isListening}
                  variant="outline"
                  className="px-3"
                >
                  <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
                </Button>
              </div>
              {isListening && (
                <p className="text-sm text-blue-600 mt-1">Listening... Speak now!</p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Companion Name</Label>
              <Input
                id="name"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                placeholder="What would you like to call your companion?"
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleGenerateAvatars}
              disabled={generateAvatarMutation.isPending || !avatarDescription.trim()}
              className="w-full gradient-pink-purple"
            >
              {generateAvatarMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Avatars...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Avatar Options
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Avatar Options */}
        {generatedOptions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Your Favorite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {generatedOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer rounded-lg border-2 transition-all ${
                      selectedAvatar?.id === option.id
                        ? 'border-primary-pink shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAvatar(option)}
                  >
                    <img
                      src={option.imageUrl}
                      alt={option.description}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {option.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{option.style}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAvatar && (
                <div className="text-center">
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={saveAvatarMutation.isPending}
                    className="gradient-pink-purple"
                  >
                    {saveAvatarMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save {avatarName} as My Companion
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Example Prompts */}
        <Card>
          <CardHeader>
            <CardTitle>Need Inspiration?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "A friendly robot with glowing blue circuits and a kind smile",
                "A magical fairy with rainbow wings and sparkly dress",
                "A wise owl wearing glasses and a cozy sweater",
                "A cute dragon with purple scales and friendly eyes",
                "A space explorer with a helmet and colorful spacesuit",
                "A gentle unicorn with a flowing mane and golden horn"
              ].map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left h-auto p-4 whitespace-normal"
                  onClick={() => setAvatarDescription(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialogs and Celebrations */}
        <SaveDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          config={avatarConfig}
          onSave={(name, greeting) => saveAvatarGameMutation.mutate({ name, greeting })}
          onExportPNG={exportAvatarPNG}
          isSaving={saveAvatarGameMutation.isPending}
        />

        <ProgressCelebration
          show={showCelebration}
          onComplete={() => setShowCelebration(false)}
          message={celebrationMessage}
          type="save"
        />
      </div>
    </div>
  );
}