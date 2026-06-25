export const getDirectDriveUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      if (url.includes('id=')) {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get('id');
        if (id) {
          return `https://drive.google.com/uc?export=view&id=${id}`;
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse URL', e);
  }
  return url;
};


