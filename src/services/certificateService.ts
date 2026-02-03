/**
 * Certificate Service - Frontend
 * Handles course certificate generation and verification
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export interface Certificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  downloadUrl: string;
}

export interface VerificationResult {
  valid: boolean;
  certificate?: {
    recipientName: string;
    courseName: string;
    completionDate: string;
    instructorName: string;
    issuedAt: Date;
  };
}

/**
 * Generate certificate for a completed course
 */
export async function generateCertificate(courseId: string): Promise<Certificate> {
  const generate = httpsCallable<
    { courseId: string },
    { success: boolean; certificate?: Certificate; error?: string }
  >(functions, 'generateCourseCertificate');

  const result = await generate({ courseId });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to generate certificate');
  }

  return result.data.certificate!;
}

/**
 * Verify a certificate by its number
 */
export async function verifyCertificate(certificateNumber: string): Promise<VerificationResult> {
  const verify = httpsCallable<
    { certificateNumber: string },
    VerificationResult
  >(functions, 'verifyCertificate');

  const result = await verify({ certificateNumber });
  return result.data;
}

/**
 * Download certificate as SVG
 */
export function downloadCertificate(certificate: Certificate): void {
  const link = document.createElement('a');
  link.href = certificate.downloadUrl;
  link.download = `certificat-${certificate.certificateNumber}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert SVG certificate to PNG (client-side)
 */
export async function certificateToPng(svgUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1056;
      canvas.height = 816;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert to PNG'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load certificate'));
    img.src = svgUrl;
  });
}

/**
 * Share certificate
 */
export async function shareCertificate(certificate: Certificate): Promise<void> {
  if (navigator.share) {
    await navigator.share({
      title: `Certificat - ${certificate.courseName}`,
      text: `J'ai obtenu mon certificat pour "${certificate.courseName}" sur Union Digitale! 🎓`,
      url: `https://uniondigitale.ht/verify/${certificate.certificateNumber}`,
    });
  } else {
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(
      `https://uniondigitale.ht/verify/${certificate.certificateNumber}`
    );
    alert('Lien copié dans le presse-papier!');
  }
}
