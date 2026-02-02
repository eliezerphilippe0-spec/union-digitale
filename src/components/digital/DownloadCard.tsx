import React from 'react';
import { Download, FileText, Lock } from 'lucide-react';

interface DownloadCardProps {
    file: {
        name: string;
        size: string;
        type: string;
    };
    onDownload: () => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({ file, onDownload }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors mb-4">
            <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{file.name}</h4>
                    <p className="text-xs text-gray-500 uppercase">{file.type} • {file.size}</p>
                </div>
            </div>

            <button
                onClick={onDownload}
                className="flex items-center gap-2 bg-[#0A1D37] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
            >
                <Download className="w-4 h-4" />
                Télécharger
            </button>
        </div>
    );
};

export default DownloadCard;
