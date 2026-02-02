import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const MyCourses = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sample enrolled courses
    const sampleEnrollments = [
        {
            id: '1',
            courseId: '1',
            course: {
                title: 'Programmation Web avec React',
                thumbnail: '💻',
                instructor: 'Jean Baptiste'
            },
            progress: {
                percentage: 45,
                completedLessons: ['1-1', '1-2', '1-3', '2-1'],
                currentLesson: '2-2'
            },
            enrolledAt: new Date('2026-01-01')
        },
        {
            id: '2',
            courseId: '2',
            course: {
                title: 'Créole Haïtien pour Débutants',
                thumbnail: '🗣️',
                instructor: 'Marie Carmel'
            },
            progress: {
                percentage: 100,
                completedLessons: ['1-1', '1-2', '2-1', '2-2', '3-1'],
                currentLesson: null
            },
            certificateIssued: true,
            completedAt: new Date('2026-01-05')
        }
    ];

    useEffect(() => {
        if (user) {
            setEnrollments(sampleEnrollments);
            setLoading(false);
        }
    }, [user]);

    const inProgressCourses = enrollments.filter(e => e.progress.percentage < 100);
    const completedCourses = enrollments.filter(e => e.progress.percentage === 100);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Connectez-vous
                    </h2>
                    <p className="text-gray-600 dark:text-neutral-400 mb-6">
                        Pour voir vos cours
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Se Connecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    Mes Cours
                </h1>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">En cours</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {inProgressCourses.length}
                                </p>
                            </div>
                            <Play className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Complétés</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {completedCourses.length}
                                </p>
                            </div>
                            <Award className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Progression</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(enrollments.reduce((acc, e) => acc + e.progress.percentage, 0) / enrollments.length)}%
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* In Progress */}
                {inProgressCourses.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            En Cours
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {inProgressCourses.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    onClick={() => navigate(`/learn/course/${enrollment.courseId}`)}
                                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="text-5xl">{enrollment.course.thumbnail}</div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                {enrollment.course.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {enrollment.course.instructor}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-neutral-400">Progression</span>
                                            <span className="font-bold text-purple-600 dark:text-purple-400">
                                                {enrollment.progress.percentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                style={{ width: `${enrollment.progress.percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                        Continuer
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed */}
                {completedCourses.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Complétés
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {completedCourses.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="text-5xl">{enrollment.course.thumbnail}</div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                {enrollment.course.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {enrollment.course.instructor}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3">
                                        <Award className="w-5 h-5" />
                                        <span className="font-semibold">Certificat obtenu</span>
                                    </div>

                                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                                        Télécharger Certificat
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {enrollments.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Aucun cours inscrit
                        </h3>
                        <p className="text-gray-500 dark:text-neutral-400 mb-6">
                            Commencez votre apprentissage dès maintenant
                        </p>
                        <button
                            onClick={() => navigate('/learn')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Explorer les Cours
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCourses;
