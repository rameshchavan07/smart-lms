const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        callback(fullPath);
      }
    }
  }
}

const pagesDir = path.join(__dirname, 'src', 'pages');

let count = 0;

const replacements = [
  // Backgrounds
  [/bg-white dark:bg-slate-800/g, 'bg-surface'],
  [/bg-white dark:bg-slate-900\/50/g, 'bg-surface'],
  [/bg-slate-50 dark:bg-slate-900\/50/g, 'bg-bg-subtle'],
  [/bg-slate-50 dark:bg-slate-900/g, 'bg-bg'],
  [/bg-slate-100 dark:bg-slate-800/g, 'bg-bg-subtle'],
  [/bg-slate-50/g, 'bg-bg-subtle'],
  [/bg-white/g, 'bg-surface'],
  [/bg-slate-100/g, 'bg-bg-subtle'],
  
  // Custom message backgrounds
  [/bg-\[\#f0f2f5\] dark:bg-\[\#202c33\]/g, 'bg-bg-subtle'],
  [/bg-\[\#efeae2\] dark:bg-\[\#0b141a\]/g, 'bg-bg'],
  [/bg-\[\#ffeecd\] dark:bg-\[\#182229\]/g, 'bg-surface-raised'],
  [/bg-white dark:bg-\[\#202c33\]/g, 'bg-surface'],

  // Hover Backgrounds
  [/hover:bg-slate-50 dark:hover:bg-slate-700\/50/g, 'hover:bg-bg-subtle'],
  [/hover:bg-slate-100 dark:hover:bg-slate-800/g, 'hover:bg-bg-subtle'],
  [/hover:bg-slate-50/g, 'hover:bg-bg-subtle'],
  [/hover:bg-slate-100/g, 'hover:bg-bg-subtle'],

  // Text Colors
  [/text-slate-900 dark:text-white/g, 'text-primary'],
  [/text-slate-900 dark:text-slate-100/g, 'text-primary'],
  [/text-slate-900/g, 'text-primary'],
  
  [/text-slate-800 dark:text-slate-200/g, 'text-primary'],
  [/text-slate-800/g, 'text-primary'],

  [/text-slate-700 dark:text-slate-300/g, 'text-secondary'],
  [/text-slate-700 dark:text-slate-200/g, 'text-secondary'],
  [/text-slate-700/g, 'text-secondary'],

  [/text-slate-600 dark:text-slate-300/g, 'text-secondary'],
  [/text-slate-600 dark:text-slate-400/g, 'text-secondary'],
  [/text-slate-600/g, 'text-secondary'],

  [/text-slate-500 dark:text-slate-400/g, 'text-muted'],
  [/text-slate-500/g, 'text-muted'],

  [/text-slate-400 dark:text-slate-500/g, 'text-muted'],
  [/text-slate-400/g, 'text-muted'],

  // Custom text colors
  [/text-\[\#111b21\] dark:text-\[\#e9edef\]/g, 'text-primary'],
  [/text-\[\#54656f\] dark:text-\[\#aebac1\]/g, 'text-secondary'],

  // Borders
  [/border-slate-200 dark:border-slate-700/g, 'border-border'],
  [/border-slate-200/g, 'border-border'],
  
  [/border-slate-300 dark:border-slate-600/g, 'border-border-strong'],
  [/border-slate-300/g, 'border-border-strong'],
  
  [/border-slate-100 dark:border-slate-700/g, 'border-border'],
  [/border-slate-100/g, 'border-border'],
  
  // Custom fix for some overlaps
  [/bg-surface dark:bg-\[\#080d18\]/g, 'bg-surface'],
  [/text-primary dark:text-slate-100/g, 'text-primary'],
];

walk(pagesDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${path.relative(__dirname, filePath)}`);
    count++;
  }
});

console.log(`Finished refactoring colors in ${count} files.`);
