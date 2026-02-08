/**
 * InstructorCard - Inspiré Udemy/Teachable
 * Profil de l'instructeur/auteur
 */

import React from 'react';
import { Star, Users, BookOpen, Award, Play, MessageCircle, CheckCircle } from 'lucide-react';

const InstructorCard = ({ instructor }) => {
    // Mock instructor data if not provided
    const data = instructor || {
        name: "Jean-Pierre Augustin",
        title: "Expert en Marketing Digital",
        avatar: null,
        rating: 4.8,
        reviews: 1250,
        students: 8500,
        courses: 12,
        bio: "Plus de 15 ans d'expérience dans le marketing digital en Haïti et dans la Caraïbe. Fondateur de l'agence DigiHaiti et formateur certifié.",
        expertise: ["Marketing Digital", "SEO", "Réseaux Sociaux", "E-commerce"],
        verified: true,
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {data.avatar ? (
                            <img src={data.avatar} alt={data.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            data.name.split(' ').map(n => n[0]).join('')
                        )}
                    </div>
                    {data.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{data.name}</h3>
                        {data.verified && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                Vérifié
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm">{data.title}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6 py-4 border-y border-gray-100">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{data.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">Note moyenne</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-bold">{data.reviews.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">Avis</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-bold">{data.students.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">Étudiants</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-bold">{data.courses}</span>
                    </div>
                    <p className="text-xs text-gray-500">Cours</p>
                </div>
            </div>

            {/* Bio */}
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{data.bio}</p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                {data.expertise.map((skill, idx) => (
                    <span 
                        key={idx}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Contacter
                </button>
                <button className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Voir tous les cours
                </button>
            </div>
        </div>
    );
};

export default InstructorCard;
