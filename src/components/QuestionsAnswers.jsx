/**
 * QuestionsAnswers - Inspiré Amazon Q&A
 * Section questions/réponses sur les produits
 */

import React, { useState } from 'react';
import { MessageCircle, ThumbsUp, ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

const QuestionsAnswers = ({ productId, questions = [] }) => {
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [showAskForm, setShowAskForm] = useState(false);

    // Mock data if no questions provided
    const mockQuestions = questions.length > 0 ? questions : [
        {
            id: 1,
            question: "Est-ce que ce produit est compatible avec les prises haïtiennes?",
            answer: "Oui, le produit est livré avec un adaptateur universel compatible avec les prises 110V utilisées en Haïti.",
            author: "Jean P.",
            date: "Il y a 3 jours",
            helpful: 24,
            answeredBy: "Vendeur",
        },
        {
            id: 2,
            question: "Quelle est la durée de la garantie?",
            answer: "La garantie est de 12 mois à partir de la date de livraison. Elle couvre les défauts de fabrication.",
            author: "Marie L.",
            date: "Il y a 1 semaine",
            helpful: 18,
            answeredBy: "Vendeur",
        },
        {
            id: 3,
            question: "Est-ce que vous livrez à Cap-Haïtien?",
            answer: "Oui, nous livrons partout en Haïti. La livraison à Cap-Haïtien prend généralement 3-5 jours ouvrables.",
            author: "Pierre M.",
            date: "Il y a 2 semaines",
            helpful: 12,
            answeredBy: "Union Digitale",
        },
    ];

    const filteredQuestions = mockQuestions.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedQuestions = showAll ? filteredQuestions : filteredQuestions.slice(0, 2);

    const handleAskQuestion = (e) => {
        e.preventDefault();
        if (newQuestion.trim()) {
            // In real app, this would send to API
            alert(`Question soumise: "${newQuestion}"\n\nUn vendeur vous répondra sous 24-48h.`);
            setNewQuestion('');
            setShowAskForm(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 my-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Questions & Réponses</h3>
                    <span className="text-sm text-gray-500">({mockQuestions.length})</span>
                </div>
                <button
                    onClick={() => setShowAskForm(!showAskForm)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    <HelpCircle className="w-4 h-4" />
                    Poser une question
                </button>
            </div>

            {/* Ask Question Form */}
            {showAskForm && (
                <form onSubmit={handleAskQuestion} className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Votre question sur ce produit:
                    </label>
                    <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Ex: Est-ce que ce produit est disponible en d'autres couleurs?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => setShowAskForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!newQuestion.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Soumettre
                        </button>
                    </div>
                </form>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Chercher dans les questions..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {displayedQuestions.map((qa) => (
                    <div key={qa.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        {/* Question */}
                        <div className="flex gap-3 mb-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                Q
                            </span>
                            <div>
                                <p className="font-semibold text-gray-900">{qa.question}</p>
                                <p className="text-xs text-gray-500 mt-1">{qa.author} · {qa.date}</p>
                            </div>
                        </div>

                        {/* Answer */}
                        <div className="flex gap-3 ml-9">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                R
                            </span>
                            <div>
                                <p className="text-gray-700">{qa.answer}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs text-gray-500">
                                        Répondu par <span className="font-semibold text-green-600">{qa.answeredBy}</span>
                                    </span>
                                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                                        <ThumbsUp className="w-3 h-3" />
                                        Utile ({qa.helpful})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More */}
            {filteredQuestions.length > 2 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 border-t border-gray-100"
                >
                    {showAll ? (
                        <>
                            Voir moins <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Voir les {filteredQuestions.length - 2} autres questions <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}

            {filteredQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucune question pour ce produit.</p>
                    <p className="text-sm">Soyez le premier à poser une question!</p>
                </div>
            )}
        </div>
    );
};

export default QuestionsAnswers;
