// backend/routes/blogs.js
// GlobeGenie Blog CMS — Backend Routes
// Supports: create, read, update, delete, publish/unpublish HTML blogs
// All write operations require admin role

const express = require('express');
const path = require('path');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// ─── Supabase Admin Client (service_role for admin ops) ───────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Multer: cover image uploads ──────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    },
});

// ─── Auth Middleware: verify Supabase JWT ──────────────────────────────────────
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
}

// ─── Admin Middleware: check user_roles table ─────────────────────────────────
async function requireAdmin(req, res, next) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('role', 'admin')
        .single();

    if (error || !data) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

// ─── HTML Sanitizer Config ─────────────────────────────────────────────────────
const sanitizeConfig = {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'figure', 'figcaption',
        'iframe', // for embedded YouTube/videos — restricted below
    ],
    allowedAttributes: {
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
        'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title'],
        'div': ['class', 'id', 'style'],
        'span': ['class', 'style'],
        'p': ['class'],
        'h1': ['id'], 'h2': ['id'], 'h3': ['id'],
        'table': ['class'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan'],
        'blockquote': ['cite'],
    },
    allowedIframeHostnames: [
        'www.youtube.com',
        'player.vimeo.com',
        'maps.google.com',
    ],
    // Force external links to open safely
    transformTags: {
        'a': (tagName, attribs) => ({
            tagName,
            attribs: {
                ...attribs,
                ...(attribs.href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
            },
        }),
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth required)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/blogs — List published blogs (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category; // destination | food | video
        const offset = (page - 1) * limit;

        let query = supabase
            .from('explore_content')
            .select('id, title, excerpt, image, author, author_avatar, category, type, likes, views, created_at', { count: 'exact' })
            .eq('published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            blogs: data,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (auth + admin role required)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/blogs/admin/all — List ALL blogs including drafts (admin only)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('explore_content')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            blogs: data,
            pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blogs/:id — Get single blog (increments view count)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('explore_content')
            .select('*')
            .eq('id', id)
            .eq('published', true)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Increment view count (fire-and-forget)
        supabase.rpc('increment_blog_views', { blog_id: id }).catch(() => { });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blogs/:id/like — Toggle like on a blog (requires auth)
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already liked
        const { data: existing } = await supabase
            .from('content_likes')
            .select('user_id')
            .eq('user_id', userId)
            .eq('content_id', id)
            .single();

        if (existing) {
            // Unlike
            await supabase
                .from('content_likes')
                .delete()
                .eq('user_id', userId)
                .eq('content_id', id);

            await supabase.rpc('decrement_blog_likes', { blog_id: id });
            return res.json({ liked: false });
        }

        // Like
        await supabase.from('content_likes').insert({ user_id: userId, content_id: id });
        await supabase.rpc('increment_blog_likes', { blog_id: id });
        return res.json({ liked: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blogs — Create new blog (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            excerpt,
            content,     // HTML string
            image,       // URL (or uploaded separately via /upload)
            author,
            author_avatar,
            category,    // destination | food | video | travel
            type,        // blog | video
            video_url,
            published,
            slug,
            primary_keyword,
            secondary_keywords,
            seo,
            images,
            seo_cluster,
            distribution_strategy,
        } = req.body;

        // Validate required fields
        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content?.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        if (!['destination', 'food', 'video', 'travel'].includes(category)) {
            return res.status(400).json({ error: 'Category must be destination, food, video, or travel' });
        }

        // Sanitize HTML content to prevent XSS
        const sanitizedContent = sanitizeHtml(content, sanitizeConfig);

        const { data, error } = await supabase
            .from('explore_content')
            .insert({
                title: title.trim(),
                excerpt: excerpt?.trim() || null,
                content: sanitizedContent,
                image: image || null,
                author: author?.trim() || 'GlobeGenie Team',
                author_avatar: author_avatar || null,
                category,
                type: type || 'blog',
                video_url: video_url || null,
                published: published === true,
                likes: 0,
                views: 0,
                slug: slug?.trim() || null,
                primary_keyword: primary_keyword?.trim() || null,
                secondary_keywords: Array.isArray(secondary_keywords) ? secondary_keywords : [],
                seo: seo || {},
                images: Array.isArray(images) ? images : [],
                seo_cluster: seo_cluster || {},
                distribution_strategy: distribution_strategy || {},
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/blogs/:id — Update blog (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, excerpt, content, image,
            author, author_avatar, category,
            type, video_url, published,
            slug, primary_keyword, secondary_keywords,
            seo, images, seo_cluster, distribution_strategy,
        } = req.body;

        // Build update object with only provided fields
        const updates = {};
        if (title !== undefined) updates.title = title.trim();
        if (excerpt !== undefined) updates.excerpt = excerpt?.trim() || null;
        if (content !== undefined) updates.content = sanitizeHtml(content, sanitizeConfig);
        if (image !== undefined) updates.image = image;
        if (author !== undefined) updates.author = author.trim();
        if (author_avatar !== undefined) updates.author_avatar = author_avatar;
        if (category !== undefined) updates.category = category;
        if (type !== undefined) updates.type = type;
        if (video_url !== undefined) updates.video_url = video_url;
        if (published !== undefined) updates.published = published;
        if (slug !== undefined) updates.slug = slug?.trim() || null;
        if (primary_keyword !== undefined) updates.primary_keyword = primary_keyword?.trim() || null;
        if (secondary_keywords !== undefined) updates.secondary_keywords = Array.isArray(secondary_keywords) ? secondary_keywords : [];
        if (seo !== undefined) updates.seo = seo || {};
        if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
        if (seo_cluster !== undefined) updates.seo_cluster = seo_cluster || {};
        if (distribution_strategy !== undefined) updates.distribution_strategy = distribution_strategy || {};

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabase
            .from('explore_content')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Blog not found' });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/blogs/:id/publish — Toggle publish status (admin only)
router.patch('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        if (typeof published !== 'boolean') {
            return res.status(400).json({ error: 'published must be true or false' });
        }

        const { data, error } = await supabase
            .from('explore_content')
            .update({ published })
            .eq('id', id)
            .select('id, title, published')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Blog not found' });

        res.json({ message: `Blog ${published ? 'published' : 'unpublished'}`, blog: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/blogs/:id — Delete blog (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Also delete cover image from storage if it's a Supabase storage URL
        const { data: blog } = await supabase
            .from('explore_content')
            .select('image')
            .eq('id', id)
            .single();

        if (blog?.image?.includes('supabase')) {
            const storagePath = blog.image.split('/explore-images/')[1];
            if (storagePath) {
                await supabase.storage.from('explore-images').remove([storagePath]);
            }
        }

        const { error } = await supabase
            .from('explore_content')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blogs/upload/image — Upload cover image (admin only)
router.post('/upload/image', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const fileName = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

        const { data, error } = await supabase.storage
            .from('explore-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('explore-images')
            .getPublicUrl(data.path);

        res.json({ url: publicUrl, path: data.path });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
