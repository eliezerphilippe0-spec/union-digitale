import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Star, Users, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import SEO from '../../components/common/SEO';

const LearnCatalog = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Sample courses data
    const sampleCourses = [
        {
            id: '1',
            title: 'Programmation Web avec React',
            description: 'Apprenez à créer des applications web modernes',
            instructor: { name: 'Jean Baptiste', avatar: '👨‍💻' },
            category: 'tech',
            level: 'intermediate',
            language: 'fr',
            price: 2500,
            thumbnail: '💻',
            rating: 4.8,
            studentsCount: 245,
            duration: '12h'
        },
        {
            id: '2',
            title: 'Créole Haïtien pour Débutants',
            description: 'Maîtrisez les bases du créole haïtien',
            instructor: { name: 'Marie Carmel', avatar: '👩‍🏫' },
            category: 'languages',
            level: 'beginner',
            language: 'fr',
            price: 1500,
            thumbnail: '🗣️',
            rating: 4.9,
            studentsCount: 432,
            duration: '8h'
        },
        {
            id: '3',
            title: 'Entrepreneuriat en Haïti',
            description: 'Lancez votre business avec succès',
            instructor: { name: 'Pierre Louis', avatar: '👔' },
            category: 'business',
            level: 'beginner',
            language: 'fr',
            price: 3000,
            thumbnail: '💼',
            rating: 4.7,
            studentsCount: 189,
            duration: '10h'
        },
        {
            id: '4',
            title: 'Couture et Mode',
            description: 'Techniques de couture professionnelle',
            instructor: { name: 'Nadège Joseph', avatar: '👗' },
            category: 'artisanat',
            level: 'intermediate',
            language: 'fr',
            price: 2000,
            thumbnail: '✂️',
            rating: 4.6,
            studentsCount: 156,
            duration: '15h'
        }
    ];

    useEffect(() => {
        setCourses(sampleCourses);
        setLoading(false);
    }, []);

    const categories = [
        { id: 'all', name: 'Tous' },
        { id: 'tech', name: 'Tech' },
        { id: 'languages', name: 'Langues' },
        { id: 'business', name: 'Business' },
        { id: 'artisanat', name: 'Artisanat' }
    ];

    const filteredCourses = courses.filter(course => {
        const matchesFilter = filter === 'all' || course.category === filter;
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <SEO title="Union Learn" description="Formations et cours pour développer vos compétences." />
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        📚 Union Learn
                    </h1>
                    <p className="text-gray-600 dark:text-neutral-300">
                        Développez vos compétences avec des cours de qualité
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher un cours..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${filter === cat.id
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-neutral-700'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/learn/course/${course.id}`)}
                                className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            >
                                {/* Thumbnail */}
                                <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-6xl">
                                    {course.thumbnail}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 line-clamp-2">
                                        {course.description}
                                    </p>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-2xl">{course.instructor.avatar}</span>
                                        <span className="text-sm text-gray-700 dark:text-neutral-300">
                                            {course.instructor.name}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span>{course.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{course.studentsCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{course.duration}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between pt-4 border-t dark:border-neutral-700">
                                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {course.price} HTG
                                        </span>
                                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                            Voir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredCourses.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Aucun cours trouvé
                        </h3>
                        <p className="text-gray-500 dark:text-neutral-400">
                            Essayez une autre recherche ou catégorie
                        </p>
                    </div>
                )}

                {/* CTA for instructors */}
                <div className="mt-8 text-center">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Vous voulez enseigner ?
                        </h3>
                        <p className="text-gray-600 dark:text-neutral-300 mb-4">
                            Partagez vos connaissances et gagnez de l'argent
                        </p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                            Fonctionnalité bientôt disponible
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnCatalog;
