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

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Blog file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const input = JSON.parse(raw);

  if (!input.title || !input.content || !input.category) {
    throw new Error("title, content, and category are required");
  }

  const payload = {
    title: String(input.title).trim(),
    excerpt: input.excerpt ? String(input.excerpt).trim() : null,
    content: sanitizeHtml(String(input.content), sanitizeConfig),
    image: input.image || null,
    author: input.author ? String(input.author).trim() : "GlobeGenie Team",
    author_avatar: input.author_avatar || null,
    category: input.category,
    type: input.type || "blog",
    video_url: input.video_url || null,
    published: Boolean(input.published),
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

  const { data, error } = await supabase
    .from("explore_content")
    .insert(payload)
    .select("id, title, published, created_at")
    .single();

  if (error) throw error;

  console.log(JSON.stringify({ action: "created", blog: data }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
