const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'controllers', 'instituteController.ts');
let content = fs.readFileSync(filePath, 'utf8');

const invalidateStmt = `  await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);\n`;

// Helper to inject before a specific res.json line in a specific function
const injectBefore = (funcName, searchString) => {
  const funcIndex = content.indexOf(`export const ${funcName} =`);
  if (funcIndex === -1) {
    console.log(`Function ${funcName} not found`);
    return;
  }
  
  const searchIndex = content.indexOf(searchString, funcIndex);
  if (searchIndex === -1) {
    console.log(`Search string not found in ${funcName}`);
    return;
  }

  // Check if we already injected it
  const textBefore = content.substring(searchIndex - 100, searchIndex);
  if (textBefore.includes('invalidateCacheByPattern')) {
    console.log(`Already injected in ${funcName}`);
    return;
  }

  content = content.substring(0, searchIndex) + invalidateStmt + content.substring(searchIndex);
};

injectBefore('createInstitute', "res.status(201).json");
injectBefore('updateInstitute', "res.json({ message: 'Institute updated successfully'");
injectBefore('approveInstitute', "res.json({ message: 'Institute approved successfully'");
injectBefore('rejectInstitute', "res.json({ message: 'Institute rejected'");
injectBefore('suspendInstitute', "res.json({ message: 'Institute suspended'");
injectBefore('reactivateInstitute', "res.json({ message: 'Institute reactivated successfully'");
injectBefore('deleteInstitute', "res.json({ message: 'Institute and all associated data deleted");
injectBefore('updateMyInstituteSettings', "res.json({ institute });");
injectBefore('uploadMyInstituteLogo', "res.json({ logoUrl, message: 'Logo updated successfully'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
