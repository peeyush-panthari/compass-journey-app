const fs = require('fs');
const path = require('path');

const blogsDir = path.resolve(__dirname, 'blogs');
const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const filePath = path.join(blogsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove trailing backslashes from lines and join them
    // This is a common pattern in the user's provided JSON to represent multi-line strings
    content = content.replace(/\\\s*\n\s*/g, '');
    
    try {
        const json = JSON.parse(content);
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
        console.log(`Fixed ${file}`);
    } catch (e) {
        console.error(`Failed to parse ${file}: ${e.message}`);
    }
});
