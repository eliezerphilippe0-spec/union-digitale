import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

const SocialProof = () => {
    const [viewers, setViewers] = useState(12);

    useEffect(() => {
        const interval = setInterval(() => {
            setViewers(prev => prev + Math.floor(Math.random() * 3) - 1);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-2 animate-pulse">
            <Eye className="w-4 h-4" />
            <span>{viewers} personnes consultent cet article en ce moment</span>
        </div>
    );
};

export default SocialProof;
