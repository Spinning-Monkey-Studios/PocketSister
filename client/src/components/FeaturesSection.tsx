import { Quote, Brain, Heart, Palette } from "lucide-react";

const features = [
  {
    icon: Quote,
    title: "Daily Inspiration",
    description: "Get personalized motivational messages that lift your spirits and remind you how amazing you are!",
    example: "You have the power to create positive change in the world! 🌟",
    gradient: "from-pastel-rose to-white",
    iconBg: "bg-primary-pink"
  },
  {
    icon: Brain,
    title: "Smart Advice",
    description: "Ask questions about school, friends, or life - get thoughtful, age-appropriate guidance tailored just for you.",
    example: "Having trouble with a friend? Let's talk through it together! 💭",
    gradient: "from-pastel-lavender to-white",
    iconBg: "bg-primary-purple"
  },
  {
    icon: Heart,
    title: "Healthy Habits",
    description: "Gentle reminders to drink water, move your body, and take care of your mental wellbeing.",
    example: "Time for a water break! Stay hydrated, superstar! 💧",
    gradient: "from-green-100 to-white",
    iconBg: "bg-accent-green"
  },
  {
    icon: Palette,
    title: "Creative Fun",
    description: "Discover new hobbies, creative challenges, and fun activities to spark your imagination and keep you engaged.",
    example: "Let's try making friendship bracelets today! 🌈",
    gradient: "from-yellow-100 to-white",
    iconBg: "bg-accent-gold"
  }
];

const featureImages = [
  {
    src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Young girls engaged in collaborative learning",
    title: "Learn Together",
    subtitle: "Collaborative growth and discovery",
    overlay: "from-primary-pink via-transparent to-transparent"
  },
  {
    src: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Creative educational STEM activities for young learners",
    title: "Explore & Create",
    subtitle: "Hands-on learning adventures",
    overlay: "from-primary-purple via-transparent to-transparent"
  },
  {
    src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Children's hands creating colorful arts and crafts projects",
    title: "Express Yourself",
    subtitle: "Artistic creativity unleashed",
    overlay: "from-green-500 via-transparent to-transparent"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-bold text-3xl md:text-5xl text-gray-800 mb-4">
            Amazing Features Just for <span className="text-primary-pink">You!</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            My Pocket Sister is packed with incredible features designed to support your growth, creativity, and happiness every single day.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${feature.gradient} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <IconComponent className="text-white h-8 w-8" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-gray-800 mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center mb-4">{feature.description}</p>
                <div className="bg-white rounded-xl p-3 text-sm text-gray-700 italic">
                  "{feature.example}"
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Feature Images */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {featureImages.map((image, index) => (
            <div key={index} className="relative overflow-hidden rounded-2xl shadow-lg">
              <img 
                src={image.src} 
                alt={image.alt} 
                className="w-full h-64 object-cover" 
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${image.overlay} opacity-60`}></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-bold text-lg">{image.title}</h4>
                <p className="text-sm">{image.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
