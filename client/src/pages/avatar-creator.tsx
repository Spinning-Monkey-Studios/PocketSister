import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Mic, Save, RefreshCw, User, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AvatarOption {
  id: string;
  imageUrl: string;
  description: string;
  style: string;
}

export default function AvatarCreator() {
  const userId = "demo-user"; // In a real app, this would come from authentication
  const [avatarDescription, setAvatarDescription] = useState("");
  const [avatarName, setAvatarName] = useState("Stella");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<AvatarOption[]>([]);
  const [isListening, setIsListening] = useState(false);
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

    recognition.onresult = (event) => {
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

  // Generate avatar options mutation
  const generateAvatarMutation = useMutation({
    mutationFn: (description: string) =>
      apiRequest("POST", "/api/avatar/generate", { description }, { 'x-user-id': userId }),
    onSuccess: (data) => {
      setGeneratedOptions(data.avatars || []);
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
      apiRequest("POST", "/api/avatar/save", data, { 'x-user-id': userId }),
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
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue to-pastel-lavender p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-nunito text-4xl font-bold text-gray-800 mb-2">
            Create Your AI Companion
          </h1>
          <p className="text-gray-600">
            Describe your ideal AI friend and watch them come to life!
          </p>
        </div>

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
    </div>
  );
}