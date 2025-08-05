import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@shared/schema";

const categories = ["All Posts", "Friendship", "Creativity", "Self-Care", "Growth"];

export default function BlogSection() {
  const [selectedCategory, setSelectedCategory] = useState("All Posts");

  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: selectedCategory === "All Posts" 
      ? ['/api/blog-posts'] 
      : ['/api/blog-posts', { category: selectedCategory }],
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      "Friendship": "bg-primary-pink text-white",
      "Creativity": "bg-accent-gold text-white", 
      "Self-Care": "bg-accent-green text-white",
      "Growth": "bg-primary-purple text-white"
    };
    return colors[category as keyof typeof colors] || "bg-gray-200 text-gray-700";
  };

  if (isLoading) {
    return (
      <section id="blog" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-bold text-3xl md:text-5xl text-gray-800 mb-4">
            Discover & <span className="text-primary-purple">Learn</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our blog for tips on friendship, creativity, self-care, and so much more. Written just for amazing girls like you!
          </p>
        </div>
        
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-primary-pink hover:text-white'
              }`}
              variant="ghost"
            >
              {category}
            </Button>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts?.map((post: BlogPost) => (
            <article key={post.id} className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="w-full h-48 object-cover" 
              />
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-gray-500 text-sm ml-3">{post.readTime} min read</span>
                </div>
                <h3 className="font-nunito font-bold text-xl text-gray-800 mb-3">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <button className="text-primary-pink font-medium hover:text-primary-purple transition-colors flex items-center">
                    Read More <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Heart className="mr-1 h-4 w-4" />
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="gradient-pink-purple text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
            Load More Posts
          </Button>
        </div>
      </div>
    </section>
  );
}
