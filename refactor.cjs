const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk(directoryToSearch);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace Dashboard specific classes to Design System
    content = content.replace(/className="glass-card /g, 'className="ds-card ds-card--glass ');
    content = content.replace(/className="glass-card"/g, 'className="ds-card ds-card--glass"');
    content = content.replace(/className=\{"glass-card /g, 'className={"ds-card ds-card--glass ');
    content = content.replace(/className=\{"glass-card"/g, 'className={"ds-card ds-card--glass"');
    
    // Replace pill-button with ds-btn
    content = content.replace(/pill-button/g, 'ds-btn ds-btn--sm ds-btn--outline');
    
    // Replace some text colors
    content = content.replace(/text-muted/g, 'ds-text-muted');
    content = content.replace(/text-success/g, 'ds-text-success');
    content = content.replace(/bg-success/g, 'ds-badge--success'); // bg-success is often used with tags

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

console.log('Refactoring complete.');
