import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageCircle, Book, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Support",
    description: "support@mypocketsister.com",
    color: "bg-primary-pink"
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Available 24/7 for parents",
    color: "bg-primary-purple"
  },
  {
    icon: Book,
    title: "Help Center",
    description: "Find answers to common questions",
    color: "bg-accent-green"
  }
];

const faqItems = [
  {
    question: "Is My Pocket Sister free to try?",
    answer: "Yes! We offer a 7-day free trial."
  },
  {
    question: "What age range is this for?",
    answer: "Designed specifically for girls aged 10-14."
  },
  {
    question: "Is it safe for my daughter?",
    answer: "Absolutely! Privacy and safety are our top priorities."
  }
];

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message! We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-bold text-3xl md:text-5xl text-gray-800 mb-4">
            Get in <span className="text-primary-pink">Touch</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We're here to help! Reach out to learn more about My Pocket Sister or get support.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-gradient-to-br from-pastel-lavender to-white p-8 rounded-3xl shadow-lg">
            <h3 className="font-nunito font-bold text-2xl text-gray-800 mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <Select onValueChange={(value) => handleInputChange("subject", value)} required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="parent">Parent Questions</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="media">Media Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Tell us how we can help you..."
                  rows={4}
                  required
                  className="rounded-xl"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={contactMutation.isPending}
                className="w-full gradient-pink-purple text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Send className="mr-2 h-4 w-4" />
                {contactMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="font-nunito font-bold text-2xl text-gray-800 mb-6">Other ways to reach us</h3>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-center">
                      <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mr-4`}>
                        <IconComponent className="text-white h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{info.title}</h4>
                        <p className="text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* FAQ Preview */}
            <div className="bg-pastel-blue rounded-2xl p-6">
              <h4 className="font-nunito font-bold text-lg text-gray-800 mb-4">Quick Questions?</h4>
              <div className="space-y-3">
                {faqItems.map((faq, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-gray-700">{faq.question}</p>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
