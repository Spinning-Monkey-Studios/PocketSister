import { Shield, Users, Eye, GraduationCap, Heart, Star, Lightbulb, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

const safetyFeatures = [
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "All conversations are private and secure. We never store personal information or share data with third parties.",
    color: "bg-accent-green"
  },
  {
    icon: Users,
    title: "Age-Appropriate Content",
    description: "All advice and content is specifically designed for girls aged 10-14, reviewed by child development experts.",
    color: "bg-primary-pink"
  },
  {
    icon: Eye,
    title: "Parental Visibility",
    description: "Optional parent dashboard allows you to see usage patterns and general topics discussed (not specific conversations).",
    color: "bg-primary-purple"
  },
  {
    icon: GraduationCap,
    title: "Educational Focus",
    description: "Promotes positive values, emotional intelligence, and healthy decision-making skills for lifelong growth.",
    color: "bg-accent-gold"
  }
];

const benefits = [
  {
    icon: Heart,
    title: "Emotional Support",
    description: "24/7 access to encouragement and guidance during challenging moments.",
    gradient: "gradient-pink-purple"
  },
  {
    icon: Star,
    title: "Confidence Building", 
    description: "Daily affirmations and achievements help build lasting self-esteem.",
    gradient: "gradient-purple-green"
  },
  {
    icon: Lightbulb,
    title: "Problem Solving",
    description: "Learn to think through challenges independently with guided support.",
    gradient: "gradient-green-gold"
  },
  {
    icon: Sprout,
    title: "Personal Growth",
    description: "Develop healthy habits and positive mindsets for lifelong success.",
    gradient: "gradient-gold-pink"
  }
];

const familyImages = [
  {
    src: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    alt: "Mother and daughter having a meaningful conversation and bonding",
    title: "Open Communication",
    subtitle: "Building trust and understanding",
    overlay: "from-primary-purple via-transparent to-transparent"
  },
  {
    src: "https://images.unsplash.com/photo-1474649107449-ea4f014b7e9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    alt: "Supportive family environment with parents and children together",
    title: "Family Support",
    subtitle: "Growing together as a team",
    overlay: "from-primary-pink via-transparent to-transparent"
  }
];

export default function ParentGuideSection() {
  return (
    <section id="parents" className="py-20 bg-gradient-to-br from-pastel-rose to-pastel-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-bold text-3xl md:text-5xl text-gray-800 mb-4">
            A Message for <span className="text-primary-purple">Parents</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how My Pocket Sister creates a safe, supportive environment for your daughter's growth and development.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1511895426328-dc8714efa998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Happy family moment with parents and daughter sharing quality time together" 
              className="rounded-3xl shadow-2xl w-full" 
            />
          </div>
          
          <div>
            <h3 className="font-nunito font-bold text-2xl md:text-3xl text-gray-800 mb-6">
              Safe, Smart, & Supportive
            </h3>
            
            {/* Safety Features */}
            <div className="space-y-6">
              {safetyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mr-4 flex-shrink-0`}>
                      <IconComponent className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h4>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button className="gradient-pink-purple text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
                Learn More About Safety
              </Button>
              <Button 
                variant="outline" 
                className="border-2 border-primary-purple text-primary-purple px-6 py-3 rounded-full font-semibold hover:bg-primary-purple hover:text-white transition-all"
              >
                Download Parent Guide
              </Button>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="mt-20">
          <h3 className="font-nunito font-bold text-2xl md:text-3xl text-gray-800 text-center mb-12">
            Benefits for Your Daughter
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${benefit.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="text-white h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Family Bonding Images */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          {familyImages.map((image, index) => (
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
