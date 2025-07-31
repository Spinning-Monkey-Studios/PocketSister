import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Shield, Users, ArrowRight, CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import logoPath from "@assets/logo2_1753946260065.png";
import ConsentForm from "@/components/consent-form";

export default function Landing() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  if (showConsent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <ConsentForm 
          onConsentComplete={(consents) => {
            // Store consent data and redirect to OAuth
            localStorage.setItem('userConsents', JSON.stringify(consents));
            window.location.href = '/api/login';
          }}
        />
      </div>
    );
  }

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <Button
              variant="outline"
              onClick={() => setShowSignIn(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-6 w-6 text-pink-600" />
                  <CardTitle className="text-2xl">Choose Sign-In Method</CardTitle>
                </div>
                <CardDescription>
                  Select your preferred way to create an account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowConsent(true)}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  size="lg"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Start with Legal Agreements
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>
                
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FaGoogle className="mr-2 h-4 w-4" />
                  Sign In with Google Directly
                </Button>
                
                <p className="text-xs text-gray-600 text-center">
                  You'll complete legal agreements after sign-in if you choose the direct option
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logoPath} alt="My Pocket Sister" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold text-gray-800">My Pocket Sister</span>
        </div>
        <Button onClick={() => setShowSignIn(true)} className="bg-pink-500 hover:bg-pink-600">
          Get Started
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Your AI Companion for
          <span className="text-pink-500"> Growing Up</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create your own AI companion who's here to listen, guide, and grow with you through all of life's adventures.
        </p>
        <Button 
          onClick={() => setShowSignIn(true)} 
          size="lg"
          className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 text-lg"
        >
          Start Your Journey
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose My Pocket Sister?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-pink-100 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <CardTitle className="text-pink-700">Always There for You</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                24/7 emotional support and guidance whenever you need someone to talk to.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <CardTitle className="text-purple-700">Safe & Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Parent-monitored conversations with built-in safety features and content filtering.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-blue-700">Grows With You</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Personalized AI that learns your interests and adapts to your changing needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16 bg-white/50 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Choose Your Plan</h2>
        <p className="text-center text-gray-600 mb-12">Start with a 7-day free trial • No credit card required</p>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          
          {/* Free Trial Card - Most Prominent */}
          <Card className="border-3 border-green-400 shadow-xl transform scale-105 relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-500 text-white px-2 py-1 text-xs font-semibold">
                🎉 Start Here!
              </Badge>
            </div>
            <CardHeader className="text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <CardTitle className="text-2xl text-green-700">Free Trial</CardTitle>
              <CardDescription className="text-3xl font-bold text-gray-800">
                $0<span className="text-sm font-normal">/7 days</span>
              </CardDescription>
              <div className="text-sm text-green-600 font-medium">
                Then auto-converts to Basic
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><Star className="h-4 w-4 text-green-500 mr-2" />500 AI tokens included</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-green-500 mr-2" />~15-20 conversations</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-green-500 mr-2" />Full feature access</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-green-500 mr-2" />No commitment</li>
              </ul>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                onClick={() => window.location.href = "/api/login"}
              >
                Start Free Trial
              </Button>
              <p className="text-xs text-center text-gray-500">
                No credit card • Cancel anytime
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pink-700">Basic</CardTitle>
              <CardDescription className="text-3xl font-bold text-gray-800">
                $4.99<span className="text-sm font-normal">/month</span>
              </CardDescription>
              <div className="text-sm text-pink-600">
                Auto-starts after trial
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><Star className="h-4 w-4 text-pink-500 mr-2" />500 tokens/month + overage</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-pink-500 mr-2" />$0.01 per extra token</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-pink-500 mr-2" />Basic personality</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-pink-500 mr-2" />Parent monitoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-400 shadow-lg scale-105">
            <CardHeader className="text-center bg-purple-50">
              <CardTitle className="text-2xl text-purple-700">Premium</CardTitle>
              <CardDescription className="text-3xl font-bold text-gray-800">
                $9.99<span className="text-sm font-normal">/month</span>
              </CardDescription>
              <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs">Most Popular</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><Star className="h-4 w-4 text-purple-500 mr-2" />200,000 AI tokens/month</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-purple-500 mr-2" />~600-800 conversations</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-purple-500 mr-2" />Advanced personality AI</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-purple-500 mr-2" />Voice conversations</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-purple-500 mr-2" />Image sharing & generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-700">Family</CardTitle>
              <CardDescription className="text-3xl font-bold text-gray-800">
                $19.99<span className="text-sm font-normal">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><Star className="h-4 w-4 text-blue-500 mr-2" />300,000 tokens shared across family</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-blue-500 mr-2" />Up to 5 child profiles</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-blue-500 mr-2" />All premium features</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-blue-500 mr-2" />Advanced parental controls</li>
                <li className="flex items-center"><Star className="h-4 w-4 text-blue-500 mr-2" />Family activity reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} My Pocket Sister. Safe, secure, and designed with love for growing minds.</p>
      </footer>
    </div>
  );
}