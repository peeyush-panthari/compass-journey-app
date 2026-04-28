const fs = require('fs');
const path = require('path');

async function compare() {
    const blogsDir = '/Users/Peeyush/Documents/Programming Prep/compass-journey-app/backend/scripts/blogs';
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.json'));
    
    console.log(`Found ${files.length} local JSON files.`);
    
    const results = [];

    for (const file of files) {
        const localPath = path.join(blogsDir, file);
        const localData = JSON.parse(fs.readFileSync(localPath, 'utf8'));
        const slug = localData.slug;

        try {
            const response = await fetch(`http://localhost:10000/api/blogs/${slug}`);
            if (!response.ok) {
                results.push({
                    file,
                    slug,
                    status: 'MISSING or ERROR',
                    error: response.statusText
                });
                continue;
            }

            const remoteData = await response.json();
            
            // Fields to check
            const fieldsToCheck = [
                'title', 'excerpt', 'content', 'slug', 'category', 'type', 
                'author', 'primary_keyword', 'secondary_keywords', 'images', 
                'seo', 'seo_cluster', 'distribution_strategy'
            ];

            const mismatches = [];
            for (const field of fieldsToCheck) {
                // Handle optional fields in JSON that might be null/missing in DB
                const localValRaw = localData[field];
                const remoteValRaw = remoteData[field];

                const localVal = JSON.stringify(localValRaw || null);
                const remoteVal = JSON.stringify(remoteValRaw || null);

                if (localVal !== remoteVal) {
                    // For content, allow some escaping differences but check substance
                    if (field === 'content') {
                        if (!remoteValRaw || remoteValRaw.length < 100) {
                            mismatches.push(field);
                        }
                    } else {
                        mismatches.push(field);
                    }
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
        File: r.file,
        Slug: r.slug,
        Status: r.status,
        Mismatches: r.mismatchedFields?.join(', ') || 'None'
    })));
}

compare();
