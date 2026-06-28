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

const pagesDir = path.join(__dirname, 'src');

let count = 0;

walk(pagesDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Backgrounds
  newContent = newContent.replace(/bg-slate-50 dark:bg-slate-900\/50/g, 'bg-bg-subtle');
  newContent = newContent.replace(/bg-slate-50 dark:bg-slate-900/g, 'bg-bg');
  newContent = newContent.replace(/bg-white dark:bg-slate-800/g, 'bg-surface');
  newContent = newContent.replace(/bg-white dark:bg-slate-900\/50/g, 'bg-surface');
  newContent = newContent.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-bg-subtle');
  
  // Hover Backgrounds
  newContent = newContent.replace(/hover:bg-slate-50 dark:hover:bg-slate-700\/50/g, 'hover:bg-bg-subtle');
  newContent = newContent.replace(/hover:bg-slate-100 dark:hover:bg-slate-800/g, 'hover:bg-bg-subtle');

  // Text Colors
  newContent = newContent.replace(/text-slate-900 dark:text-white/g, 'text-primary');
  newContent = newContent.replace(/text-slate-800 dark:text-slate-200/g, 'text-primary');
  newContent = newContent.replace(/text-slate-700 dark:text-slate-300/g, 'text-secondary');
  newContent = newContent.replace(/text-slate-700 dark:text-slate-200/g, 'text-secondary');
  newContent = newContent.replace(/text-slate-600 dark:text-slate-300/g, 'text-secondary');
  newContent = newContent.replace(/text-slate-500 dark:text-slate-400/g, 'text-muted');
  newContent = newContent.replace(/text-slate-400 dark:text-slate-500/g, 'text-muted');

  // Borders
  newContent = newContent.replace(/border-slate-200 dark:border-slate-700/g, 'border-border');
  newContent = newContent.replace(/border-slate-300 dark:border-slate-600/g, 'border-border-strong');
  newContent = newContent.replace(/border-slate-100 dark:border-slate-700/g, 'border-border');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${path.relative(__dirname, filePath)}`);
    count++;
  }
});

console.log(`Finished refactoring colors in ${count} files.`);
