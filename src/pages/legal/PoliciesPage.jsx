import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Scale, AlertCircle, Printer, Download } from 'lucide-react';
import { OFFICIAL_POLICIES } from '../../data/legal/official_policies';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const PoliciesPage = () => {
    const [policies, setPolicies] = useState(OFFICIAL_POLICIES.policies);
    const [activeSection, setActiveSection] = useState('introduction');

    // Optional: Fetch from Firestore to get dynamic updates if available
    useEffect(() => {
        const fetchRemotePolicies = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'platform_policies', 'main'));
                if (docSnap.exists()) {
                    setPolicies(docSnap.data());
                }
            } catch (error) {
                console.error("Using local fallback policies:", error);
            }
        };
        fetchRemotePolicies();
    }, []);

    const sections = Object.entries(policies.sections || {});

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none">
                {/* Header */}
                <div className="bg-gray-900 text-white p-8 print:bg-white print:text-black print:border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Scale className="w-8 h-8 text-secondary" />
                                <h1 className="text-3xl font-bold">Politiques Officielles</h1>
                            </div>
                            <p className="text-gray-400 print:text-gray-600">Union Digitale Marketplace • Haïti</p>
                            <div className="mt-4 flex items-center gap-2 text-xs bg-white/10 w-fit px-3 py-1 rounded-full text-gray-300 print:bg-gray-100 print:text-gray-800">
                                <ShieldCheck className="w-3 h-3 text-green-400" />
                                Version {policies.version} • Mise à jour : {policies.lastUpdate}
                            </div>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition print:hidden"
                            title="Imprimer / Sauvegarder PDF"
                        >
                            <Printer className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row print:flex-col">
                    {/* Sidebar Navigation */}
                    <nav className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 print:hidden">
                        <ul className="space-y-1">
                            {sections.map(([key, section]) => (
                                <li key={key}>
                                    <button
                                        onClick={() => setActiveSection(key)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === key
                                                ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-200'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1 p-8 print:p-0">
                        {sections.map(([key, section]) => (
                            <div
                                key={key}
                                className={`${activeSection === key ? 'block' : 'hidden md:hidden'} print:block print:mb-8`}
                            >
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-gray-400 print:hidden" />
                                    {section.title}
                                </h2>

                                {section.content && (
                                    <p className="text-gray-600 mb-6 leading-relaxed">{section.content}</p>
                                )}

                                {section.rules && (
                                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 print:bg-transparent print:border-none print:p-0">
                                        {Array.isArray(section.rules) ? (
                                            <ul className="space-y-2">
                                                {section.rules.map((rule, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                                                        <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 shrink-0" />
                                                        {rule}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="grid gap-4">
                                                {Object.entries(section.rules).map(([ruleKey, ruleValue]) => (
                                                    <div key={ruleKey} className="pb-3 border-b border-blue-100 last:border-0 print:border-gray-200">
                                                        <span className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1 print:text-black">
                                                            {ruleKey.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <div className="text-gray-800 font-medium">
                                                            {Array.isArray(ruleValue) ? (
                                                                <ul className="list-disc pl-5 space-y-1 mt-1">
                                                                    {ruleValue.map((v, i) => <li key={i}>{v}</li>)}
                                                                </ul>
                                                            ) : typeof ruleValue === 'object' ? (
                                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                                    {Object.entries(ruleValue).map(([k, v]) => (
                                                                        <div key={k} className="bg-white px-3 py-1 rounded border border-blue-100 text-sm print:border-gray-200">
                                                                            <span className="text-gray-500 mr-2">{k}:</span>
                                                                            <span className="font-bold">{v}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                ruleValue.toString()
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {section.methods && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                        {section.methods.map((method, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 print:border-gray-300">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="text-gray-700 font-medium">{method}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-400 print:text-xs">
                            <p>© {new Date().getFullYear()} Union Digitale Haïti. Tous droits réservés.</p>
                            <p>L'utilisation de la plateforme vaut acceptation de ces politiques.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoliciesPage;
