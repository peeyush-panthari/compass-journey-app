import { useState } from "react";
import { Compass, Heart, Eye, Share, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface ExploreBlog {
  id: string; title: string; excerpt: string; image: string; author: string; authorAvatar: string; likes: number; views: number; url: string; category: "destination" | "food" | "video"; type: "blog" | "video";
}

const allBlogs: ExploreBlog[] = [
  { id: "e1", title: "Labuan Bajo 3-Day Itinerary: See Komodo Dragons & Pink Beach", excerpt: "Visited Labuan Bajo multiple times and sailed through Komodo National Park. Sharing the best 3-day itinerary covering all the must-see spots.", image: "https://images.unsplash.com/photo-1570789210967-2cac24ba4d28?w=500&h=350&fit=crop", author: "Mikorev", authorAvatar: "M", likes: 12, views: 96, url: "#", category: "destination", type: "blog" },
  { id: "e2", title: "Hidden Gems of Ubud: Beyond the Rice Terraces", excerpt: "Bali's Ubud has so much more than Tegallalang. Discover secret waterfalls, local art villages, and sunrise treks that most tourists miss.", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=350&fit=crop", author: "Bali Expat", authorAvatar: "B", likes: 8, views: 81, url: "#", category: "destination", type: "blog" },
  { id: "e3", title: "Pasig City Walking Guide: History & Culture", excerpt: "It's a series of stops that will make you experience Pasig at its core. You'll find the simplicity of life and rich heritage.", image: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=500&h=350&fit=crop", author: "Ken @ Medium", authorAvatar: "K", likes: 5, views: 76, url: "#", category: "destination", type: "blog" },
  { id: "e4", title: "Best Street Food in Bangkok: A Local's Guide", excerpt: "From Pad Thai at Thip Samai to mango sticky rice at Mae Varee — a curated list of Bangkok's legendary street food vendors.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=350&fit=crop", author: "Thai Foodie", authorAvatar: "T", likes: 24, views: 312, url: "#", category: "food", type: "blog" },
  { id: "e5", title: "Rome's Hidden Trattorias: Where Locals Actually Eat", excerpt: "Skip the tourist traps near the Colosseum. These family-run trattorias serve the best cacio e pepe and carbonara in the city.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=350&fit=crop", author: "Roma Eats", authorAvatar: "R", likes: 18, views: 204, url: "#", category: "food", type: "blog" },
  { id: "e6", title: "Tokyo Ramen Map: 10 Shops You Can't Miss", excerpt: "From rich tonkotsu in Shinjuku to light shoyu in Asakusa — the definitive ramen guide for your Tokyo trip.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=350&fit=crop", author: "Noodle Hunter", authorAvatar: "N", likes: 31, views: 428, url: "#", category: "food", type: "blog" },
  { id: "e7", title: "Santorini Sunset: 4K Travel Cinematic", excerpt: "Experience the magic of Santorini's iconic sunsets, blue domes, and winding streets in stunning 4K cinematic footage.", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&h=350&fit=crop", author: "Travel Films", authorAvatar: "T", likes: 45, views: 1200, url: "#", category: "video", type: "video" },
  { id: "e8", title: "48 Hours in Paris: A Visual Journey", excerpt: "From the Eiffel Tower at dawn to Montmartre at midnight — two days exploring the City of Light.", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=350&fit=crop", author: "Wanderlust TV", authorAvatar: "W", likes: 38, views: 890, url: "#", category: "video", type: "video" },
  { id: "e9", title: "Japanese Countryside by Train: Full Documentary", excerpt: "Take a scenic rail journey through Japan's countryside — from cherry blossom valleys to snow-capped mountains.", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&h=350&fit=crop", author: "Rail Adventures", authorAvatar: "R", likes: 52, views: 1540, url: "#", category: "video", type: "video" },
];

const categories = [
  { key: "all", label: "All" },
  { key: "destination", label: "Popular Destinations" },
  { key: "food", label: "Food & Restaurants" },
  { key: "video", label: "Travel Videos" },
];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all" ? allBlogs : allBlogs.filter((b) => b.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-6xl safe-top safe-bottom">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Explore</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Discover travel blogs, food guides, and cinematic videos from around the world</p>

        {/* Category tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((blog, i) => (
            <motion.a
              key={blog.id}
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {blog.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-foreground ml-1" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button className="bg-card/80 backdrop-blur text-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 hover:bg-card transition-colors shadow-sm">
                    <Share className="w-3 h-3" /> Share
                  </button>
                  <button className="bg-card/80 backdrop-blur text-foreground w-7 h-7 rounded-full flex items-center justify-center hover:bg-card transition-colors shadow-sm">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-card/80 backdrop-blur px-2 py-0.5 rounded-full text-foreground capitalize">{blog.category === "food" ? "Food & Dining" : blog.category === "video" ? "Video" : "Destination"}</span>
              </div>
              <div className="p-4">
                <h4 className="font-display font-bold text-foreground text-sm leading-tight mb-1.5 line-clamp-2">{blog.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{blog.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground text-[10px] font-bold">{blog.authorAvatar}</div>
                    <span className="text-xs font-medium text-foreground">{blog.author}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {blog.likes}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {blog.views}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
