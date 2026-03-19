import React from 'react';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/common/SEO';

// Simple sanitization to mitigate XSS in the absence of DOMPurify
const sanitize = (html) => {
    if (!html) return '';
    return html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/gim, "")
        .replace(/javascript:[^"]*/gim, "");
};

const StaticPage = ({ title, content }) => {
    const safeContent = sanitize(content);

    return (
        <MainLayout>
            <SEO title={title} description={`Zabely - ${title}`} />
            <div className="bg-white min-h-screen py-12">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">{title}</h1>
                    <div className="prose prose-lg text-gray-700">
                        {safeContent ? (
                            <div dangerouslySetInnerHTML={{ __html: safeContent }} />
                        ) : (
                            <p>Contenu à venir...</p>
                        )}

                        {/* Mock Content Filler if none provided */}
                        {!content && (
                            <div className="space-y-4 text-gray-500">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default StaticPage;
