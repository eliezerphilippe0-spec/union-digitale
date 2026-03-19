import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase'; // Assuming firebase init exports 'functions'

export const geminiService = {
    /**
     * Generates a product description
     */
    async generateProductDescription(productName, keywords, tone = 'professional') {
        try {
            const generateFn = httpsCallable(functions, 'generateAIContent');
            const result = await generateFn({
                type: 'description',
                promptData: { productName, keywords, tone }
            });
            return result.data.text;
        } catch (error) {
            console.warn("AI Backend unavailable, using SIMULATED response.");
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Return Mock Data based on Tone
            if (tone === 'excited') {
                return `🔥 DÉCOUVREZ LE NOUVEAU ${productName.toUpperCase()} ! 🔥\n\nVous cherchez ${keywords} ? Ne cherchez plus ! Ce produit est révolutionnaire. Il va changer votre quotidien grâce à sa qualité exceptionnelle et son design unique.\n\n✅ Performance incroyable\n✅ Design à couper le souffle\n✅ Satisfaction garantie\n\nCommandez le vôtre MAINTENANT avant la rupture de stock ! 🚀`;
            } else if (tone === 'creative') {
                return `Imaginez un monde où ${keywords} ne sont plus un problème. Voici le ${productName}, une symphonie d'ingénierie et d'élégance. Conçu pour les esprits exigeants, il allie forme et fonction dans une harmonie parfaite.\n\nLaissez-vous séduire par l'expérience ${productName}.`;
            } else {
                return `Voici le ${productName}, la solution idéale pour vos besoins en matière de ${keywords}.\n\nCaractéristiques Principales :\n- Conception durable\n- Efficacité maximale\n\nLe ${productName} a été rigoureusement testé. (Généré en mode Simulation)`;
            }
        }
    },

    /**
     * Generates a marketing social media post
     */
    async generateMarketingCopy(productName, platform) {
        try {
            const generateFn = httpsCallable(functions, 'generateAIContent');
            const result = await generateFn({
                type: 'marketing',
                promptData: { productName, platform }
            });
            return result.data.text;
        } catch (error) {
            console.warn("AI Backend unavailable, using SIMULATED response.");
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (platform === 'instagram') {
                return `📸 Nouveau ! Découvrez le ${productName}.\n\nLe style rencontre la performance. ✨\n\n#${productName.replace(/\s/g, '')} #Zabely #ModeSimulation`;
            } else {
                return `Découvrez notre dernier ajout : le ${productName}. Disponible dès maintenant ! (Mode Simulation)`;
            }
        }
    },

    /**
     * Smart Audit - Analyse les métadonnées d'un produit (titre, description, tags)
     * et fournit des recommandations d'expert ecommerce pour optimiser la vente
     */
    async auditProductListing({ title, description, tags, price, category }) {
        try {
            const generateFn = httpsCallable(functions, 'generateAIContent');
            const result = await generateFn({
                type: 'audit',
                promptData: { title, description, tags, price, category }
            });
            return result.data;
        } catch (error) {
            console.warn("AI Backend unavailable, using SIMULATED audit response.");
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Analyse simulée experte
            const titleLength = title?.length || 0;
            const descLength = description?.length || 0;
            const tagsCount = tags?.length || 0;

            const issues = [];
            const suggestions = [];
            let score = 100;

            // Analyse du titre
            if (titleLength < 20) {
                issues.push({ type: 'title', severity: 'high', message: 'Titre trop court - moins visible dans les recherches' });
                suggestions.push('Ajoutez des mots-clés pertinents au titre (ex: marque, caractéristique principale)');
                score -= 20;
            } else if (titleLength > 80) {
                issues.push({ type: 'title', severity: 'medium', message: 'Titre trop long - risque d\'être tronqué' });
                suggestions.push('Raccourcissez le titre à 60-80 caractères pour un affichage optimal');
                score -= 10;
            }

            // Analyse de la description
            if (descLength < 100) {
                issues.push({ type: 'description', severity: 'high', message: 'Description trop courte - manque d\'informations pour le client' });
                suggestions.push('Développez la description avec les bénéfices, caractéristiques et cas d\'usage');
                score -= 25;
            } else if (descLength < 300) {
                issues.push({ type: 'description', severity: 'medium', message: 'Description correcte mais pourrait être enrichie' });
                suggestions.push('Ajoutez des détails sur les matériaux, dimensions ou garantie');
                score -= 10;
            }

            // Analyse des tags
            if (tagsCount === 0) {
                issues.push({ type: 'tags', severity: 'high', message: 'Aucun tag - produit invisible dans les filtres' });
                suggestions.push('Ajoutez 3 à 5 tags pertinents pour améliorer la découvrabilité');
                score -= 20;
            } else if (tagsCount < 3) {
                issues.push({ type: 'tags', severity: 'medium', message: 'Peu de tags - visibilité limitée' });
                suggestions.push('Complétez avec des tags de style, usage ou saison');
                score -= 10;
            }

            // Analyse du prix
            if (!price || price <= 0) {
                issues.push({ type: 'price', severity: 'critical', message: 'Prix non défini ou invalide' });
                score -= 30;
            }

            // Détermination du grade
            let grade = 'A';
            if (score < 90) grade = 'B';
            if (score < 75) grade = 'C';
            if (score < 60) grade = 'D';
            if (score < 40) grade = 'F';

            // Génération de titre optimisé
            const optimizedTitle = titleLength < 20
                ? `${title} - Premium Quality | ${category || 'Best Seller'}`
                : title;

            // Génération de description optimisée
            const optimizedDescription = descLength < 100
                ? `${description}\n\n✅ Qualité Premium\n✅ Livraison rapide en Haïti\n✅ Satisfaction garantie\n✅ Service client réactif`
                : description;

            return {
                score: Math.max(0, score),
                grade,
                issues,
                suggestions,
                optimized: {
                    title: optimizedTitle,
                    description: optimizedDescription,
                    suggestedTags: ['bestseller', 'qualité', 'haiti', category?.toLowerCase()].filter(Boolean)
                },
                summary: score >= 75
                    ? 'Votre fiche produit est bien optimisée. Quelques ajustements mineurs pourraient améliorer vos ventes.'
                    : 'Votre fiche produit nécessite des améliorations significatives pour maximiser vos ventes.',
                isSimulated: true
            };
        }
    }
};
