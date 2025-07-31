import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaMicrosoft, FaLinkedin, FaYahoo } from "react-icons/fa";
import { SiMeta } from "react-icons/si";
import { ArrowLeft, Shield, Users, Heart } from "lucide-react";

interface OAuthSignInProps {
  onBack: () => void;
  isSignUp?: boolean;
}

export default function OAuthSignIn({ onBack, isSignUp = true }: OAuthSignInProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  const providers = [
    {
      id: "google",
      name: "Google",
      icon: FaGoogle,
      color: "bg-red-500 hover:bg-red-600",
      available: true,
      endpoint: "/api/login"
    },
    {
      id: "microsoft",
      name: "Microsoft",
      icon: FaMicrosoft,
      color: "bg-blue-600 hover:bg-blue-700",
      available: false, // Coming soon
      endpoint: "/api/login/microsoft"
    },
    {
      id: "meta",
      name: "Meta (Facebook)",
      icon: SiMeta,
      color: "bg-blue-500 hover:bg-blue-600",
      available: false, // Coming soon
      endpoint: "/api/login/meta"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      available: false, // Coming soon
      endpoint: "/api/login/linkedin"
    },
    {
      id: "yahoo",
      name: "Yahoo",
      icon: FaYahoo,
      color: "bg-purple-600 hover:bg-purple-700",
      available: false, // Coming soon
      endpoint: "/api/login/yahoo"
    }
  ];

  const handleProviderClick = (provider: typeof providers[0]) => {
    if (provider.available) {
      setSelectedProvider(provider.id);
      // Redirect to OAuth provider
      window.location.href = provider.endpoint;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-pink-600" />
            <CardTitle className="text-2xl">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </CardTitle>
          </div>
          <CardDescription>
            {isSignUp 
              ? "Sign up with your preferred account to get started" 
              : "Sign in to continue to your account"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-gray-700">
              Choose your sign-in method
            </h3>
            
            {providers.map((provider) => {
              const IconComponent = provider.icon;
              
              return (
                <Button
                  key={provider.id}
                  variant={provider.available ? "default" : "outline"}
                  className={`w-full justify-start relative ${
                    provider.available 
                      ? provider.color + " text-white" 
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => handleProviderClick(provider)}
                  disabled={!provider.available || selectedProvider === provider.id}
                >
                  {selectedProvider === provider.id ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-3" />
                  ) : (
                    <IconComponent className="mr-3 h-4 w-4" />
                  )}
                  
                  <span className="flex-1 text-left">
                    {isSignUp ? "Sign up" : "Sign in"} with {provider.name}
                  </span>
                  
                  {!provider.available && (
                    <span className="text-xs opacity-75">Coming Soon</span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-3 rounded-lg mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Secure & Private</span>
            </div>
            <p className="text-xs text-blue-700">
              We use industry-standard OAuth 2.0 security. We never store your login credentials 
              and only access basic profile information with your permission.
            </p>
          </div>

          {/* Parent Notice */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">For Parents</span>
            </div>
            <p className="text-xs text-purple-700">
              This account will be used to create and monitor your child's AI companion experience. 
              You'll have full control over usage limits and conversation history.
            </p>
          </div>

          {/* Terms Notice */}
          <p className="text-xs text-gray-600 text-center">
            By continuing, you'll be asked to review and accept our Terms of Service, 
            Privacy Policy, and provide parental consent before creating any child profiles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}