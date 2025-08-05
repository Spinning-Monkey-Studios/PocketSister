import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Palette, Shirt, Crown, Sparkles, MapPin, Heart } from "lucide-react";
import { AvatarConfig, AvatarAssets, defaultAvatarAssets } from '@shared/avatar-schema';

interface CustomizationPanelProps {
  config: AvatarConfig;
  onConfigChange: (newConfig: AvatarConfig) => void;
  assets?: AvatarAssets;
  unlockedItems?: string[];
}

export function CustomizationPanel({ 
  config, 
  onConfigChange, 
  assets = defaultAvatarAssets,
  unlockedItems = []
}: CustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState('base');

  const updateConfig = (section: keyof AvatarConfig, updates: any) => {
    onConfigChange({
      ...config,
      [section]: typeof config[section] === 'object' 
        ? { ...config[section], ...updates }
        : updates
    });
  };

  const isItemLocked = (item: any) => {
    return item.unlockLevel > 1 && !unlockedItems.includes(item.id);
  };

  const ColorPicker = ({ colors, selectedColor, onColorSelect, title }: {
    colors: { name: string; color: string }[];
    selectedColor: string;
    onColorSelect: (color: string) => void;
    title: string;
  }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === color.color
                ? 'border-primary scale-110 shadow-lg'
                : 'border-gray-300 hover:scale-105'
            }`}
            style={{ backgroundColor: color.color }}
            onClick={() => onColorSelect(color.color)}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );

  const ItemSelector = ({ items, selectedId, onSelect, title, category }: {
    items: any[];
    selectedId: string;
    onSelect: (id: string) => void;
    title: string;
    category: string;
  }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const locked = isItemLocked(item);
          return (
            <button
              key={item.id}
              disabled={locked}
              className={`p-3 border rounded-lg transition-all relative ${
                selectedId === item.id
                  ? 'border-primary bg-primary/10'
                  : locked
                  ? 'border-gray-200 bg-gray-50 opacity-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onClick={() => !locked && onSelect(item.id)}
            >
              <div className="w-full h-12 bg-gray-100 rounded mb-2 flex items-center justify-center">
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
              <div className="text-xs font-medium truncate">{item.name}</div>
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
              )}
              {item.unlockLevel > 1 && !locked && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                  {item.unlockLevel}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg border shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-7 rounded-none border-b">
          <TabsTrigger value="base" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Base</span>
          </TabsTrigger>
          <TabsTrigger value="hair" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Hair</span>
          </TabsTrigger>
          <TabsTrigger value="face" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Face</span>
          </TabsTrigger>
          <TabsTrigger value="clothing" className="flex items-center gap-1">
            <Shirt className="w-4 h-4" />
            <span className="hidden sm:inline">Clothing</span>
          </TabsTrigger>
          <TabsTrigger value="accessories" className="flex items-center gap-1">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Accessories</span>
          </TabsTrigger>
          <TabsTrigger value="background" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Scene</span>
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Personality</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <TabsContent value="base" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Base Appearance</h3>
              
              <ItemSelector
                items={assets.base.bodyTypes.map(type => ({ id: type, name: type.charAt(0).toUpperCase() + type.slice(1), unlockLevel: 1 }))}
                selectedId={config.baseBody.type}
                onSelect={(type) => updateConfig('baseBody', { type })}
                title="Body Type"
                category="base"
              />

              <ColorPicker
                colors={assets.base.skinTones}
                selectedColor={config.baseBody.skinTone}
                onColorSelect={(skinTone) => updateConfig('baseBody', { skinTone })}
                title="Skin Tone"
              />
            </div>
          </TabsContent>

          <TabsContent value="hair" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Hair Style</h3>
              
              <ItemSelector
                items={assets.hair.styles}
                selectedId={config.hair.style}
                onSelect={(style) => updateConfig('hair', { style })}
                title="Hair Style"
                category="hair"
              />

              <ColorPicker
                colors={assets.hair.colors}
                selectedColor={config.hair.color}
                onColorSelect={(color) => updateConfig('hair', { color })}
                title="Hair Color"
              />
            </div>
          </TabsContent>

          <TabsContent value="face" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Facial Features</h3>
              
              <ItemSelector
                items={assets.face.eyeShapes}
                selectedId={config.face.eyeShape}
                onSelect={(eyeShape) => updateConfig('face', { eyeShape })}
                title="Eye Shape"
                category="face"
              />

              <ColorPicker
                colors={assets.face.eyeColors}
                selectedColor={config.face.eyeColor}
                onColorSelect={(eyeColor) => updateConfig('face', { eyeColor })}
                title="Eye Color"
              />

              <ItemSelector
                items={assets.face.expressions}
                selectedId={config.face.expression}
                onSelect={(expression) => updateConfig('face', { expression })}
                title="Expression"
                category="face"
              />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Face Accessories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {assets.face.accessories.map((acc) => (
                    <button
                      key={acc.id}
                      disabled={isItemLocked(acc)}
                      className={`p-2 border rounded text-xs transition-all ${
                        config.face.accessories.includes(acc.id)
                          ? 'border-primary bg-primary/10'
                          : isItemLocked(acc)
                          ? 'border-gray-200 bg-gray-50 opacity-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => {
                        const accessories = config.face.accessories.includes(acc.id)
                          ? config.face.accessories.filter(a => a !== acc.id)
                          : [...config.face.accessories, acc.id];
                        updateConfig('face', { accessories });
                      }}
                    >
                      {acc.name}
                      {isItemLocked(acc) && <Crown className="w-3 h-3 ml-1 inline text-yellow-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clothing" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Clothing & Style</h3>
              
              <ItemSelector
                items={assets.clothing.tops}
                selectedId={config.clothing.top.style}
                onSelect={(style) => updateConfig('clothing', { 
                  top: { ...config.clothing.top, style } 
                })}
                title="Tops"
                category="clothing"
              />

              <ColorPicker
                colors={assets.clothing.colors}
                selectedColor={config.clothing.top.color}
                onColorSelect={(color) => updateConfig('clothing', { 
                  top: { ...config.clothing.top, color } 
                })}
                title="Top Color"
              />

              <ItemSelector
                items={assets.clothing.bottoms}
                selectedId={config.clothing.bottom.style}
                onSelect={(style) => updateConfig('clothing', { 
                  bottom: { ...config.clothing.bottom, style } 
                })}
                title="Bottoms"
                category="clothing"
              />

              <ColorPicker
                colors={assets.clothing.colors}
                selectedColor={config.clothing.bottom.color}
                onColorSelect={(color) => updateConfig('clothing', { 
                  bottom: { ...config.clothing.bottom, color } 
                })}
                title="Bottom Color"
              />

              <ItemSelector
                items={assets.clothing.shoes}
                selectedId={config.clothing.shoes.style}
                onSelect={(style) => updateConfig('clothing', { 
                  shoes: { ...config.clothing.shoes, style } 
                })}
                title="Shoes"
                category="clothing"
              />

              <ColorPicker
                colors={assets.clothing.colors}
                selectedColor={config.clothing.shoes.color}
                onColorSelect={(color) => updateConfig('clothing', { 
                  shoes: { ...config.clothing.shoes, color } 
                })}
                title="Shoe Color"
              />
            </div>
          </TabsContent>

          <TabsContent value="accessories" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Accessories & Props</h3>
              
              <div className="space-y-4">
                {Object.entries(assets.accessories).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium capitalize">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          disabled={isItemLocked(item)}
                          className={`p-2 border rounded text-xs transition-all relative ${
                            config.accessories.includes(item.id)
                              ? 'border-primary bg-primary/10'
                              : isItemLocked(item)
                              ? 'border-gray-200 bg-gray-50 opacity-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            const accessories = config.accessories.includes(item.id)
                              ? config.accessories.filter(a => a !== item.id)
                              : [...config.accessories, item.id];
                            updateConfig('accessories', accessories);
                          }}
                        >
                          {item.name}
                          {isItemLocked(item) && <Crown className="w-3 h-3 ml-1 inline text-yellow-500" />}
                          {item.unlockLevel > 1 && !isItemLocked(item) && (
                            <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                              {item.unlockLevel}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="background" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Background Scene</h3>
              
              <ItemSelector
                items={assets.backgrounds.map(bg => ({ ...bg, unlockLevel: 1 }))}
                selectedId={config.background}
                onSelect={(background) => updateConfig('background', background)}
                title="Choose Your Scene"
                category="background"
              />
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personality & Voice</h3>
              
              <div className="grid gap-4">
                {assets.personalities.map((personality) => (
                  <button
                    key={personality.id}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      config.personality.type === personality.type
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => updateConfig('personality', {
                      type: personality.type,
                      greeting: personality.greeting,
                      traits: personality.traits
                    })}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: personality.color }}
                      />
                      <h4 className="font-medium">{personality.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{personality.description}</p>
                    <div className="text-xs text-gray-500 italic">"{personality.greeting}"</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {personality.traits.map((trait) => (
                        <Badge key={trait} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default CustomizationPanel;