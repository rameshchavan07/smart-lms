import { getOrCreateFolderId } from '../services/googleDriveService';

import prisma from '../config/db';

interface PathComponent {
  path: string;
  name: string;
}

/**
 * Resolves or creates the Google Drive folder ID for a student's Assignments folder.
 * Path: courses/[courseId]/Students/[studentId]/Assignments
 * 
 * @param courseId The course UUID
 * @param studentUserId The user UUID of the student
 * @returns The Google Drive folder ID of the student's Assignments folder
 */
export const getStudentAssignmentFolderId = async (
  courseId: string,
  studentUserId: string
): Promise<string> => {
  // 1. Fetch student info
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
    include: { user: true },
  });

  if (!student) {
    throw new Error('Student profile not found');
  }

  // 2. Fetch course info
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  const studentName = `${student.user.firstName} ${student.user.lastName}`;
  const studentCode = student.studentCode || student.enrollmentNumber;
  const studentFolderName = `${studentName} - ${studentCode}`;

  // 3. Resolve path components
  const pathComponents: PathComponent[] = [
    { path: `courses/${courseId}`, name: `Course - ${course.title}` },
    { path: `courses/${courseId}/Students`, name: 'Students' },
    { path: `courses/${courseId}/Students/${student.id}`, name: studentFolderName },
    { path: `courses/${courseId}/Students/${student.id}/Assignments`, name: 'Assignments' },
  ];

  // 4. Resolve folder ID
  return getOrCreateFolderId(pathComponents);
};
