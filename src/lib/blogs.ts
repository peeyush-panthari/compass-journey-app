import { getBackendUrl } from "@/lib/backendUrl";
import { supabase } from "@/lib/supabaseClient";

export type BlogCategory = "destination" | "food" | "video" | "travel";
export type BlogType = "blog" | "video";

export interface BlogSummary {
  id: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  author: string | null;
  author_avatar: string | null;
  category: BlogCategory;
  type: BlogType;
  likes: number;
  views: number;
  created_at: string;
  slug: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[];
  images: string[];
}

export interface BlogPost extends BlogSummary {
  content: string | null;
  video_url: string | null;
  published: boolean;
  updated_at?: string | null;
  seo: {
    meta_title?: string;
    meta_description?: string;
    schema_type?: string;
  };
  seo_cluster: {
    pillar?: string;
    cluster_topics?: string[];
  };
  distribution_strategy: {
    channels?: string[];
    content_hooks?: string[];
  };
}

export interface BlogPayload {
  title: string;
  excerpt?: string;
  content: string;
  image?: string;
  author?: string;
  author_avatar?: string;
  category: BlogCategory;
  type?: BlogType;
  video_url?: string;
  published?: boolean;
  slug?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  seo?: BlogPost["seo"];
  images?: string[];
  seo_cluster?: BlogPost["seo_cluster"];
  distribution_strategy?: BlogPost["distribution_strategy"];
}

export async function fetchPublishedBlogs(category?: string) {
  const params = new URLSearchParams();
  params.set("limit", "30");
  if (category && category !== "all") {
    params.set("category", category);
  }

  const response = await fetch(`${getBackendUrl()}/api/blogs?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to load blogs");
  }

  const payload = await response.json();
  return payload.blogs as BlogSummary[];
}

export async function fetchBlogBySlugOrId(slugOrId: string) {
  const response = await fetch(`${getBackendUrl()}/api/blogs/${slugOrId}`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? "Blog not found" : "Unable to load blog");
  }

  return (await response.json()) as BlogPost;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function fetchWithAuth(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Please sign in to continue");
  }

  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || "Request failed");
  }

  return response;
}

export async function toggleBlogLike(id: string) {
  const response = await fetchWithAuth(`/api/blogs/${id}/like`, { method: "POST" });
  return (await response.json()) as { liked: boolean };
}

export async function fetchAdminBlogs() {
  const response = await fetchWithAuth("/api/blogs/admin/all");
  const payload = await response.json();
  return payload.blogs as BlogPost[];
}

export async function createBlog(payload: BlogPayload) {
  const response = await fetchWithAuth("/api/blogs", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return (await response.json()) as BlogPost;
}

export async function updateBlog(id: string, payload: Partial<BlogPayload>) {
  const response = await fetchWithAuth(`/api/blogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return (await response.json()) as BlogPost;
}

export async function setBlogPublished(id: string, published: boolean) {
  const response = await fetchWithAuth(`/api/blogs/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ published }),
  });

  return (await response.json()) as { message: string; blog: Pick<BlogPost, "id" | "title" | "published"> };
}

export async function deleteBlog(id: string) {
  const response = await fetchWithAuth(`/api/blogs/${id}`, { method: "DELETE" });
  return response.json();
}

export async function uploadBlogImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetchWithAuth("/api/blogs/upload/image", {
    method: "POST",
    body: formData,
  });

  return (await response.json()) as { url: string; path: string };
}
