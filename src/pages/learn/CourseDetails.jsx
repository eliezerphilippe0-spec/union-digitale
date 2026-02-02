import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Users, Clock, BookOpen, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Sample course data (in production, fetch from Firestore)
    const course = {
        id,
        title: 'Programmation Web avec React',
        description: 'Apprenez à créer des applications web modernes avec React, le framework JavaScript le plus populaire. Ce cours couvre les fondamentaux jusqu\'aux concepts avancés.',
        instructor: {
            name: 'Jean Baptiste',
            avatar: '👨‍💻',
            bio: 'Développeur Full-Stack avec 10 ans d\'expérience'
        },
        category: 'tech',
        level: 'intermediate',
        language: 'fr',
        price: 2500,
        thumbnail: '💻',
        rating: 4.8,
        studentsCount: 245,
        duration: '12h',
        chapters: [
            {
                id: '1',
                title: 'Introduction à React',
                lessons: [
                    { id: '1-1', title: 'Qu\'est-ce que React?', duration: '15min', free: true },
                    { id: '1-2', title: 'Installation et Setup', duration: '20min', free: true },
                    { id: '1-3', title: 'Premier Composant', duration: '25min', free: false }
                ]
            },
            {
                id: '2',
                title: 'Composants et Props',
                lessons: [
                    { id: '2-1', title: 'Créer des Composants', duration: '30min', free: false },
                    { id: '2-2', title: 'Props et State', duration: '35min', free: false },
                    { id: '2-3', title: 'Lifecycle Methods', duration: '40min', free: false }
                ]
            },
            {
                id: '3',
                title: 'Hooks et State Management',
                lessons: [
                    { id: '3-1', title: 'useState Hook', duration: '25min', free: false },
                    { id: '3-2', title: 'useEffect Hook', duration: '30min', free: false },
                    { id: '3-3', title: 'Context API', duration: '35min', free: false }
                ]
            }
        ]
    };

    const handleEnroll = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour vous inscrire');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'enrollments'), {
                userId: user.uid,
                courseId: course.id,
                progress: {
                    completedLessons: [],
                    currentLesson: course.chapters[0].lessons[0].id,
                    percentage: 0
                },
                certificateIssued: false,
                enrolledAt: serverTimestamp()
            });

            alert(`✅ Inscription réussie au cours "${course.title}"!`);
            navigate(`/learn/player/${course.id}`);
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('❌ Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <button
                    onClick={() => navigate('/learn')}
                    className="flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour au catalogue
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Preview */}
                        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl h-64 flex items-center justify-center text-8xl mb-6">
                            {course.thumbnail}
                        </div>

                        {/* Title & Stats */}
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {course.title}
                        </h1>

                        <div className="flex items-center gap-6 mb-6 text-gray-600 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{course.rating}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <span>{course.studentsCount} étudiants</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                <span>{course.duration}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Description
                            </h2>
                            <p className="text-gray-700 dark:text-neutral-300 leading-relaxed">
                                {course.description}
                            </p>
                        </div>

                        {/* Curriculum */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Contenu du Cours
                            </h2>
                            <p className="text-gray-600 dark:text-neutral-400 mb-6">
                                {course.chapters.length} chapitres • {totalLessons} leçons • {course.duration}
                            </p>

                            <div className="space-y-4">
                                {course.chapters.map((chapter, idx) => (
                                    <div key={chapter.id} className="border dark:border-neutral-700 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-neutral-700 p-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                Chapitre {idx + 1}: {chapter.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {chapter.lessons.length} leçons
                                            </p>
                                        </div>
                                        <div className="divide-y dark:divide-neutral-700">
                                            {chapter.lessons.map((lesson) => (
                                                <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                                                    <div className="flex items-center gap-3">
                                                        <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                        <span className="text-gray-700 dark:text-neutral-300">
                                                            {lesson.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {lesson.free && (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                                Gratuit
                                                            </span>
                                                        )}
                                                        <span className="text-sm text-gray-500 dark:text-neutral-400">
                                                            {lesson.duration}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg sticky top-8">
                            <div className="text-center mb-6">
                                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                    {course.price} HTG
                                </p>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">
                                    Accès à vie
                                </p>
                            </div>

                            <button
                                onClick={handleEnroll}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
                            >
                                {loading ? 'Inscription...' : 'S\'inscrire Maintenant'}
                            </button>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Accès illimité</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Certificat de complétion</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Support instructeur</span>
                                </div>
                            </div>

                            {/* Instructor */}
                            <div className="mt-6 pt-6 border-t dark:border-neutral-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                                    Instructeur
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{course.instructor.avatar}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {course.instructor.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                                            {course.instructor.bio}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
