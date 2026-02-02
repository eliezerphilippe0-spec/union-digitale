/**
 * Image Optimization Service
 * Automatically optimize images on upload to Firebase Storage
 * Generates multiple sizes: thumbnail, medium, large
 * Converts to WebP for better performance
 */

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Image sizes configuration
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, suffix: '_thumb' },
  small: { width: 300, height: 300, suffix: '_small' },
  medium: { width: 600, height: 600, suffix: '_medium' },
  large: { width: 1200, height: 1200, suffix: '_large' }
};

/**
 * Optimize and resize images on upload
 * Triggers when images are uploaded to /products, /vendors, /users folders
 */
export const optimizeImage = onObjectFinalized(
  {
    cpu: 2,
    memory: '1GiB',
    timeoutSeconds: 540,
    region: 'us-central1'
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const bucket = getStorage().bucket(event.data.bucket);

    // Exit if not an image
    if (!contentType || !contentType.startsWith('image/')) {
      console.log('Not an image, skipping:', filePath);
      return null;
    }

    // Exit if already optimized
    if (filePath.includes('_thumb') || filePath.includes('_small') ||
        filePath.includes('_medium') || filePath.includes('_large') ||
        filePath.includes('_optimized')) {
      console.log('Already optimized, skipping:', filePath);
      return null;
    }

    // Only process images in specific folders
    const validFolders = ['products', 'vendors', 'users', 'categories'];
    const isValidFolder = validFolders.some(folder => filePath.startsWith(folder + '/'));

    if (!isValidFolder) {
      console.log('Not in valid folder, skipping:', filePath);
      return null;
    }

    console.log('🖼️  Optimizing image:', filePath);

    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);

    // Download original image
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log('Downloaded to:', tempFilePath);

    try {
      // Process each size
      const uploadPromises: Promise<void>[] = [];

      for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
        const optimizedFileName = `${fileNameWithoutExt}${config.suffix}.webp`;
        const optimizedFilePath = path.join(fileDir, optimizedFileName);
        const tempOptimizedPath = path.join(os.tmpdir(), optimizedFileName);

        // Resize and convert to WebP
        await sharp(tempFilePath)
          .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(tempOptimizedPath);

        console.log(`✅ Created ${sizeName}:`, optimizedFileName);

        // Upload optimized image
        const uploadPromise = bucket.upload(tempOptimizedPath, {
          destination: optimizedFilePath,
          metadata: {
            contentType: 'image/webp',
            metadata: {
              originalName: fileName,
              optimized: 'true',
              size: sizeName
            }
          }
        }).then(() => {
          // Clean up temp file
          fs.unlinkSync(tempOptimizedPath);
        });

        uploadPromises.push(uploadPromise);
      }

      // Also create an optimized version of original size
      const optimizedOriginalPath = path.join(os.tmpdir(), `${fileNameWithoutExt}_optimized.webp`);
      await sharp(tempFilePath)
        .webp({ quality: 85 })
        .toFile(optimizedOriginalPath);

      const optimizedOriginalDestination = path.join(fileDir, `${fileNameWithoutExt}_optimized.webp`);
      uploadPromises.push(
        bucket.upload(optimizedOriginalPath, {
          destination: optimizedOriginalDestination,
          metadata: {
            contentType: 'image/webp',
            metadata: {
              originalName: fileName,
              optimized: 'true',
              size: 'original'
            }
          }
        }).then(() => {
          fs.unlinkSync(optimizedOriginalPath);
        })
      );

      // Wait for all uploads
      await Promise.all(uploadPromises);

      // Clean up original temp file
      fs.unlinkSync(tempFilePath);

      console.log('🎉 Image optimization complete:', filePath);
      return null;

    } catch (error) {
      console.error('Error optimizing image:', error);

      // Clean up temp files on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw error;
    }
  }
);

/**
 * Helper function to get optimized image URL
 * Use this in Cloud Functions to return the best image size
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'optimized' = 'medium'
): string {
  if (!originalUrl) return '';

  // If already optimized, return as-is
  if (originalUrl.includes('_thumb') || originalUrl.includes('_small') ||
      originalUrl.includes('_medium') || originalUrl.includes('_large') ||
      originalUrl.includes('_optimized')) {
    return originalUrl;
  }

  // Replace extension with optimized version
  const suffixMap: Record<string, string> = {
    thumbnail: '_thumb.webp',
    small: '_small.webp',
    medium: '_medium.webp',
    large: '_large.webp',
    optimized: '_optimized.webp'
  };

  const suffix = suffixMap[size] || '_medium.webp';

  // Remove existing extension and add suffix
  const urlWithoutExt = originalUrl.replace(/\.[^.]+$/, '');
  return `${urlWithoutExt}${suffix}`;
}
