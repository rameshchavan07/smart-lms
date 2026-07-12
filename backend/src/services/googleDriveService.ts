import { google, drive_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db';

let driveClient: drive_v3.Drive | null = null;

/**
 * Initialize Google Drive client.
 * Priority:
 *   1. OAuth2 with refresh token (personal account - uses your 5TB storage) ✅
 *   2. Service account with delegation (Google Workspace only)
 *   3. Service account only (Shared Drives only)
 */
const getDriveClient = () => {
  if (driveClient) return driveClient;

  // --- Option 1: OAuth2 with Refresh Token (RECOMMENDED for personal accounts) ---
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      console.log('[GoogleDrive] ✅ Using OAuth2 (personal account - full 5TB storage)');
      return driveClient;
    } catch (err) {
      console.error('[GoogleDrive] OAuth2 init failed:', err instanceof Error ? err.message : String(err));
    }
  }

  // --- Option 2: Service Account ---
  const credentialsPath = path.join(process.cwd(), 'credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.warn('[GoogleDrive] ⚠️  No OAuth2 tokens and no credentials.json found!');
    console.warn('[GoogleDrive]    Run: node getGoogleToken.js to set up OAuth2');
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    driveClient = google.drive({ version: 'v3', auth });
    console.log('[GoogleDrive] Using Service Account (note: requires Shared Drive for uploads)');
    return driveClient;
  } catch (err) {
    console.error('[GoogleDrive] Service Account init failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
};

/**
 * Extracts a human-readable error from Google API errors
 */
const getGoogleErrorMessage = (error: unknown): string => {
  const err = error as any;
  const googleError = err?.response?.data?.error;
  if (googleError) {
    const code = googleError.code || err?.response?.status;
    const message = googleError.message || 'Unknown Google API error';
    const reason = googleError.errors?.[0]?.reason || '';

    if (reason === 'storageQuotaExceeded') {
      return 'Storage quota exceeded. Set up OAuth2 by running: node getGoogleToken.js';
    }
    if (code === 403) return `Permission denied (403): ${message}`;
    if (code === 404) return `Not found (404): Check your GOOGLE_DRIVE_FOLDER_ID in .env`;
    if (code === 401) return `Authentication failed (401): Re-run node getGoogleToken.js`;
    return `Google API [${code}]: ${message}`;
  }
  if (err?.response?.data?.error === 'invalid_grant') {
    return 'Google Drive token expired or revoked. Please run: node getGoogleToken.js';
  }
  if (err?.code === 'ENOENT') return `Temp file not found: ${err.path}`;
  if (err?.errors && err.errors.length > 0) {
    return err.errors[0].message;
  }
  if (err?.message) {
    return err.message;
  }
  return 'Unknown Google Drive error occurred.';
};

interface PathComponent {
  path: string; // e.g. "courses/c1"
  name: string; // e.g. "Course - Math"
}

/**
 * Resolves a hierarchical path (e.g. "courses/c1/Teachers/t1") to a Google Drive folder ID.
 * Automatically creates intermediate folders if they don't exist in Google Drive.
 * Caches folder mappings in the GoogleDriveFolder table to prevent duplicate lookups.
 */
export const getOrCreateFolderId = async (
  pathComponents: PathComponent[]
): Promise<string> => {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive API not configured. Run: node getGoogleToken.js to set up.');
  }

  // Start with the root folder ID from environment
  let parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';

  for (const component of pathComponents) {
    const { path: currentPath, name: folderName } = component;

    // Check database cache first
    let cachedFolder = await prisma.googleDriveFolder.findUnique({
      where: { path: currentPath },
    });

    if (cachedFolder) {
      parentFolderId = cachedFolder.driveFolderId;
      continue;
    }

    // Not cached, create in Google Drive
    console.log(`[GoogleDrive] Folder not found in cache for path "${currentPath}". Creating in Drive: "${folderName}" under parent "${parentFolderId}"...`);
    
    try {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId !== 'root' ? [parentFolderId] : [],
      };

      const response = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
        supportsAllDrives: true,
      });

      const newFolderId = response.data.id;
      if (!newFolderId) {
        throw new Error(`Failed to retrieve ID of created folder: ${folderName}`);
      }

      // Set public read permission on the folder so inner files can inherit or be accessible
      try {
        await drive.permissions.create({
          fileId: newFolderId,
          supportsAllDrives: true,
          requestBody: { role: 'reader', type: 'anyone' },
        });
      } catch (err) {
        console.warn(`[GoogleDrive] Could not set folder permissions for "${folderName}":`, err instanceof Error ? err.message : String(err));
      }

      // Save to database cache
      cachedFolder = await prisma.googleDriveFolder.create({
        data: {
          driveFolderId: newFolderId,
          path: currentPath,
          folderName,
        },
      });

      parentFolderId = newFolderId;
      console.log(`[GoogleDrive] ✅ Created and cached folder: "${folderName}" (ID: ${newFolderId})`);
    } catch (error) {
      console.error(`[GoogleDrive] ❌ Failed to create folder "${folderName}":`, error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create Google Drive folder "${folderName}": ${getGoogleErrorMessage(error)}`);
    }
  }

  return parentFolderId;
};

/**
 * Uploads a file to Google Drive
 */
export const uploadFileToDrive = async (
  filePath: string,
  fileName: string,
  mimeType: string,
  parentFolderId?: string
) => {
  const drive = getDriveClient();

  if (!drive) {
    throw new Error(
      'Google Drive not configured. Run: node getGoogleToken.js in the backend folder to set up.'
    );
  }

  const folderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const parents = folderId ? [folderId] : [];

  console.log(`[GoogleDrive] Uploading "${fileName}" (${mimeType}) → folder: ${folderId || 'root'}`);

  let fileId: string;

  try {
    const file = await drive.files.create({
      requestBody: { name: fileName, parents },
      media: { mimeType, body: fs.createReadStream(filePath) },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    fileId = file.data.id || '';
    console.log('[GoogleDrive] ✅ Uploaded, File ID:', fileId);
  } catch (error) {
    const errObj = error as any;
    console.error('[GoogleDrive] Full upload error:', JSON.stringify(errObj?.response?.data || errObj?.message || error, null, 2));
    const msg = getGoogleErrorMessage(error);
    console.error('[GoogleDrive] ❌ Upload failed:', msg);
    throw new Error(msg);
  }

  // Set file as publicly readable
  try {
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: { role: 'reader', type: 'anyone' },
    });
    console.log('[GoogleDrive] ✅ File set to public reader');
  } catch (error) {
    console.warn('[GoogleDrive] ⚠️ Could not set public permission:', getGoogleErrorMessage(error));
  }

  // Get final links
  try {
    const result = await drive.files.get({
      fileId,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });
    console.log('[GoogleDrive] ✅ Done. View link:', result.data.webViewLink);
    return {
      fileId: result.data.id,
      webViewLink: result.data.webViewLink,
      webContentLink: result.data.webContentLink,
    };
  } catch {
    // Return fallback links if get() fails
    return {
      fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    };
  }
};

/**
 * Gets a resumable upload URL from Google Drive for direct-to-cloud uploads
 */
export const getResumableUploadUrl = async (
  fileName: string,
  mimeType: string,
  parentFolderId?: string
): Promise<string> => {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive not configured.');
  }

  const folderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const parents = folderId ? [folderId] : [];

  // @ts-ignore - access auth client
  const authClient = await drive.context._options.auth;
  // @ts-ignore
  const token = await authClient.getAccessToken();

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': mimeType
    },
    body: JSON.stringify({
      name: fileName,
      parents: parents
    })
  });

  const location = response.headers.get('Location');
  if (!location) {
    throw new Error('Failed to get resumable upload URL from Google Drive');
  }

  return location;
};

/**
 * Makes a Google Drive file publicly accessible and returns its links
 */
export const makeFilePublic = async (fileId: string) => {
  const drive = getDriveClient();
  if (!drive) throw new Error('Google Drive not configured.');

  try {
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: { role: 'reader', type: 'anyone' },
    });
    
    const result = await drive.files.get({
      fileId,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });
    
    return {
      fileId: result.data.id,
      webViewLink: result.data.webViewLink,
      webContentLink: result.data.webContentLink,
    };
  } catch (error) {
    console.error('[GoogleDrive] ❌ Failed to make file public:', getGoogleErrorMessage(error));
    throw new Error(getGoogleErrorMessage(error));
  }
};

/**
 * Deletes a file from Google Drive
 */
export const deleteFileFromDrive = async (fileId: string) => {
  const drive = getDriveClient();
  if (!drive) return;
  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    console.log('[GoogleDrive] ✅ File deleted:', fileId);
  } catch (error) {
    console.error('[GoogleDrive] ❌ Delete failed:', getGoogleErrorMessage(error));
  }
};

/**
 * Gets a file stream from Google Drive with proper Range request support.
 * HTML5 <video> elements require HTTP 206 Partial Content responses to play
 * and seek through video files. This function:
 *   1. Gets file metadata (size, mimeType) from Google Drive
 *   2. Parses the browser's Range header
 *   3. Downloads only the requested byte range from Google Drive
 *   4. Returns proper headers for the <video> element
 */
export const getFileStreamFromDrive = async (fileId: string, rangeHeader?: string) => {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive not configured.');
  }

  // Step 1: Get file metadata (we need the total file size for Range responses)
  const metadata = await drive.files.get({
    fileId,
    fields: 'mimeType, name, size',
    supportsAllDrives: true,
  });

  const totalSize = parseInt(metadata.data.size || '0', 10);
  const mimeType = metadata.data.mimeType || 'video/webm';
  const fileName = metadata.data.name || 'recording';

  // Step 2: Parse Range header and calculate byte range
  let start = 0;
  let end = totalSize - 1;
  let isRangeRequest = false;

  if (rangeHeader && totalSize > 0) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      isRangeRequest = true;
      start = match[1] ? parseInt(match[1], 10) : 0;
      end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      // Clamp end to file size
      if (end >= totalSize) end = totalSize - 1;
      if (start >= totalSize) start = totalSize - 1;
    }
  }

  const chunkSize = end - start + 1;

  // Step 3: Request the byte range from Google Drive
  const requestHeaders: Record<string, string> = {};
  if (isRangeRequest) {
    requestHeaders['Range'] = `bytes=${start}-${end}`;
  }

  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream', headers: requestHeaders }
  );

  // Step 4: Build response headers for the browser's <video> element
  const responseHeaders: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': mimeType,
  };

  if (isRangeRequest && totalSize > 0) {
    responseHeaders['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
    responseHeaders['Content-Length'] = String(chunkSize);
  } else if (totalSize > 0) {
    responseHeaders['Content-Length'] = String(totalSize);
  }

  return {
    stream: response.data,
    mimeType,
    fileName,
    size: totalSize,
    isRangeRequest,
    responseHeaders,
  };
};

