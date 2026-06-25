import { Router, Request, Response } from 'express';
import { getFileStreamFromDrive } from '../services/googleDriveService';

const router = Router();

router.get('/drive/:fileId', async (req: Request, res: Response): Promise<void> => {
  const { fileId } = req.params;

  if (!fileId) {
    res.status(400).json({ message: 'File ID is required' });
    return;
  }

  try {
    const { stream, mimeType } = await getFileStreamFromDrive(fileId as string);

    // Set correct MIME type and caching headers to optimize loading
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    // Pipe Google Drive file stream straight to client response
    stream.on('error', (err: any) => {
      console.error('[MediaProxy] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

    stream.pipe(res);
  } catch (error: any) {
    console.error(`[MediaProxy] Failed to fetch file ${fileId} from Drive:`, error.message);
    res.status(404).json({ message: 'Resource not found or access denied' });
  }
});

export default router;
