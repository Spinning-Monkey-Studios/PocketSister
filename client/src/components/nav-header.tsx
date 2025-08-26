import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  User, 
  HelpCircle,
  Shield,
  Smartphone,
  LogOut 
} from "lucide-react";

export function NavHeader() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/parent-dashboard", label: "Parent Portal", icon: Shield },
    { path: "/avatar", label: "Avatar", icon: User },
    { path: "/support", label: "Support", icon: HelpCircle },
  ];

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Smartphone className="h-6 w-6 text-pink-500" />
            <span className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              MyPocketSister
            </span>
          </Link>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {user && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user.subscriptionTier || 'free'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}