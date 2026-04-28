const fs = require('fs');
const path = require('path');

function sortObject(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortObject);
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
    }, {});
}

async function compare() {
    const blogsDir = '/Users/Peeyush/Documents/Programming Prep/compass-journey-app/backend/scripts/blogs';
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.json'));
    
    console.log(`Found ${files.length} local JSON files.`);
    
    const localBlogs = [];
    for (const file of files) {
        const localPath = path.join(blogsDir, file);
        const data = JSON.parse(fs.readFileSync(localPath, 'utf8'));
        if (Array.isArray(data)) {
            data.forEach(blog => localBlogs.push({ data: blog, file }));
        } else {
            localBlogs.push({ data, file });
        }
    }

    console.log(`Checking ${localBlogs.length} total blog entries...`);
    
    const results = [];

    for (const { data: localData, file } of localBlogs) {
        const slug = localData.slug;

        try {
            const response = await fetch(`http://localhost:10000/api/blogs/${slug}`);
            if (!response.ok) {
                results.push({
                    file,
                    slug,
                    status: 'MISSING or ERROR',
                    error: `${response.status} ${response.statusText}`
                });
                continue;
            }

            const remoteData = await response.json();
            
            // Apply same transformations as push-blog.js to localData
            let localContent = localData.content;
            if (!localContent) {
                let constructedContent = "";
                if (localData.introduction) constructedContent += localData.introduction;
                if (Array.isArray(localData.sections)) {
                    localData.sections.forEach(section => {
                        if (section.heading) constructedContent += `<h2>${section.heading}</h2>`;
                        if (section.content) constructedContent += section.content;
                        if (section.image) constructedContent += `<img src="${section.image}?w=1200" style="width:100%;border-radius:12px;margin:20px 0;"/>`;
                    });
                }
                if (localData.practical_info) {
                    constructedContent += "<h2>Practical Information</h2><ul>";
                    if (localData.practical_info.budget) constructedContent += `<li><strong>Budget:</strong> ${localData.practical_info.budget}</li>`;
                    if (localData.practical_info.best_time) constructedContent += `<li><strong>Best Time:</strong> ${localData.practical_info.best_time}</li>`;
                    if (localData.practical_info.transport) constructedContent += `<li><strong>Transport:</strong> ${localData.practical_info.transport}</li>`;
                    if (Array.isArray(localData.practical_info.tips)) {
                        constructedContent += `<li><strong>Tips:</strong> ${localData.practical_info.tips.join(", ")}</li>`;
                    }
                    constructedContent += "</ul>";
                }
                if (Array.isArray(localData.faqs)) {
                    constructedContent += "<h2>Frequently Asked Questions</h2>";
                    localData.faqs.forEach(faq => {
                        constructedContent += `<p><strong>Q: ${faq.question}</strong><br/>A: ${faq.answer}</p>`;
                    });
                }
                localContent = constructedContent;
            }

            const localPayload = {
                title: String(localData.title).trim(),
                excerpt: localData.excerpt || (localData.introduction ? localData.introduction.replace(/<[^>]*>/g, '').slice(0, 160) + "..." : null),
                content: localContent, // We won't compare exact HTML strings due to sanitization differences
                slug: localData.slug,
                category: localData.category || "travel",
                type: localData.type || "blog",
                author: localData.author || "GlobeGenie Team",
                primary_keyword: localData.primary_keyword || null,
                secondary_keywords: Array.isArray(localData.secondary_keywords) ? localData.secondary_keywords : (localData.seo?.keywords || []),
                images: Array.isArray(localData.images) ? localData.images : [],
                seo: localData.seo || {},
                seo_cluster: localData.seo_cluster || {},
                distribution_strategy: localData.distribution_strategy || {}
            };

            const fieldsToCheck = [
                'title', 'slug', 'category', 'type', 'author', 
                'primary_keyword', 'secondary_keywords', 'seo'
            ];

            const mismatches = [];
            for (const field of fieldsToCheck) {
                const l = sortObject(localPayload[field]);
                const r = sortObject(remoteData[field]);

                // Simple deep compare for objects/arrays
                if (JSON.stringify(l) !== JSON.stringify(r)) {
                    // Special case for SEO keywords vs secondary_keywords
                    if (field === 'secondary_keywords' && Array.isArray(l) && Array.isArray(r)) {
                        if (l.length === r.length && l.every(v => r.includes(v))) continue;
                    }
                    mismatches.push(field);
                }
            }

            results.push({
                file,
                title: localData.title,
                slug,
                status: mismatches.length === 0 ? 'MATCH' : 'MISMATCH',
                mismatchedFields: mismatches
            });

        } catch (err) {
            results.push({
                file,
                slug,
                status: 'FETCH ERROR',
                error: err.message
            });
        }
    }

    console.log('\n--- Comparison Report ---');
    console.table(results.map(r => ({
        'File': r.file,
        'Slug': r.slug,
        'Status': r.status,
        'Mismatched Fields': r.mismatchedFields ? r.mismatchedFields.join(', ') : 'None',
        'Error': r.error || 'N/A'
    })));
}

compare();
