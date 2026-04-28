import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Heart, Share2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchBlogBySlugOrId, toggleBlogLike, type BlogPost as BlogPostType } from "@/lib/blogs";

const BlogPost = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blog, setBlog] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!slugOrId) return;

    const loadBlog = async () => {
      setLoading(true);
      try {
        const data = await fetchBlogBySlugOrId(slugOrId);
        setBlog(data);
      } catch (error: any) {
        toast({
          title: "Unable to load blog",
          description: error.message,
          variant: "destructive",
        });
        navigate("/explore");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [slugOrId, navigate, toast]);

  const publishedDate = useMemo(() => {
    if (!blog?.created_at) return null;
    return new Date(blog.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [blog?.created_at]);

  const handleLike = async () => {
    if (!blog || liking) return;

    setLiking(true);
    try {
      const result = await toggleBlogLike(blog.id);
      setBlog((current) =>
        current
          ? {
              ...current,
              likes: Math.max(0, current.likes + (result.liked ? 1 : -1)),
            }
          : current
      );
    } catch (error: any) {
      toast({
        title: "Unable to update like",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (!blog) return;
    const url = window.location.href;

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
      <div className="container mx-auto max-w-4xl px-4 pb-24 pt-18 safe-top safe-bottom sm:pt-24 md:pb-16">
        <div className="mb-6">
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="h-72 animate-pulse bg-muted" />
            <div className="space-y-4 p-6">
              <div className="h-8 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : blog ? (
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {blog.image && (
              <div className="h-72 overflow-hidden bg-muted sm:h-96">
                <img src={blog.image} alt={blog.title} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold capitalize text-primary">
                  {blog.category}
                </span>
                {publishedDate && <span>{publishedDate}</span>}
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {blog.views}
                </span>
              </div>

              <h1 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                {blog.title}
              </h1>
              {blog.excerpt && <p className="mb-6 text-base text-muted-foreground">{blog.excerpt}</p>}

              <div className="mb-8 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-gradient font-bold text-primary-foreground">
                    {(blog.author_avatar || blog.author || "G").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{blog.author || "GlobeGenie Team"}</p>
                    <p className="text-xs text-muted-foreground">Travel editorial</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={liking}
                    onClick={handleLike}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    {blog.likes}
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {blog.video_url && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-border">
                  <div className="aspect-video">
                    <iframe
                      src={blog.video_url}
                      title={blog.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div
                className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground sm:prose-base"
                dangerouslySetInnerHTML={{ __html: blog.content || "<p>Content coming soon.</p>" }}
              />
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
};

export default BlogPost;
