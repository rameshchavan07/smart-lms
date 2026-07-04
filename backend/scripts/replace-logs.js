const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const loggerPath = path.join(srcDir, 'utils', 'logger.ts');

function getRelativeLoggerPath(filePath) {
  const fileDir = path.dirname(filePath);
  let relPath = path.relative(fileDir, loggerPath).replace(/\\/g, '/');
  if (!relPath.startsWith('.')) {
    relPath = './' + relPath;
  }
  // Remove .ts extension
  if (relPath.endsWith('.ts')) {
    relPath = relPath.slice(0, -3);
  }
  return relPath;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') && fullPath !== loggerPath) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const hasConsole = /console\.(log|warn|error|info)/.test(content);
      if (hasConsole) {
        // Replace console.* with logger.*
        content = content.replace(/console\.(log|warn|error|info)/g, 'logger.$1');
        
        // Add import statement if not exists
        if (!content.includes('import logger from')) {
          const relPath = getRelativeLoggerPath(fullPath);
          const importStmt = `import logger from '${relPath}';\n`;
          content = importStmt + content;
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Finished replacing console logs.');
