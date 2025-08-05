import React from 'react';
import { AvatarConfig } from '@shared/avatar-schema';

interface AvatarCanvasProps {
  config: AvatarConfig;
  size?: 'small' | 'medium' | 'large';
  showBackground?: boolean;
  className?: string;
}

export function AvatarCanvas({ 
  config, 
  size = 'medium', 
  showBackground = true, 
  className = '' 
}: AvatarCanvasProps) {
  const sizeClasses = {
    small: 'w-32 h-40',
    medium: 'w-64 h-80', 
    large: 'w-96 h-120'
  };

  // Placeholder SVG generation - will be replaced with actual asset system
  const generatePlaceholderSVG = () => {
    const { baseBody, hair, face, clothing, accessories, background } = config;
    
    return `
      <svg width="100%" height="100%" viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg">
        ${showBackground ? `
          <!-- Background -->
          <rect width="100%" height="100%" fill="${getBackgroundColor(background)}" rx="15"/>
          <text x="160" y="30" text-anchor="middle" fill="#666" font-size="12">${background}</text>
        ` : ''}
        
        <!-- Base Body -->
        <ellipse cx="160" cy="200" rx="80" ry="120" fill="${baseBody.skinTone}" stroke="#333" stroke-width="2"/>
        <text x="160" y="340" text-anchor="middle" fill="#333" font-size="10">${baseBody.type}</text>
        
        <!-- Hair -->
        <ellipse cx="160" cy="120" rx="85" ry="50" fill="${hair.color}" stroke="#333" stroke-width="2"/>
        <text x="160" y="95" text-anchor="middle" fill="#333" font-size="10">${hair.style}</text>
        
        <!-- Face -->
        <circle cx="140" cy="140" r="8" fill="${face.eyeColor}" stroke="#333" stroke-width="1"/>
        <circle cx="180" cy="140" r="8" fill="${face.eyeColor}" stroke="#333" stroke-width="1"/>
        <path d="M 140 165 Q 160 175 180 165" stroke="#333" stroke-width="2" fill="none"/>
        <text x="160" y="185" text-anchor="middle" fill="#333" font-size="8">${face.expression}</text>
        
        <!-- Clothing -->
        <rect x="120" y="220" width="80" height="60" fill="${clothing.top.color}" stroke="#333" stroke-width="2" rx="5"/>
        <text x="160" y="245" text-anchor="middle" fill="#333" font-size="8">${clothing.top.style}</text>
        
        <rect x="130" y="280" width="60" height="40" fill="${clothing.bottom.color}" stroke="#333" stroke-width="2" rx="3"/>
        <text x="160" y="295" text-anchor="middle" fill="#333" font-size="8">${clothing.bottom.style}</text>
        
        <!-- Shoes -->
        <ellipse cx="145" cy="330" rx="15" ry="8" fill="${clothing.shoes.color}" stroke="#333" stroke-width="1"/>
        <ellipse cx="175" cy="330" rx="15" ry="8" fill="${clothing.shoes.color}" stroke="#333" stroke-width="1"/>
        
        <!-- Accessories -->
        ${accessories.map((acc, index) => `
          <circle cx="${120 + index * 20}" cy="110" r="8" fill="#FFD700" stroke="#333" stroke-width="1"/>
          <text x="${120 + index * 20}" y="105" text-anchor="middle" fill="#333" font-size="6">${acc.substring(0, 3)}</text>
        `).join('')}
        
        <!-- Name -->
        <text x="160" y="380" text-anchor="middle" fill="#333" font-size="14" font-weight="bold">${config.name}</text>
      </svg>
    `;
  };

  const getBackgroundColor = (bg: string) => {
    const colors: Record<string, string> = {
      bedroom: '#FFE5E5',
      park: '#E5FFE5', 
      beach: '#E5F5FF',
      'study-space': '#FFF5E5',
      garden: '#F0FFE5',
      library: '#F5F0FF'
    };
    return colors[bg] || '#F5F5F5';
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative border rounded-lg overflow-hidden bg-white shadow-lg`}>
      <div 
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: generatePlaceholderSVG() }}
      />
      
      {/* Personality indicator */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/20 rounded text-xs text-white">
        {config.personality.type}
      </div>
    </div>
  );
}

export default AvatarCanvas;