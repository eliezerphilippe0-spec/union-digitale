/**
 * Certificate Viewer Component
 * Displays and manages course completion certificates
 */

import React, { useState, useEffect } from 'react';
import { Award, Download, Share2, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  Certificate,
  generateCertificate,
  verifyCertificate,
  downloadCertificate,
  shareCertificate,
  certificateToPng,
} from '../services/certificateService';

interface CertificateViewerProps {
  courseId: string;
  courseName: string;
  isCompleted: boolean;
}

export default function CertificateViewer({
  courseId,
  courseName,
  isCompleted,
}: CertificateViewerProps) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      const cert = await generateCertificate(courseId);
      setCertificate(cert);
    } catch (err: any) {
      setError(err.message || 'Impossible de générer le certificat');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!certificate) return;
    downloadCertificate(certificate);
  }

  async function handleDownloadPng() {
    if (!certificate) return;
    
    try {
      const blob = await certificateToPng(certificate.downloadUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat-${certificate.certificateNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback to SVG
      downloadCertificate(certificate);
    }
  }

  async function handleShare() {
    if (!certificate) return;
    await shareCertificate(certificate);
  }

  if (!isCompleted) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Certificat de réussite</h3>
            <p className="text-sm text-gray-500">
              Terminez le cours pour obtenir votre certificat
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Erreur</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Félicitations! 🎉</h3>
            <p className="text-sm text-gray-600">
              Vous avez terminé "{courseName}". Générez votre certificat!
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Obtenir le certificat
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Certificate Preview */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="aspect-[1056/816] max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <img
            src={certificate.downloadUrl}
            alt="Certificat"
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Verification Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm">
          <CheckCircle className="w-4 h-4" />
          Vérifié
        </div>
      </div>

      {/* Certificate Info */}
      <div className="p-6 border-t">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">N° de certificat</p>
            <p className="font-mono font-medium text-gray-900">
              {certificate.certificateNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Délivré le</p>
            <p className="font-medium text-gray-900">{certificate.completionDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Formation</p>
            <p className="font-medium text-gray-900 max-w-xs truncate">
              {certificate.courseName}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>SVG</span>
        </button>
        
        <button
          onClick={handleDownloadPng}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>PNG</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager</span>
        </button>
        
        <a
          href={`/verify/${certificate.certificateNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Page de vérification</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Certificate Verification Page Component
 */
export function CertificateVerification({ certificateNumber }: { certificateNumber: string }) {
  const [result, setResult] = useState<{
    valid: boolean;
    certificate?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verify();
  }, [certificateNumber]);

  async function verify() {
    try {
      setLoading(true);
      const data = await verifyCertificate(certificateNumber);
      setResult(data);
    } catch (err) {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (!result?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Certificat non trouvé</h1>
          <p className="mt-2 text-gray-600">
            Le certificat avec le numéro <span className="font-mono">{certificateNumber}</span> n'existe pas ou a été révoqué.
          </p>
        </div>
      </div>
    );
  }

  const cert = result.certificate!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Certificat Vérifié ✓</h1>
          <p className="text-green-100">Ce certificat est authentique</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Décerné à</p>
            <p className="text-xl font-semibold text-gray-900">{cert.recipientName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Formation</p>
            <p className="text-lg font-medium text-gray-900">{cert.courseName}</p>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500">Instructeur</p>
              <p className="font-medium text-gray-900">{cert.instructorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{cert.completionDate}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">N° de certificat</p>
            <p className="font-mono text-gray-900">{certificateNumber}</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-center text-sm text-gray-500">
            Vérifié par <span className="font-semibold text-orange-500">Union Digitale</span>
          </p>
        </div>
      </div>
    </div>
  );
}
