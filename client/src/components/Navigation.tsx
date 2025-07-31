import { useState } from "react";
import { Heart, Menu, X, MessageCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Heart className="text-primary-pink h-6 w-6 mr-2" />
              <span className="font-nunito font-bold text-xl text-primary-purple">My Pocket Sister</span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="hover:text-primary-pink px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="hover:text-primary-pink px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Stories
              </button>
              <button 
                onClick={() => scrollToSection('blog')}
                className="hover:text-primary-pink px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Blog
              </button>
              <button 
                onClick={() => scrollToSection('parents')}
                className="hover:text-primary-pink px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                For Parents
              </button>
              <Link href="/chat">
                <Button variant="outline" className="border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
              <Link href="/parent-portal">
                <Button variant="outline" className="border-primary-purple text-primary-purple hover:bg-primary-purple hover:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Parent Portal
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              className="text-gray-700 hover:text-primary-pink"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-pastel-lavender">
            <button 
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-3 py-2 text-base font-medium hover:text-primary-pink"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="block w-full text-left px-3 py-2 text-base font-medium hover:text-primary-pink"
            >
              Stories
            </button>
            <button 
              onClick={() => scrollToSection('blog')}
              className="block w-full text-left px-3 py-2 text-base font-medium hover:text-primary-pink"
            >
              Blog
            </button>
            <button 
              onClick={() => scrollToSection('parents')}
              className="block w-full text-left px-3 py-2 text-base font-medium hover:text-primary-pink"
            >
              For Parents
            </button>
            <Link href="/chat">
              <Button className="w-full text-left bg-primary-pink text-white px-3 py-2 rounded-lg font-medium mt-2">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chatting
              </Button>
            </Link>
            <Link href="/parent-portal">
              <Button variant="outline" className="w-full text-left border-primary-purple text-primary-purple px-3 py-2 rounded-lg font-medium mt-2">
                <Shield className="h-4 w-4 mr-2" />
                Parent Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
