import React, { useEffect, useRef } from 'react';

const TrustpilotWidget = ({
    templateId = '5419b6a8b0d04a076446a9ad', // Example Micro Combo template
    businessUnitId = '', // User needs to fill this
    height = '24px',
    culture = 'fr-FR',
    theme = 'light'
}) => {
    const ref = useRef(null);

    useEffect(() => {
        // Load Trustpilot script if not already loaded
        if (!window.Trustpilot) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
            script.async = true;
            document.head.appendChild(script);
        }

        // Refresh widget when component mounts or script loads
        if (window.Trustpilot && ref.current) {
            window.Trustpilot.loadFromElement(ref.current, true);
        }
    }, []);

    if (!businessUnitId) {
        // Placeholder for development/demo when no ID is provided
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00b67a]/10 border border-[#00b67a]/20 rounded-lg">
                <svg viewBox="0 0 32 32" className="w-5 h-5 text-[#00b67a] fill-current">
                    <path d="M16 2.8l4.4 10.8 11.6.4-9.2 7.7 3.2 11.2-10-6.6-10 6.6 3.2-11.2-9.2-7.7 11.6-.4z" />
                </svg>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-800 leading-none">Trustpilot</span>
                    <span className="text-[9px] text-gray-600 leading-none">4.8 / 5</span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="trustpilot-widget"
            data-locale={culture}
            data-template-id={templateId}
            data-businessunit-id={businessUnitId}
            data-style-height={height}
            data-style-width="100%"
            data-theme={theme}
        >
            <a href="https://fr.trustpilot.com/review/uniondigitale.ht" target="_blank" rel="noopener">Trustpilot</a>
        </div>
    );
};

export default TrustpilotWidget;
