import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Testimonial } from "@shared/schema";

export default function TestimonialsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['/api/testimonials'],
  });

  if (isLoading || !testimonials) {
    return (
      <section id="testimonials" className="py-20 bg-gradient-to-br from-pastel-blue to-pastel-lavender">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const getGradientClass = (index: number) => {
    const gradients = [
      "gradient-pink-purple",
      "gradient-purple-green", 
      "gradient-gold-pink"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-pastel-blue to-pastel-lavender">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-bold text-3xl md:text-5xl text-gray-800 mb-4">
            Amazing Stories from <span className="text-primary-purple">Our Community</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how My Pocket Sister is making a positive difference in the lives of young girls everywhere!
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial: Testimonial, index: number) => (
            <div key={testimonial.id} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 ${getGradientClass(index)} rounded-full flex items-center justify-center text-white font-bold`}>
                  {getInitial(testimonial.name)}
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-800">{testimonial.name}, {testimonial.age}</h4>
                  <div className="flex text-accent-gold">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "{testimonial.content}"
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Verified User</span>
                <Heart className="h-4 w-4 text-primary-pink" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Carousel Controls */}
        <div className="flex justify-center mt-8 space-x-4">
          {[0, 1, 2].map((index) => (
            <Button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full p-0 ${
                currentSlide === index ? 'bg-primary-pink' : 'bg-gray-300 hover:bg-primary-pink'
              } transition-colors`}
              variant="ghost"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
