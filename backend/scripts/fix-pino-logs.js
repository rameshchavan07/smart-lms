const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Fix logger.log -> logger.info
      if (content.includes('logger.log(')) {
        content = content.replace(/logger\.log\(/g, 'logger.info(');
        changed = true;
      }

      // Fix logger.error('msg', err) -> logger.error({ err }, 'msg')
      // This is a naive regex, but we will catch the common ones.
      // E.g., logger.error('Failed to generate Jitsi token', error);
      const errorRegex = /logger\.error\((['`"].*?['`"]),\s*([^)]+)\)/g;
      if (errorRegex.test(content)) {
        content = content.replace(errorRegex, (match, msg, errVar) => {
           return `logger.error({ err: ${errVar} }, ${msg})`;
        });
        changed = true;
      }

      const warnRegex = /logger\.warn\((['`"].*?['`"]),\s*([^)]+)\)/g;
      if (warnRegex.test(content)) {
        content = content.replace(warnRegex, (match, msg, errVar) => {
           return `logger.warn({ err: ${errVar} }, ${msg})`;
        });
        changed = true;
      }
      
      const infoRegex = /logger\.info\((['`"].*?['`"]),\s*([^)]+)\)/g;
      if (infoRegex.test(content)) {
        content = content.replace(infoRegex, (match, msg, errVar) => {
           return `logger.info({ data: ${errVar} }, ${msg})`;
        });
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed logs in ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Finished fixing Pino logs.');
