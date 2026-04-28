const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const sanitizeHtml = require("sanitize-html");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sanitizeConfig = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "strong", "em", "u", "s", "blockquote", "code", "pre",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span", "figure", "figcaption",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title"],
    div: ["class", "id", "style"],
    span: ["class", "style"],
    p: ["class"],
    h1: ["id"],
    h2: ["id"],
    h3: ["id"],
    table: ["class"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    blockquote: ["cite"],
  },
  allowedIframeHostnames: ["www.youtube.com", "player.vimeo.com", "maps.google.com"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.href && attribs.href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {}),
      },
    }),
  },
};

function printUsage() {
  console.log("Usage:");
  console.log("  npm run push-blog -- <path-to-blog.json>");
  console.log("");
  console.log("JSON fields:");
  console.log("  id? title excerpt? content image? author? author_avatar? category type? video_url? published?");
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    printUsage();
    process.exit(1);
  }

  // 1. Resolve file path: check direct path first, then check inside scripts/blogs/
  let filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    const fallbackPath = path.resolve(__dirname, "blogs", fileArg);
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      throw new Error(`Blog file not found at ${filePath} or ${fallbackPath}`);
    }
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const input = JSON.parse(raw);

  // 2. Handle structured content if the legacy "content" field is missing
  let content = input.content;
  if (!content) {
    let constructedContent = "";
    
    if (input.introduction) {
      constructedContent += input.introduction;
    }

    if (Array.isArray(input.sections)) {
      input.sections.forEach(section => {
        if (section.heading) constructedContent += `<h2>${section.heading}</h2>`;
        if (section.content) constructedContent += section.content;
        if (section.image) constructedContent += `<img src="${section.image}?w=1200" style="width:100%;border-radius:12px;margin:20px 0;"/>`;
      });
    }

    if (input.practical_info) {
      constructedContent += "<h2>Practical Information</h2><ul>";
      if (input.practical_info.budget) constructedContent += `<li><strong>Budget:</strong> ${input.practical_info.budget}</li>`;
      if (input.practical_info.best_time) constructedContent += `<li><strong>Best Time:</strong> ${input.practical_info.best_time}</li>`;
      if (input.practical_info.transport) constructedContent += `<li><strong>Transport:</strong> ${input.practical_info.transport}</li>`;
      if (Array.isArray(input.practical_info.tips)) {
        constructedContent += `<li><strong>Tips:</strong> ${input.practical_info.tips.join(", ")}</li>`;
      }
      constructedContent += "</ul>";
    }

    if (Array.isArray(input.faqs)) {
      constructedContent += "<h2>Frequently Asked Questions</h2>";
      input.faqs.forEach(faq => {
        constructedContent += `<p><strong>Q: ${faq.question}</strong><br/>A: ${faq.answer}</p>`;
      });
    }

    content = constructedContent;
  }

  // 3. Fallback for excerpt from introduction if missing
  const excerpt = input.excerpt || (input.introduction ? sanitizeHtml(input.introduction, { allowedTags: [], allowedAttributes: {} }).slice(0, 160) + "..." : null);

  const payload = {
    title: String(input.title).trim(),
    excerpt: excerpt,
    content: sanitizeHtml(String(content), sanitizeConfig),
    image: input.image || (Array.isArray(input.images) ? input.images[0] : null),
    author: input.author ? String(input.author).trim() : "GlobeGenie Team",
    author_avatar: input.author_avatar || null,
    category: input.category || "travel",
    type: input.type || "blog",
    video_url: input.video_url || null,
    published: input.published !== undefined ? Boolean(input.published) : true,
    // Enhanced Schema Fields
    slug: input.slug?.trim() || null,
    primary_keyword: input.primary_keyword?.trim() || null,
    secondary_keywords: Array.isArray(input.secondary_keywords) ? input.secondary_keywords : (input.seo?.keywords || []),
    seo: input.seo || {},
    images: Array.isArray(input.images) ? input.images : [],
    seo_cluster: input.seo_cluster || {},
    distribution_strategy: input.distribution_strategy || {},
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("explore_content")
      .update(payload)
      .eq("id", input.id)
      .select("id, title, published, updated_at")
      .single();

    if (error) throw error;

    console.log(JSON.stringify({ action: "updated", blog: data }, null, 2));
    return;
  }

  // Use upsert if slug is provided to avoid duplicate key errors
  const { data, error } = await supabase
    .from("explore_content")
    .upsert(payload, { onConflict: "slug" })
    .select("id, title, published, created_at")
    .single();

  if (error) throw error;

  console.log(JSON.stringify({ action: "pushed (upserted)", blog: data }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
