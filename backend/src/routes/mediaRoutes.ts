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
    const rangeHeader = req.headers.range;
    const { stream, isRangeRequest, responseHeaders } = await getFileStreamFromDrive(fileId as string, rangeHeader);

    // Set all computed headers (Content-Type, Accept-Ranges, Content-Length, Content-Range)
    for (const [key, value] of Object.entries(responseHeaders)) {
      res.setHeader(key, value);
    }

    // Cache for 24 hours
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Use 206 for Range requests, 200 for full content
    res.status(isRangeRequest ? 206 : 200);

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
