import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Sparkles, Crown } from "lucide-react";
import { AvatarConfig } from '@shared/avatar-schema';
import { AvatarCanvas } from './AvatarCanvas';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AvatarConfig;
  onSave: (name: string, greeting?: string) => void;
  onExportPNG: () => void;
  isSaving?: boolean;
}

export function SaveDialog({ 
  open, 
  onOpenChange, 
  config, 
  onSave, 
  onExportPNG, 
  isSaving = false 
}: SaveDialogProps) {
  const [avatarName, setAvatarName] = useState(config.name || 'Stella');
  const [customGreeting, setCustomGreeting] = useState(config.personality.greeting || '');
  const [useCustomGreeting, setUseCustomGreeting] = useState(false);

  const handleSave = () => {
    if (avatarName.trim()) {
      onSave(avatarName.trim(), useCustomGreeting ? customGreeting : undefined);
    }
  };

  const handleExport = () => {
    onExportPNG();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Save Your Avatar Creation
          </DialogTitle>
          <DialogDescription>
            Give your AI companion a name and customize how she greets you!
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <AvatarCanvas 
                config={{ ...config, name: avatarName }}
                size="medium"
                showBackground={true}
                className="mx-auto"
              />
            </div>

            {/* Personality Card Preview */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.personality.type === 'caring' ? '#FF69B4' : 
                                            config.personality.type === 'energetic' ? '#FF6B35' :
                                            config.personality.type === 'wise' ? '#6A4C93' : '#00B4D8' }}
                />
                <span className="font-medium text-sm">
                  {config.personality.type.charAt(0).toUpperCase() + config.personality.type.slice(1)} {avatarName}
                </span>
              </div>
              <p className="text-sm text-gray-600 italic mb-2">
                "{useCustomGreeting && customGreeting ? customGreeting : config.personality.greeting}"
              </p>
              <div className="flex flex-wrap gap-1">
                {config.personality.traits.map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Save Options */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="avatar-name">Avatar Name</Label>
              <Input
                id="avatar-name"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                placeholder="Enter your companion's name..."
                maxLength={30}
              />
              <p className="text-xs text-gray-500">
                This is what you'll call your AI companion
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="custom-greeting"
                  checked={useCustomGreeting}
                  onChange={(e) => setUseCustomGreeting(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="custom-greeting">Custom Greeting Message</Label>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
              
              {useCustomGreeting && (
                <div className="space-y-2">
                  <Textarea
                    value={customGreeting}
                    onChange={(e) => setCustomGreeting(e.target.value)}
                    placeholder="Write a custom greeting for your companion..."
                    maxLength={200}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    {customGreeting.length}/200 characters
                  </p>
                </div>
              )}
            </div>

            {/* Unlock Level Info */}
            {config.unlockLevel > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Premium Creation
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  This avatar includes premium items that require level {config.unlockLevel} or higher.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={!avatarName.trim() || isSaving}
                className="w-full"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Avatar'}
              </Button>

              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Take a Snapshot (PNG)
              </Button>
            </div>

            {/* Feature Info */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Your avatar will be saved to your profile</p>
              <p>• Use it as your AI companion's appearance</p>
              <p>• Share snapshots with friends and family</p>
              <p>• Create multiple avatars for different moods</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SaveDialog;