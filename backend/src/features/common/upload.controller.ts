import { Request, Response } from 'express';
import { ResponseUtil } from '../../core/utils/response.util';
import path from 'path';
import fs from 'fs';

export class UploadController {
  
  /**
   * Universal File Upload
   * Accepts files and a 'folder' parameter to organize storage.
   */
  public static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return ResponseUtil.error(res, 'No file uploaded', 400);
      }

      const folder = (req.body.folder || 'general').replace(/[^a-zA-Z0-0\-_]/g, '');
      const targetDir = path.join(__dirname, '../../../public/uploads', folder);

      // Ensure directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Move file from temporary multer storage to final location if needed
      // Actually, if we configure multer correctly it's already in a good place, 
      // but let's handle the move logic to ensure it's in the requested subfolder.
      const fileName = req.file.filename;
      const currentPath = req.file.path;
      const newPath = path.join(targetDir, fileName);

      fs.renameSync(currentPath, newPath);

      // Construct public URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/public/uploads/${folder}/${fileName}`;

      ResponseUtil.success(res, {
        fileName: fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        relativePath: `/public/uploads/${folder}/${fileName}`
      }, 'File uploaded successfully');

    } catch (error: any) {
      console.error('File Upload Error:', error);
      ResponseUtil.error(res, error.message || 'Failed to upload file');
    }
  }
}
