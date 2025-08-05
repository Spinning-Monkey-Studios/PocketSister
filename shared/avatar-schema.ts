import { sql } from 'drizzle-orm';
import { pgTable, varchar, jsonb, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Avatar Configuration Database Schema
export const avatarConfigurations = pgTable("avatar_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  name: varchar("name").notNull(),
  configData: jsonb("config_data").notNull(),
  isActive: boolean("is_active").default(false),
  unlockLevel: integer("unlock_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const avatarUnlocks = pgTable("avatar_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  itemCategory: varchar("item_category").notNull(),
  itemId: varchar("item_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  unlockReason: varchar("unlock_reason"),
});

// TypeScript Interfaces for Avatar System
export interface AvatarConfig {
  id: string;
  name: string;
  baseBody: {
    type: 'slim' | 'average' | 'curvy';
    skinTone: string;
  };
  hair: {
    style: string;
    color: string;
  };
  face: {
    eyeShape: string;
    eyeColor: string;
    expression: string;
    accessories: string[];
  };
  clothing: {
    top: { style: string; color: string };
    bottom: { style: string; color: string };
    shoes: { style: string; color: string };
  };
  accessories: string[];
  personality: {
    type: 'caring' | 'energetic' | 'wise' | 'playful';
    greeting: string;
    traits: string[];
  };
  background: string;
  unlockLevel: number;
  createdAt: Date;
}

// Avatar Asset Categories
export interface AvatarAssets {
  base: {
    bodyTypes: string[];
    skinTones: { name: string; color: string }[];
  };
  hair: {
    styles: { id: string; name: string; svg: string }[];
    colors: { name: string; color: string }[];
  };
  face: {
    eyeShapes: { id: string; name: string; svg: string }[];
    eyeColors: { name: string; color: string }[];
    expressions: { id: string; name: string; svg: string }[];
    accessories: { id: string; name: string; svg: string; unlockLevel: number }[];
  };
  clothing: {
    tops: { id: string; name: string; svg: string; unlockLevel: number }[];
    bottoms: { id: string; name: string; svg: string; unlockLevel: number }[];
    shoes: { id: string; name: string; svg: string; unlockLevel: number }[];
    colors: { name: string; color: string }[];
  };
  accessories: {
    hats: { id: string; name: string; svg: string; unlockLevel: number }[];
    props: { id: string; name: string; svg: string; unlockLevel: number }[];
    stickers: { id: string; name: string; svg: string; unlockLevel: number }[];
  };
  backgrounds: { id: string; name: string; svg: string }[];
  personalities: {
    id: string;
    name: string;
    type: 'caring' | 'energetic' | 'wise' | 'playful';
    description: string;
    greeting: string;
    traits: string[];
    color: string;
  }[];
}

// Default Avatar Assets Configuration
export const defaultAvatarAssets: AvatarAssets = {
  base: {
    bodyTypes: ['slim', 'average', 'curvy'],
    skinTones: [
      { name: 'Fair', color: '#FDBCB4' },
      { name: 'Light', color: '#EEA990' },
      { name: 'Medium', color: '#CE967C' },
      { name: 'Olive', color: '#B08D57' },
      { name: 'Tan', color: '#A97C50' },
      { name: 'Brown', color: '#8B5A3C' },
      { name: 'Dark', color: '#5D4037' },
      { name: 'Deep', color: '#3E2723' }
    ]
  },
  hair: {
    styles: [
      { id: 'straight-long', name: 'Long Straight', svg: 'hair-straight-long.svg' },
      { id: 'curly-medium', name: 'Curly Medium', svg: 'hair-curly-medium.svg' },
      { id: 'wavy-short', name: 'Short Wavy', svg: 'hair-wavy-short.svg' },
      { id: 'braids', name: 'Braids', svg: 'hair-braids.svg' },
      { id: 'bob', name: 'Bob Cut', svg: 'hair-bob.svg' },
      { id: 'ponytail', name: 'Ponytail', svg: 'hair-ponytail.svg' },
      { id: 'pigtails', name: 'Pigtails', svg: 'hair-pigtails.svg' },
      { id: 'afro', name: 'Afro', svg: 'hair-afro.svg' },
      { id: 'pixie', name: 'Pixie Cut', svg: 'hair-pixie.svg' },
      { id: 'space-buns', name: 'Space Buns', svg: 'hair-space-buns.svg' }
    ],
    colors: [
      { name: 'Blonde', color: '#F7DC6F' },
      { name: 'Light Brown', color: '#D4A574' },
      { name: 'Brown', color: '#8B4513' },
      { name: 'Dark Brown', color: '#654321' },
      { name: 'Black', color: '#2C1810' },
      { name: 'Auburn', color: '#A0522D' },
      { name: 'Red', color: '#CD853F' },
      { name: 'Strawberry', color: '#FFB6C1' },
      { name: 'Silver', color: '#C0C0C0' },
      { name: 'Blue', color: '#6495ED' },
      { name: 'Purple', color: '#9370DB' },
      { name: 'Pink', color: '#FF69B4' }
    ]
  },
  face: {
    eyeShapes: [
      { id: 'round', name: 'Round', svg: 'eyes-round.svg' },
      { id: 'almond', name: 'Almond', svg: 'eyes-almond.svg' },
      { id: 'wide', name: 'Wide', svg: 'eyes-wide.svg' },
      { id: 'narrow', name: 'Narrow', svg: 'eyes-narrow.svg' },
      { id: 'upturned', name: 'Upturned', svg: 'eyes-upturned.svg' },
      { id: 'downturned', name: 'Downturned', svg: 'eyes-downturned.svg' }
    ],
    eyeColors: [
      { name: 'Brown', color: '#8B4513' },
      { name: 'Blue', color: '#4169E1' },
      { name: 'Green', color: '#228B22' },
      { name: 'Hazel', color: '#DAA520' },
      { name: 'Gray', color: '#708090' },
      { name: 'Amber', color: '#FFBF00' },
      { name: 'Violet', color: '#8A2BE2' },
      { name: 'Emerald', color: '#50C878' }
    ],
    expressions: [
      { id: 'happy', name: 'Happy', svg: 'mouth-happy.svg' },
      { id: 'smile', name: 'Gentle Smile', svg: 'mouth-smile.svg' },
      { id: 'neutral', name: 'Neutral', svg: 'mouth-neutral.svg' },
      { id: 'thoughtful', name: 'Thoughtful', svg: 'mouth-thoughtful.svg' },
      { id: 'excited', name: 'Excited', svg: 'mouth-excited.svg' }
    ],
    accessories: [
      { id: 'glasses-round', name: 'Round Glasses', svg: 'glasses-round.svg', unlockLevel: 1 },
      { id: 'glasses-square', name: 'Square Glasses', svg: 'glasses-square.svg', unlockLevel: 1 },
      { id: 'sunglasses', name: 'Sunglasses', svg: 'sunglasses.svg', unlockLevel: 2 },
      { id: 'freckles', name: 'Freckles', svg: 'freckles.svg', unlockLevel: 1 },
      { id: 'dimples', name: 'Dimples', svg: 'dimples.svg', unlockLevel: 2 }
    ]
  },
  clothing: {
    tops: [
      { id: 't-shirt', name: 'T-Shirt', svg: 'top-tshirt.svg', unlockLevel: 1 },
      { id: 'hoodie', name: 'Hoodie', svg: 'top-hoodie.svg', unlockLevel: 1 },
      { id: 'sweater', name: 'Sweater', svg: 'top-sweater.svg', unlockLevel: 1 },
      { id: 'blouse', name: 'Blouse', svg: 'top-blouse.svg', unlockLevel: 2 },
      { id: 'jacket', name: 'Jacket', svg: 'top-jacket.svg', unlockLevel: 2 },
      { id: 'dress', name: 'Dress', svg: 'top-dress.svg', unlockLevel: 2 },
      { id: 'tank-top', name: 'Tank Top', svg: 'top-tank.svg', unlockLevel: 1 },
      { id: 'cardigan', name: 'Cardigan', svg: 'top-cardigan.svg', unlockLevel: 3 },
      { id: 'crop-top', name: 'Crop Top', svg: 'top-crop.svg', unlockLevel: 3 },
      { id: 'blazer', name: 'Blazer', svg: 'top-blazer.svg', unlockLevel: 3 }
    ],
    bottoms: [
      { id: 'jeans', name: 'Jeans', svg: 'bottom-jeans.svg', unlockLevel: 1 },
      { id: 'shorts', name: 'Shorts', svg: 'bottom-shorts.svg', unlockLevel: 1 },
      { id: 'skirt', name: 'Skirt', svg: 'bottom-skirt.svg', unlockLevel: 1 },
      { id: 'leggings', name: 'Leggings', svg: 'bottom-leggings.svg', unlockLevel: 1 },
      { id: 'sweatpants', name: 'Sweatpants', svg: 'bottom-sweatpants.svg', unlockLevel: 2 },
      { id: 'capris', name: 'Capris', svg: 'bottom-capris.svg', unlockLevel: 2 },
      { id: 'palazzo-pants', name: 'Palazzo Pants', svg: 'bottom-palazzo.svg', unlockLevel: 3 },
      { id: 'midi-skirt', name: 'Midi Skirt', svg: 'bottom-midi-skirt.svg', unlockLevel: 3 }
    ],
    shoes: [
      { id: 'sneakers', name: 'Sneakers', svg: 'shoes-sneakers.svg', unlockLevel: 1 },
      { id: 'boots', name: 'Boots', svg: 'shoes-boots.svg', unlockLevel: 1 },
      { id: 'sandals', name: 'Sandals', svg: 'shoes-sandals.svg', unlockLevel: 1 },
      { id: 'flats', name: 'Flats', svg: 'shoes-flats.svg', unlockLevel: 2 },
      { id: 'high-tops', name: 'High Tops', svg: 'shoes-hightops.svg', unlockLevel: 2 },
      { id: 'ballet-shoes', name: 'Ballet Shoes', svg: 'shoes-ballet.svg', unlockLevel: 3 }
    ],
    colors: [
      { name: 'White', color: '#FFFFFF' },
      { name: 'Black', color: '#000000' },
      { name: 'Gray', color: '#808080' },
      { name: 'Navy', color: '#000080' },
      { name: 'Blue', color: '#0066CC' },
      { name: 'Red', color: '#CC0000' },
      { name: 'Pink', color: '#FF69B4' },
      { name: 'Purple', color: '#800080' },
      { name: 'Green', color: '#008000' },
      { name: 'Yellow', color: '#FFD700' },
      { name: 'Orange', color: '#FFA500' },
      { name: 'Brown', color: '#8B4513' }
    ]
  },
  accessories: {
    hats: [
      { id: 'baseball-cap', name: 'Baseball Cap', svg: 'hat-baseball.svg', unlockLevel: 1 },
      { id: 'beanie', name: 'Beanie', svg: 'hat-beanie.svg', unlockLevel: 1 },
      { id: 'sun-hat', name: 'Sun Hat', svg: 'hat-sun.svg', unlockLevel: 2 },
      { id: 'beret', name: 'Beret', svg: 'hat-beret.svg', unlockLevel: 3 },
      { id: 'headband', name: 'Headband', svg: 'hat-headband.svg', unlockLevel: 1 },
      { id: 'bow', name: 'Hair Bow', svg: 'hat-bow.svg', unlockLevel: 2 },
      { id: 'flower-crown', name: 'Flower Crown', svg: 'hat-flower-crown.svg', unlockLevel: 3 },
      { id: 'bucket-hat', name: 'Bucket Hat', svg: 'hat-bucket.svg', unlockLevel: 2 }
    ],
    props: [
      { id: 'backpack', name: 'Backpack', svg: 'prop-backpack.svg', unlockLevel: 1 },
      { id: 'book', name: 'Book', svg: 'prop-book.svg', unlockLevel: 1 },
      { id: 'headphones', name: 'Headphones', svg: 'prop-headphones.svg', unlockLevel: 2 },
      { id: 'phone', name: 'Phone', svg: 'prop-phone.svg', unlockLevel: 2 },
      { id: 'journal', name: 'Journal', svg: 'prop-journal.svg', unlockLevel: 2 },
      { id: 'art-supplies', name: 'Art Supplies', svg: 'prop-art.svg', unlockLevel: 3 },
      { id: 'guitar', name: 'Guitar', svg: 'prop-guitar.svg', unlockLevel: 3 },
      { id: 'camera', name: 'Camera', svg: 'prop-camera.svg', unlockLevel: 3 }
    ],
    stickers: [
      { id: 'star', name: 'Star', svg: 'sticker-star.svg', unlockLevel: 1 },
      { id: 'heart', name: 'Heart', svg: 'sticker-heart.svg', unlockLevel: 1 },
      { id: 'flower', name: 'Flower', svg: 'sticker-flower.svg', unlockLevel: 1 },
      { id: 'butterfly', name: 'Butterfly', svg: 'sticker-butterfly.svg', unlockLevel: 2 },
      { id: 'rainbow', name: 'Rainbow', svg: 'sticker-rainbow.svg', unlockLevel: 2 },
      { id: 'sparkles', name: 'Sparkles', svg: 'sticker-sparkles.svg', unlockLevel: 3 }
    ]
  },
  backgrounds: [
    { id: 'bedroom', name: 'Cozy Bedroom', svg: 'bg-bedroom.svg' },
    { id: 'park', name: 'Sunny Park', svg: 'bg-park.svg' },
    { id: 'beach', name: 'Beach Scene', svg: 'bg-beach.svg' },
    { id: 'study-space', name: 'Study Corner', svg: 'bg-study.svg' },
    { id: 'garden', name: 'Flower Garden', svg: 'bg-garden.svg' },
    { id: 'library', name: 'Library', svg: 'bg-library.svg' }
  ],
  personalities: [
    {
      id: 'caring',
      name: 'Caring Stella',
      type: 'caring',
      description: 'Warm, nurturing, and always ready to listen',
      greeting: 'Hi sweetie! I\'m so happy to see you today!',
      traits: ['Empathetic', 'Patient', 'Supportive', 'Gentle'],
      color: '#FF69B4'
    },
    {
      id: 'energetic', 
      name: 'Energetic Stella',
      type: 'energetic',
      description: 'Upbeat, enthusiastic, and full of fun ideas',
      greeting: 'Hey there! Ready for an awesome adventure today?',
      traits: ['Enthusiastic', 'Motivating', 'Playful', 'Optimistic'],
      color: '#FF6B35'
    },
    {
      id: 'wise',
      name: 'Wise Stella',
      type: 'wise',
      description: 'Thoughtful, insightful, and great at giving advice',
      greeting: 'Hello, dear. What\'s on your mind today?',
      traits: ['Insightful', 'Thoughtful', 'Calming', 'Wise'],
      color: '#6A4C93'
    },
    {
      id: 'playful',
      name: 'Playful Stella',
      type: 'playful',
      description: 'Fun-loving, creative, and always up for games',
      greeting: 'Hi friend! Want to play something fun together?',
      traits: ['Creative', 'Fun-loving', 'Imaginative', 'Spirited'],
      color: '#00B4D8'
    }
  ]
};

// Zod Schemas
export const insertAvatarConfigSchema = createInsertSchema(avatarConfigurations);
export const insertAvatarUnlockSchema = createInsertSchema(avatarUnlocks);

export type AvatarConfiguration = typeof avatarConfigurations.$inferSelect;
export type InsertAvatarConfiguration = typeof avatarConfigurations.$inferInsert;
export type AvatarUnlock = typeof avatarUnlocks.$inferSelect;
export type InsertAvatarUnlock = typeof avatarUnlocks.$inferInsert;