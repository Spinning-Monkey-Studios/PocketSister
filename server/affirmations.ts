import { storage } from "./storage";

// Pre-built affirmation templates organized by category and personality
const affirmationTemplates = {
  motivation: {
    playful: [
      "You're absolutely amazing at tackling challenges! 🌟 Keep being awesome!",
      "Every step you take today is a step toward your dreams! ✨ You've got this!",
      "Your energy and enthusiasm light up every room! Keep shining bright! 🌈",
      "You turn obstacles into opportunities like a true champion! 💫",
      "Your positive attitude is your superpower! Use it to conquer today! ⚡"
    ],
    gentle: [
      "You have such strength within you, even when things feel difficult.",
      "Each day brings new possibilities, and you're ready to embrace them.",
      "Your kind heart and determination will guide you through anything.",
      "You're growing and learning in such beautiful ways.",
      "Trust in yourself - you have everything you need inside you."
    ],
    friendly: [
      "You're capable of amazing things! Believe in yourself today.",
      "Your efforts matter more than you know. Keep going!",
      "You have a special way of making everything better.",
      "Today is full of opportunities just waiting for you.",
      "You're stronger and braver than you realize."
    ]
  },
  confidence: {
    playful: [
      "You're one-of-a-kind spectacular! Nobody else can be YOU! 🎉",
      "Your ideas are brilliant and the world needs to hear them! 🚀",
      "You have superpowers that make you uniquely amazing! ⭐",
      "Confidence looks perfect on you - wear it proudly! 👑",
      "You're a original masterpiece, not a copy! Shine your light! 🌟"
    ],
    gentle: [
      "You are worthy of love, respect, and all good things.",
      "Your voice matters and deserves to be heard.",
      "You bring something special to this world that no one else can.",
      "It's okay to take up space and be proud of who you are.",
      "You are enough, exactly as you are right now."
    ],
    friendly: [
      "You have so many wonderful qualities that make you special.",
      "Your unique perspective adds value to every situation.",
      "People appreciate your authentic self more than you know.",
      "You're learning and growing every single day.",
      "Your confidence inspires others to believe in themselves too."
    ]
  },
  friendship: {
    playful: [
      "You're the kind of friend everyone wishes they had! 💖 So lucky!",
      "Your friendship sparkles like glitter - it makes everything better! ✨",
      "You have a magical way of making people feel special! 🌟",
      "Friends are drawn to your awesome energy like bees to flowers! 🌺",
      "You create the most amazing memories with people! Keep spreading joy! 🎈"
    ],
    gentle: [
      "You have such a caring heart, and your friends are blessed to know you.",
      "The way you listen and support others shows what a wonderful friend you are.",
      "Your kindness creates safe spaces where friendships can grow.",
      "You understand that good friends lift each other up.",
      "The love you give to others comes back to you in beautiful ways."
    ],
    friendly: [
      "You know how to be a great friend, and that's a special gift.",
      "Your loyalty and kindness make your friendships strong and lasting.",
      "You create fun and meaningful connections with others.",
      "Friends trust you because you show them respect and care.",
      "You're learning how to build healthy, happy relationships."
    ]
  },
  school: {
    playful: [
      "Your brain is like a sponge soaking up all sorts of cool knowledge! 🧠✨",
      "Every question you ask makes you smarter and more curious! 🤔💡",
      "Learning is your adventure, and you're the brave explorer! 🗺️",
      "Your creativity in school projects is absolutely incredible! 🎨",
      "You turn learning into something fun and exciting! Keep it up! 🚀"
    ],
    gentle: [
      "Learning takes time, and you're growing at exactly the right pace for you.",
      "It's okay to make mistakes - that's how we discover new things.",
      "Your efforts in school show how much you care about your future.",
      "Every subject teaches you something valuable about the world.",
      "You have your own special way of understanding and remembering things."
    ],
    friendly: [
      "You're developing skills that will help you throughout your life.",
      "Your curiosity and questions show how engaged you are in learning.",
      "School challenges help you discover just how capable you are.",
      "You're building knowledge that will open doors to amazing opportunities.",
      "Your teachers see your potential and believe in your success."
    ]
  }
};

// Function to generate personalized daily affirmations
export async function generateDailyAffirmations() {
  try {
    // Get all active child profiles
    const children = await storage.getAllChildProfiles();
    
    for (const child of children) {
      // Check user's subscription tier for daily limit
      const limit = await storage.getDailyAffirmationLimit(child.userId);
      const todaysAffirmations = await storage.getTodaysAffirmations(child.id);
      
      // Skip if already reached daily limit
      if (todaysAffirmations.length >= limit) {
        continue;
      }
      
      // Get child's personality for personalized selection
      const personality = await storage.getChildPersonality(child.id);
      const communicationStyle = personality?.communicationStyle || 'friendly';
      
      // Determine appropriate categories based on recent interactions or random selection
      const categories = ['motivation', 'confidence', 'friendship', 'school'];
      const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
      
      // Select affirmation based on personality
      const categoryTemplates = affirmationTemplates[selectedCategory][communicationStyle];
      const selectedMessage = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
      
      // Create the daily affirmation
      await storage.createDailyAffirmation({
        childId: child.id,
        message: selectedMessage,
        category: selectedCategory
      });
      
      console.log(`Daily affirmation sent to ${child.name}: ${selectedMessage}`);
    }
    
    console.log('Daily affirmations generation completed');
  } catch (error) {
    console.error('Error generating daily affirmations:', error);
  }
}

// Function to schedule daily affirmations (called from server startup)
export function scheduleDailyAffirmations() {
  // Generate initial affirmations if needed
  generateDailyAffirmations();
  
  // Schedule for every morning at 8 AM
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  
  // If it's already past 8 AM today, schedule for tomorrow
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  
  const msUntilTarget = target.getTime() - now.getTime();
  
  setTimeout(() => {
    generateDailyAffirmations();
    
    // Then repeat every 24 hours
    setInterval(generateDailyAffirmations, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
  
  console.log(`Daily affirmations scheduled for ${target.toLocaleString()}`);
}

// Function to get contextual affirmations based on mood or recent activities
export async function getContextualAffirmation(
  childId: string, 
  context: 'mood_low' | 'achievement' | 'struggle' | 'general'
): Promise<string> {
  const personality = await storage.getChildPersonality(childId);
  const style = personality?.communicationStyle || 'friendly';
  
  const contextualMessages = {
    mood_low: {
      playful: "Hey sunshine! Even clouds need breaks before they make rainbows! 🌈 You've got this!",
      gentle: "It's okay to have difficult days. Tomorrow is a fresh start, and you're stronger than you know.",
      friendly: "Tough days don't last, but resilient people like you do. You'll get through this."
    },
    achievement: {
      playful: "WOW! Look at you being absolutely AMAZING! 🎉 I'm so proud of you!",
      gentle: "Your hard work and dedication have paid off. You should feel proud of what you've accomplished.",
      friendly: "Congratulations! Your effort and persistence have led to this wonderful success."
    },
    struggle: {
      playful: "Every superhero has moments that test their powers! 💪 You're learning and growing!",
      gentle: "Challenges are opportunities in disguise. You're building resilience with each step forward.",
      friendly: "It's normal to face difficulties. What matters is how you keep trying, and you're doing great."
    },
    general: {
      playful: "You're absolutely fantastic and the world is lucky to have you! ✨",
      gentle: "You are valued, loved, and important exactly as you are.",
      friendly: "You bring something special to every day just by being yourself."
    }
  };
  
  return contextualMessages[context][style];
}