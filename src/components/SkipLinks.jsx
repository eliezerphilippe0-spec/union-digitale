import React from 'react';

/**
 * Skip Links Component
 * Allows keyboard users to skip to main content
 */

const SkipLinks = () => {
    return (
        <div className="skip-links-container">
            <a href="#main-content" className="skip-link">
                Aller au contenu principal
            </a>
            <a href="#main-navigation" className="skip-link">
                Aller à la navigation
            </a>
            <a href="#footer" className="skip-link">
                Aller au pied de page
            </a>
        </div>
    );
};

export default SkipLinks;
