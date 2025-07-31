import { useState } from "react";
import { Heart, Lightbulb, Gamepad2, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const avatarResponses = {
  inspiration: "💫 Remember, every expert was once a beginner. You're doing amazing by trying new things! What would you like to explore today?",
  advice: "💭 Having trouble with a friend? Let's talk through it together! Remember, every friendship has its ups and downs, and that's totally normal.",
  activity: "🌈 Let's try making friendship bracelets today! All you need are some colorful threads and creativity. I'll guide you step by step!",
  health: "💧 Time for a water break! Stay hydrated, superstar! Your body and mind work best when you're taking good care of yourself."
};

export default function AIAvatar() {
  const [currentMessage, setCurrentMessage] = useState("💫 Remember, every expert was once a beginner. You're doing amazing by trying new things! What would you like to explore today?");

  const { data: randomMessage } = useQuery({
    queryKey: ['/api/motivational-messages/random'],
    enabled: false,
  });

  const handleButtonClick = (category: keyof typeof avatarResponses) => {
    setCurrentMessage(avatarResponses[category]);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 gradient-pink-purple"></div>
      
      {/* Avatar Character */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 gradient-pink-purple rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-3xl">👩‍🚀</span>
        </div>
        <h3 className="font-nunito font-bold text-xl text-gray-800">Hi! I'm Stella ✨</h3>
        <p className="text-sm text-gray-600">Your AI Pocket Sister</p>
      </div>
      
      {/* Demo Message */}
      <div className="bg-pastel-lavender rounded-2xl p-4 mb-4">
        <p className="text-gray-700 font-medium">{currentMessage}</p>
      </div>
      
      {/* Interactive Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => handleButtonClick('inspiration')}
          className="bg-accent-green bg-opacity-20 text-accent-green px-4 py-2 rounded-xl font-medium hover:bg-opacity-30 transition-all"
          variant="ghost"
        >
          <Heart className="mr-1 h-4 w-4" />
          Inspire Me
        </Button>
        <Button 
          onClick={() => handleButtonClick('advice')}
          className="bg-primary-pink bg-opacity-20 text-primary-pink px-4 py-2 rounded-xl font-medium hover:bg-opacity-30 transition-all"
          variant="ghost"
        >
          <Lightbulb className="mr-1 h-4 w-4" />
          Get Advice
        </Button>
        <Button 
          onClick={() => handleButtonClick('activity')}
          className="bg-accent-gold bg-opacity-20 text-yellow-700 px-4 py-2 rounded-xl font-medium hover:bg-opacity-30 transition-all"
          variant="ghost"
        >
          <Gamepad2 className="mr-1 h-4 w-4" />
          Fun Activity
        </Button>
        <Button 
          onClick={() => handleButtonClick('health')}
          className="bg-primary-purple bg-opacity-20 text-primary-purple px-4 py-2 rounded-xl font-medium hover:bg-opacity-30 transition-all"
          variant="ghost"
        >
          <Apple className="mr-1 h-4 w-4" />
          Health Tip
        </Button>
      </div>
    </div>
  );
}
