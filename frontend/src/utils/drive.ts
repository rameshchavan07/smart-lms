/**
 * Converts any Google Drive URL to a publicly-accessible thumbnail/image URL.
 *
 * WHY: The old `uc?export=view` URL is deprecated and blocked by Google (returns 403).
 * FIX: Use `drive.google.com/thumbnail?id=ID&sz=w800` which works for publicly-shared files.
 */
export const getDirectDriveUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      // Extract file ID from /d/FILE_ID format (e.g. webViewLink)
      const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD && matchD[1]) {
        return `https://drive.google.com/thumbnail?id=${matchD[1]}&sz=w800`;
      }

      // Extract file ID from ?id=FILE_ID or &id=FILE_ID format
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
      }
    }
  } catch (e) {
    console.error('Failed to parse Drive URL', e);
  }
  return url;
};



