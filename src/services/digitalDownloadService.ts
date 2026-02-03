/**
 * Digital Download Service - Frontend
 * Handles secure downloads for digital products
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export interface DigitalFile {
  fileId: string;
  name: string;
  type: string;
  size?: number;
  url: string;
  expiresAt: number;
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Get signed download URL for a digital file
 */
export async function getDownloadUrl(
  fileId: string,
  productId: string
): Promise<{ url: string; expiresAt: number }> {
  const getUrl = httpsCallable<
    { fileId: string; productId: string },
    DownloadResult
  >(functions, 'getSignedDownloadUrl');

  const result = await getUrl({ fileId, productId });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to get download link');
  }

  return {
    url: result.data.url!,
    expiresAt: result.data.expiresAt!,
  };
}

/**
 * Get all download URLs for an order
 */
export async function getOrderDownloads(orderId: string): Promise<DigitalFile[]> {
  const getUrls = httpsCallable<
    { orderId: string },
    { success: boolean; files?: DigitalFile[]; error?: string }
  >(functions, 'getOrderDownloadUrls');

  const result = await getUrls({ orderId });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to get downloads');
  }

  return result.data.files || [];
}

/**
 * Download a file
 */
export async function downloadFile(file: DigitalFile): Promise<void> {
  // Check if URL is still valid
  if (file.expiresAt < Date.now()) {
    throw new Error('Download link expired. Please refresh the page.');
  }

  // Create download link
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  link.target = '_blank';
  
  // For cross-origin files, we need to fetch and create blob
  try {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    // Fallback: direct link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    pdf: '📄',
    video: '🎬',
    audio: '🎵',
    image: '🖼️',
    zip: '📦',
    ebook: '📚',
    code: '💻',
    default: '📁',
  };
  
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('pdf')) return icons.pdf;
  if (normalizedType.includes('video') || normalizedType.includes('mp4')) return icons.video;
  if (normalizedType.includes('audio') || normalizedType.includes('mp3')) return icons.audio;
  if (normalizedType.includes('image') || normalizedType.includes('jpg') || normalizedType.includes('png')) return icons.image;
  if (normalizedType.includes('zip') || normalizedType.includes('rar')) return icons.zip;
  if (normalizedType.includes('epub') || normalizedType.includes('mobi')) return icons.ebook;
  
  return icons.default;
}

/**
 * Check if URL is expired
 */
export function isUrlExpired(expiresAt: number): boolean {
  return expiresAt < Date.now();
}

/**
 * Time remaining until expiration
 */
export function getTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  
  if (remaining <= 0) return 'Expiré';
  
  const minutes = Math.floor(remaining / 60000);
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}
