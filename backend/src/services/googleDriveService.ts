import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Define the scope for Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// We wrap initialization in a function so it doesn't crash the server if credentials.json is missing initially
let driveService: any = null;

const initializeDriveService = () => {
  if (driveService) return driveService;
  
  const credentialsPath = path.join(process.cwd(), 'credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.warn('Google Drive credentials.json not found! File uploads to Drive will fail.');
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });

    driveService = google.drive({ version: 'v3', auth });
    return driveService;
  } catch (error) {
    console.error('Failed to initialize Google Drive API:', error);
    return null;
  }
};

/**
 * Uploads a file to Google Drive
 * @param filePath Path to the temporary file
 * @param fileName Original name of the file
 * @param mimeType MIME type of the file
 * @returns Object containing fileId and webViewLink
 */
export const uploadFileToDrive = async (filePath: string, fileName: string, mimeType: string) => {
  const drive = initializeDriveService();
  
  if (!drive) {
    throw new Error('Google Drive API is not configured. Missing credentials.json.');
  }

  // Use the folder ID from env if provided, otherwise upload to root
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const parents = folderId ? [folderId] : [];

  const fileMetadata = {
    name: fileName,
    parents,
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    // Make the file publicly accessible to anyone with the link
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get the updated file with webContentLink (direct download link) and webViewLink
    const result = await drive.files.get({
      fileId: file.data.id,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      fileId: result.data.id,
      webViewLink: result.data.webViewLink,
      webContentLink: result.data.webContentLink,
    };
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
};

/**
 * Deletes a file from Google Drive
 * @param fileId The ID of the file in Google Drive
 */
export const deleteFileFromDrive = async (fileId: string) => {
  const drive = initializeDriveService();
  if (!drive) return;

  try {
    await drive.files.delete({ fileId });
  } catch (error) {
    console.error('Error deleting file from Drive:', error);
  }
};
