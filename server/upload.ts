import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Process uploaded images
export async function processImage(buffer: Buffer, mimetype: string): Promise<{
  processedBuffer: Buffer;
  metadata: any;
}> {
  try {
    // Optimize image size while maintaining quality
    const processedBuffer = await sharp(buffer)
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    return {
      processedBuffer,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: buffer.length,
        processedSize: processedBuffer.length
      }
    };
  } catch (error) {
    throw new Error('Failed to process image');
  }
}

// Save file to local storage (in production, this would be cloud storage)
export async function saveFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  const fileId = randomUUID();
  const extension = path.extname(filename) || getExtensionFromMimeType(mimetype);
  const savedFilename = `${fileId}${extension}`;
  const filepath = path.join(uploadsDir, savedFilename);

  await fs.writeFile(filepath, buffer);
  
  return `/uploads/${savedFilename}`;
}

function getExtensionFromMimeType(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };
  
  return mimeToExt[mimetype] || '';
}

// Convert buffer to base64 for AI processing
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}