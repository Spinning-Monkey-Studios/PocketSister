import { Heart } from "lucide-react";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#" },
      { label: "Download App", href: "#" },
      { label: "System Requirements", href: "#" }
    ]
  },
  {
    title: "Support", 
    links: [
      { label: "Help Center", href: "#" },
      { label: "Parent Guide", href: "#parents" },
      { label: "Safety", href: "#" },
      { label: "Contact Us", href: "#" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" }
    ]
  }
];

const socialLinks = [
  { icon: "fab fa-facebook-f", href: "#", label: "Facebook" },
  { icon: "fab fa-instagram", href: "#", label: "Instagram" },
  { icon: "fab fa-twitter", href: "#", label: "Twitter" },
  { icon: "fab fa-youtube", href: "#", label: "YouTube" }
];

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    if (sectionId.startsWith('#')) {
      const element = document.getElementById(sectionId.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <Heart className="text-primary-pink h-6 w-6 mr-2" />
              <span className="font-nunito font-bold text-xl">My Pocket Sister</span>
            </div>
            <p className="text-gray-400 mb-6">Empowering young girls with AI-powered support, inspiration, and guidance for confident growth.</p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="w-10 h-10 bg-primary-pink rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors" 
                  aria-label={social.label}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
          
          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-nunito font-bold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button 
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-primary-pink transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} My Pocket Sister. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-primary-pink text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-primary-pink text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-primary-pink text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
