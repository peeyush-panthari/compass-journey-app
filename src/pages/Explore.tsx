import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Globe, Heart, Share2 } from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { fetchPublishedBlogs, type BlogSummary } from "@/lib/blogs";

const categories = [
  { key: "all", label: "All" },
  { key: "travel", label: "Travel Guides" },
  { key: "destination", label: "Popular Destinations" },
  { key: "food", label: "Food & Restaurants" },
  { key: "video", label: "Travel Videos" },
];

const Explore = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const data = await fetchPublishedBlogs(activeCategory);
        setBlogs(data);
      } catch (error: any) {
        toast({
          title: "Unable to load blogs",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, [activeCategory, toast]);

  const description = useMemo(
    () => "Discover travel blogs, food guides, and cinematic videos from around the world",
    []
  );

  const shareBlog = async (blog: BlogSummary) => {
    const url = `${window.location.origin}/explore/${blog.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, text: blog.excerpt || blog.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Blog link copied" });
      }
    } catch {
      // share cancelled
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-4 pb-24 pt-18 safe-top safe-bottom sm:pt-24 md:pb-16">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Explore</h1>
        </div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="h-48 shrink-0 animate-pulse bg-muted" />
                <div className="flex flex-1 flex-col space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="flex-1 h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-elevated"
              >
                {/* Entire Card Link */}
                <Link 
                  to={`/explore/${blog.slug || blog.id}`} 
                  className="absolute inset-0 z-10"
                  aria-label={`Read ${blog.title}`}
                />

                <div className="relative h-48 shrink-0 overflow-hidden bg-muted">
                  {(blog.image || (blog.images && blog.images[0])) ? (
                    <img
                      src={blog.image || blog.images[0]}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      Cover image coming soon
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 z-20 rounded-full bg-card/85 px-2 py-0.5 text-[10px] font-medium capitalize text-foreground backdrop-blur">
                    {blog.category === "food"
                      ? "Food & Dining"
                      : blog.category === "video"
                        ? "Video"
                        : blog.category === "travel"
                          ? "Travel Guide"
                          : "Destination"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 font-display text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                      {blog.title}
                    </h2>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        shareBlog(blog);
                      }}
                      className="relative z-30 rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={`Share ${blog.title}`}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">
                    {blog.excerpt || "Open the article to read the full story."}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean-gradient text-[10px] font-bold text-primary-foreground">
                        {(blog.author_avatar || blog.author || "G").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {blog.author || "GlobeGenie Team"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {blog.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {blog.views}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">No blogs published yet for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
