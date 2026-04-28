Code-only blog publishing

Use this flow to create or update Explore blogs without exposing any admin screen on the live website.

1. Create a JSON file based on [blog.sample.json](/Users/Peeyush/Documents/Programming%20Prep/compass-journey-app/backend/scripts/blog.sample.json) inside the `blogs/` folder.
2. Run:

```bash
cd backend
npm run push-blog -- blogs/your-blog-file.json
```

Notes:
- Include `id` in the JSON to update an existing blog.
- Omit `id` to create a new blog.
- `content` should be HTML. The script sanitizes it before saving.
- `published: true` makes the blog appear on `/explore`.
