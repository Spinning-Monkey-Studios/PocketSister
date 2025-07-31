import { Rocket, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIAvatar from "./AIAvatar";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-pastel-blue via-pastel-lavender to-pastel-rose py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-nunito font-bold text-4xl md:text-6xl text-gray-800 mb-6">
              Meet Your 
              <span className="text-gradient-pink-purple"> Pocket Sister</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              An AI companion designed to inspire, support, and empower young girls with personalized advice, motivational messages, and fun activities that help you grow into your amazing self!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="gradient-pink-purple text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                className="border-2 border-primary-purple text-primary-purple px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-purple hover:text-white transition-all"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <AIAvatar />
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 text-4xl animate-bounce-slow">⭐</div>
            <div className="absolute -bottom-4 -right-4 text-4xl animate-pulse-slow">🌈</div>
          </div>
        </div>
      </div>
    </section>
  );
}
