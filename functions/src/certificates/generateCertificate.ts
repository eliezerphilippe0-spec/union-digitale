/**
 * Certificate Generation System
 * Generates PDF certificates for completed courses
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

interface CertificateRequest {
  courseId: string;
  enrollmentId?: string;
}

interface CertificateData {
  id: string;
  recipientName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  certificateNumber: string;
  verificationUrl: string;
}

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const prefix = 'UD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate SVG certificate (can be converted to PDF client-side or via another service)
 */
function generateCertificateSVG(data: CertificateData): string {
  const { recipientName, courseName, instructorName, completionDate, certificateNumber, verificationUrl } = data;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1056" height="816" viewBox="0 0 1056 816" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc"/>
      <stop offset="100%" style="stop-color:#e2e8f0"/>
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1056" height="816" fill="url(#bgGradient)"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1016" height="776" fill="none" stroke="url(#accentGradient)" stroke-width="4" rx="8"/>
  <rect x="35" y="35" width="986" height="746" fill="none" stroke="#cbd5e1" stroke-width="1" rx="4"/>
  
  <!-- Logo area -->
  <text x="528" y="100" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#f97316" text-anchor="middle">
    🔗 UNION DIGITALE
  </text>
  
  <!-- Certificate title -->
  <text x="528" y="180" font-family="Georgia, serif" font-size="48" fill="#1e293b" text-anchor="middle">
    Certificat de Réussite
  </text>
  
  <!-- Decorative line -->
  <line x1="200" y1="210" x2="856" y2="210" stroke="url(#accentGradient)" stroke-width="2"/>
  
  <!-- Subtitle -->
  <text x="528" y="270" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
    Ce certificat est décerné à
  </text>
  
  <!-- Recipient name -->
  <text x="528" y="340" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="#0f172a" text-anchor="middle">
    ${escapeXml(recipientName)}
  </text>
  
  <!-- Decorative line under name -->
  <line x1="300" y1="360" x2="756" y2="360" stroke="#cbd5e1" stroke-width="1"/>
  
  <!-- Course completion text -->
  <text x="528" y="420" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
    pour avoir complété avec succès le cours
  </text>
  
  <!-- Course name -->
  <text x="528" y="480" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#1e293b" text-anchor="middle">
    ${escapeXml(truncateText(courseName, 50))}
  </text>
  
  <!-- Instructor -->
  <text x="528" y="540" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
    Instructeur: ${escapeXml(instructorName)}
  </text>
  
  <!-- Date -->
  <text x="528" y="600" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
    Complété le ${completionDate}
  </text>
  
  <!-- Signature area -->
  <g transform="translate(200, 650)">
    <line x1="0" y1="0" x2="200" y2="0" stroke="#1e293b" stroke-width="1"/>
    <text x="100" y="25" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">
      Union Digitale
    </text>
  </g>
  
  <g transform="translate(656, 650)">
    <line x1="0" y1="0" x2="200" y2="0" stroke="#1e293b" stroke-width="1"/>
    <text x="100" y="25" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">
      ${escapeXml(instructorName)}
    </text>
  </g>
  
  <!-- Certificate number & verification -->
  <text x="528" y="750" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">
    Certificat N° ${certificateNumber}
  </text>
  <text x="528" y="770" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">
    Vérifier: ${verificationUrl}
  </text>
  
  <!-- QR code placeholder (would need actual QR generation) -->
  <rect x="48" y="700" width="60" height="60" fill="#f1f5f9" stroke="#e2e8f0" rx="4"/>
  <text x="78" y="735" font-family="Arial, sans-serif" font-size="8" fill="#94a3b8" text-anchor="middle">QR</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate certificate for completed course
 */
export const generateCourseCertificate = functions.https.onCall(
  async (data: CertificateRequest, context): Promise<{ success: boolean; certificate?: any; error?: string }> => {
    if (!context.auth) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = context.auth.uid;
    const { courseId } = data;

    if (!courseId) {
      return { success: false, error: 'courseId required' };
    }

    try {
      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }
      const userData = userDoc.data()!;

      // Check enrollment and completion
      const enrollmentQuery = await db
        .collection('enrollments')
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .where('status', '==', 'completed')
        .limit(1)
        .get();

      if (enrollmentQuery.empty) {
        // Also check course_progress
        const progressDoc = await db
          .collection('course_progress')
          .doc(`${userId}_${courseId}`)
          .get();

        if (!progressDoc.exists || progressDoc.data()?.completionPercentage < 100) {
          return { success: false, error: 'Course not completed' };
        }
      }

      // Check if certificate already exists
      const existingCert = await db
        .collection('certificates')
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();

      if (!existingCert.empty) {
        const cert = existingCert.docs[0].data();
        return {
          success: true,
          certificate: {
            id: existingCert.docs[0].id,
            ...cert,
            downloadUrl: cert.downloadUrl,
          },
        };
      }

      // Get course data
      const courseDoc = await db.collection('products').doc(courseId).get();
      if (!courseDoc.exists) {
        return { success: false, error: 'Course not found' };
      }
      const courseData = courseDoc.data()!;

      // Get instructor name
      let instructorName = 'Union Digitale';
      if (courseData.vendorId) {
        const vendorDoc = await db.collection('vendors').doc(courseData.vendorId).get();
        if (vendorDoc.exists) {
          instructorName = vendorDoc.data()?.businessName || vendorDoc.data()?.name || instructorName;
        }
      }

      // Generate certificate
      const certificateNumber = generateCertificateNumber();
      const completionDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const certData: CertificateData = {
        id: certificateNumber,
        recipientName: userData.displayName || userData.name || 'Apprenant',
        courseName: courseData.name || courseData.title || 'Cours',
        instructorName,
        completionDate,
        certificateNumber,
        verificationUrl: `https://uniondigitale.ht/verify/${certificateNumber}`,
      };

      // Generate SVG
      const svgContent = generateCertificateSVG(certData);

      // Upload to Storage
      const bucket = storage.bucket();
      const fileName = `certificates/${userId}/${certificateNumber}.svg`;
      const file = bucket.file(fileName);

      await file.save(svgContent, {
        contentType: 'image/svg+xml',
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      // Make file public
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Save certificate record
      const certificateDoc = await db.collection('certificates').add({
        userId,
        courseId,
        certificateNumber,
        recipientName: certData.recipientName,
        courseName: certData.courseName,
        instructorName,
        completionDate,
        downloadUrl: publicUrl,
        svgPath: fileName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: true,
      });

      return {
        success: true,
        certificate: {
          id: certificateDoc.id,
          certificateNumber,
          downloadUrl: publicUrl,
          recipientName: certData.recipientName,
          courseName: certData.courseName,
          completionDate,
        },
      };
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      return { success: false, error: 'Failed to generate certificate' };
    }
  }
);

/**
 * Verify a certificate by its number
 */
export const verifyCertificate = functions.https.onCall(
  async (data: { certificateNumber: string }): Promise<{ valid: boolean; certificate?: any }> => {
    const { certificateNumber } = data;

    if (!certificateNumber) {
      return { valid: false };
    }

    try {
      const certQuery = await db
        .collection('certificates')
        .where('certificateNumber', '==', certificateNumber)
        .where('verified', '==', true)
        .limit(1)
        .get();

      if (certQuery.empty) {
        return { valid: false };
      }

      const cert = certQuery.docs[0].data();

      return {
        valid: true,
        certificate: {
          recipientName: cert.recipientName,
          courseName: cert.courseName,
          completionDate: cert.completionDate,
          instructorName: cert.instructorName,
          issuedAt: cert.createdAt?.toDate?.() || cert.createdAt,
        },
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { valid: false };
    }
  }
);
