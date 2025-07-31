import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sparkles, Heart, Star, Palette } from "lucide-react";
import logoPath from "@assets/logo2_1753946260065.png";

const companionSchema = z.object({
  childName: z.string().min(2, "Child's name must be at least 2 characters"),
  age: z.number().min(8).max(16),
  companionName: z.string().min(2, "Companion name must be at least 2 characters"),
  personality: z.object({
    supportiveness: z.number().min(0).max(1),
    playfulness: z.number().min(0).max(1),
    wisdom: z.number().min(0).max(1),
    creativity: z.number().min(0).max(1),
  }),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  favoriteColors: z.array(z.string()).min(1, "Select at least one color"),
});

type CompanionForm = z.infer<typeof companionSchema>;

const personalityTraits = [
  { key: 'supportiveness', label: 'Supportive', description: 'How encouraging and emotionally supportive', icon: Heart },
  { key: 'playfulness', label: 'Playful', description: 'How fun and energetic', icon: Star },
  { key: 'wisdom', label: 'Wise', description: 'How thoughtful and insightful', icon: Sparkles },
  { key: 'creativity', label: 'Creative', description: 'How imaginative and artistic', icon: Palette },
];

const interestOptions = [
  'Art & Drawing', 'Music', 'Reading', 'Sports', 'Science', 'Animals', 'Cooking',
  'Dance', 'Video Games', 'Nature', 'Fashion', 'Technology', 'Photography', 'Writing'
];

const colorOptions = [
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#9370DB' },
  { name: 'Blue', value: '#4169E1' },
  { name: 'Teal', value: '#20B2AA' },
  { name: 'Green', value: '#32CD32' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Orange', value: '#FF8C00' },
  { name: 'Red', value: '#DC143C' },
];

export default function CompanionSetup() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<CompanionForm>({
    resolver: zodResolver(companionSchema),
    defaultValues: {
      childName: '',
      age: 12,
      companionName: '',
      personality: {
        supportiveness: 0.8,
        playfulness: 0.7,
        wisdom: 0.6,
        creativity: 0.7,
      },
      interests: [],
      favoriteColors: [],
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: CompanionForm) => {
      return apiRequest("POST", "/api/child-profiles", {
        name: data.childName,
        age: data.age,
        companionName: data.companionName,
        personalityProfile: data.personality,
        preferences: {
          interests: data.interests,
          favoriteColors: data.favoriteColors,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/child-profiles"] });
      toast({
        title: "Profile Created!",
        description: `${form.getValues().companionName} is ready to be your companion!`,
      });
      // Redirect to chat or home
      window.location.href = "/";
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanionForm) => {
    createProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to create your companion.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-3">
          <img src={logoPath} alt="My Pocket Sister" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold text-gray-800">My Pocket Sister</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Create Your AI Companion</h1>
            <p className="text-xl text-gray-600">Let's design the perfect companion just for you!</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <span>Step {step} of 3</span>
              </CardTitle>
              <CardDescription>
                {step === 1 && "Tell us about yourself"}
                {step === 2 && "Design your companion's personality"}
                {step === 3 && "Choose interests and preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="childName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="What should we call you?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Age</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your age" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 9 }, (_, i) => i + 8).map((age) => (
                                  <SelectItem key={age} value={age.toString()}>
                                    {age} years old
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companionName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Companion's Name</FormLabel>
                            <FormControl>
                              <Input placeholder="What would you like to name your AI companion?" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is what you'll call your AI friend. Popular names include Stella, Luna, Maya, or anything you like!
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Design {form.watch('companionName') || 'Your Companion'}'s Personality</h3>
                        <p className="text-gray-600 mb-6">Move the sliders to create the perfect personality mix!</p>
                      </div>

                      {personalityTraits.map((trait) => {
                        const Icon = trait.icon;
                        return (
                          <FormField
                            key={trait.key}
                            control={form.control}
                            name={`personality.${trait.key as keyof CompanionForm['personality']}`}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center space-x-3 mb-2">
                                  <Icon className="h-5 w-5 text-purple-500" />
                                  <FormLabel className="font-medium">{trait.label}</FormLabel>
                                </div>
                                <FormDescription className="text-sm text-gray-600 mb-3">
                                  {trait.description}
                                </FormDescription>
                                <FormControl>
                                  <div className="space-y-2">
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={field.value}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Less</span>
                                      <span>{Math.round(field.value * 100)}%</span>
                                      <span>More</span>
                                    </div>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What are you interested in?</FormLabel>
                            <FormDescription>
                              Select the things you love so your companion can chat about them with you!
                            </FormDescription>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              {interestOptions.map((interest) => (
                                <label
                                  key={interest}
                                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                    field.value.includes(interest)
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(interest)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, interest]);
                                      } else {
                                        field.onChange(field.value.filter((item) => item !== interest));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <span className="text-sm">{interest}</span>
                                </label>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favoriteColors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favorite Colors</FormLabel>
                            <FormDescription>
                              Choose colors you love for your companion's theme!
                            </FormDescription>
                            <div className="grid grid-cols-4 gap-3 mt-3">
                              {colorOptions.map((color) => (
                                <label
                                  key={color.name}
                                  className={`flex flex-col items-center space-y-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                    field.value.includes(color.value)
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(color.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, color.value]);
                                      } else {
                                        field.onChange(field.value.filter((item) => item !== color.value));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <span className="text-xs">{color.name}</span>
                                </label>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                      >
                        Previous
                      </Button>
                    )}
                    
                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="ml-auto"
                        disabled={
                          (step === 1 && (!form.watch('childName') || !form.watch('companionName'))) ||
                          (step === 2 && Object.values(form.watch('personality')).some(v => v === undefined))
                        }
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="ml-auto"
                        disabled={createProfileMutation.isPending}
                      >
                        {createProfileMutation.isPending ? "Creating..." : "Create My Companion"}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}