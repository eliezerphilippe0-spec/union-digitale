/**
 * CourseContent - Inspiré Udemy/Coursera
 * Table des matières pour cours en ligne
 */

import React, { useState } from 'react';
import { 
    ChevronDown, ChevronUp, Play, Lock, CheckCircle, 
    Clock, FileText, Video, Download, Eye
} from 'lucide-react';

const CourseContent = ({ course }) => {
    const [expandedSections, setExpandedSections] = useState([0]);

    // Mock course content if not provided
    const sections = course?.sections || [
        {
            id: 1,
            title: "Introduction",
            duration: "15 min",
            lessons: [
                { id: 1, title: "Bienvenue dans la formation", duration: "3:00", type: "video", free: true },
                { id: 2, title: "Ce que vous allez apprendre", duration: "5:00", type: "video", free: true },
                { id: 3, title: "Ressources à télécharger", duration: "2:00", type: "file", free: false },
            ]
        },
        {
            id: 2,
            title: "Les Fondamentaux",
            duration: "1h 30min",
            lessons: [
                { id: 4, title: "Comprendre les bases", duration: "20:00", type: "video", free: false },
                { id: 5, title: "Exercice pratique #1", duration: "15:00", type: "video", free: false },
                { id: 6, title: "Quiz de validation", duration: "10:00", type: "quiz", free: false },
                { id: 7, title: "Correction et explications", duration: "25:00", type: "video", free: false },
            ]
        },
        {
            id: 3,
            title: "Techniques Avancées",
            duration: "2h 15min",
            lessons: [
                { id: 8, title: "Méthodes expertes", duration: "30:00", type: "video", free: false },
                { id: 9, title: "Étude de cas réelle", duration: "45:00", type: "video", free: false },
                { id: 10, title: "Projet final", duration: "1:00:00", type: "project", free: false },
            ]
        },
        {
            id: 4,
            title: "Conclusion & Certification",
            duration: "30 min",
            lessons: [
                { id: 11, title: "Résumé de la formation", duration: "10:00", type: "video", free: false },
                { id: 12, title: "Examen final", duration: "15:00", type: "quiz", free: false },
                { id: 13, title: "Obtenir votre certificat", duration: "5:00", type: "file", free: false },
            ]
        }
    ];

    const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
    const totalDuration = "4h 30min"; // In real app, calculate from sections

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const getLessonIcon = (type, free) => {
        if (!free) return <Lock className="w-4 h-4 text-gray-400" />;
        
        const icons = {
            video: <Play className="w-4 h-4 text-blue-500" />,
            file: <FileText className="w-4 h-4 text-green-500" />,
            quiz: <CheckCircle className="w-4 h-4 text-purple-500" />,
            project: <Download className="w-4 h-4 text-amber-500" />,
        };
        return icons[type] || <Play className="w-4 h-4" />;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                <h3 className="text-xl font-bold mb-2">Contenu de la formation</h3>
                <div className="flex items-center gap-4 text-indigo-100 text-sm">
                    <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {sections.length} sections
                    </span>
                    <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {totalLessons} leçons
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {totalDuration} au total
                    </span>
                </div>
            </div>

            {/* Sections */}
            <div className="divide-y divide-gray-100">
                {sections.map((section, idx) => (
                    <div key={section.id}>
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(idx)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                                    {idx + 1}
                                </span>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                    <p className="text-sm text-gray-500">
                                        {section.lessons.length} leçons · {section.duration}
                                    </p>
                                </div>
                            </div>
                            {expandedSections.includes(idx) 
                                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                : <ChevronDown className="w-5 h-5 text-gray-400" />
                            }
                        </button>

                        {/* Lessons */}
                        {expandedSections.includes(idx) && (
                            <div className="bg-gray-50 px-6 py-2">
                                {section.lessons.map((lesson) => (
                                    <div 
                                        key={lesson.id}
                                        className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${
                                            lesson.free ? 'cursor-pointer hover:bg-white rounded-lg px-2 -mx-2' : ''
                                        }`}
                                    >
                                        {getLessonIcon(lesson.type, lesson.free)}
                                        <div className="flex-1">
                                            <p className={`text-sm ${lesson.free ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {lesson.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {lesson.free && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    Gratuit
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">{lesson.duration}</span>
                                            {lesson.free && (
                                                <Eye className="w-4 h-4 text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Expand All */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <button 
                    onClick={() => setExpandedSections(
                        expandedSections.length === sections.length 
                            ? [] 
                            : sections.map((_, i) => i)
                    )}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    {expandedSections.length === sections.length ? 'Réduire tout' : 'Développer tout'}
                </button>
            </div>
        </div>
    );
};

export default CourseContent;
