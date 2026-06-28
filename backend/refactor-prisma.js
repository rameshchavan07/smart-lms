const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/controllers/assignmentController.ts',
  'src/controllers/discussionController.ts',
  'src/controllers/lectureController.ts',
  'src/controllers/studyMaterialController.ts',
  'src/controllers/quizController.ts',
  'src/controllers/userController.ts',
  'src/controllers/enrollmentController.ts',
  'src/controllers/courseController.ts',
  'src/controllers/analyticsController.ts',
  'src/middleware/auth.ts',
  'src/utils/auditLogger.ts',
  'src/utils/studentUploadHelper.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace import { PrismaClient } from '@prisma/client';
  content = content.replace(/import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"];\n?/g, '');
  
  // Replace const prisma = new PrismaClient(); with the import
  content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);\n?/g, "import prisma from '../config/db';\n");

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
