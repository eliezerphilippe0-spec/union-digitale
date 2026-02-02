/**
 * MODERATION SERVICE
 * Automatic content moderation for reviews and user-generated content
 */

/**
 * List of spam keywords (French and Creole)
 */
const SPAM_KEYWORDS = [
    'viagra', 'casino', 'lottery', 'lotri', 'loto',
    'click here', 'klike la', 'buy now', 'achte kounye a',
    'limited offer', 'òf limite', 'act now', 'aji kounye a',
    'free money', 'lajan gratis', 'win cash', 'genyen lajan',
    'guaranteed', 'garanti 100%', 'miracle', 'mirak',
    'lose weight fast', 'pèdi pwa rapid', 'get rich', 'vin rich',
    'work from home', 'travay lakay', 'make money online',
    'bitcoin', 'cryptocurrency', 'kriptomone', 'invest now',
    'limited time', 'tan limite', 'exclusive deal', 'òf ekskizif',
    'congratulations', 'felisitasyon', 'you won', 'ou genyen',
    'claim your prize', 'reklame pri w', 'urgent', 'ijan',
    'call now', 'rele kounye a', 'text me', 'voye mesaj',
    'whatsapp me', 'kontakte m', 'dm me', 'ekri m'
];

/**
 * List of inappropriate words (French and Creole)
 * Note: This is a minimal list for demonstration
 */
const INAPPROPRIATE_WORDS = [
    // Add inappropriate words here
    // This should be maintained separately and securely
    'merde', 'putain', 'connard', 'salope',
    // Creole equivalents
    'kaka', 'bouzen'
    // Add more as needed
];

/**
 * Patterns that indicate potential spam
 */
const SPAM_PATTERNS = [
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /https?:\/\//gi, // URLs
    /www\./gi, // Web addresses
    /@\w+/g, // Social media handles
    /\b[A-Z]{5,}\b/g, // ALL CAPS words (5+ chars)
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /\$\d+/g, // Money amounts
    /\d+%/g, // Percentages (often in spam)
];

/**
 * Check if text contains spam
 */
const containsSpam = (text) => {
    const lowerText = text.toLowerCase();

    // Check for spam keywords
    const hasSpamKeywords = SPAM_KEYWORDS.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
    );

    if (hasSpamKeywords) return true;

    // Check for spam patterns
    const hasSpamPatterns = SPAM_PATTERNS.some(pattern =>
        pattern.test(text)
    );

    return hasSpamPatterns;
};

/**
 * Check if text contains inappropriate language
 */
const containsInappropriateLanguage = (text) => {
    const lowerText = text.toLowerCase();

    return INAPPROPRIATE_WORDS.some(word => {
        // Use word boundaries to avoid false positives
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
};

/**
 * Check for excessive capitalization
 */
const hasExcessiveCaps = (text) => {
    if (text.length < 20) return false;

    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / text.length;

    // More than 50% caps is suspicious
    return capsRatio > 0.5;
};

/**
 * Check for excessive punctuation
 */
const hasExcessivePunctuation = (text) => {
    const punctuationCount = (text.match(/[!?]{2,}/g) || []).length;
    return punctuationCount > 3;
};

/**
 * Check for repetitive content
 */
const hasRepetitiveContent = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    // If less than 30% unique words, it's repetitive
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
        return true;
    }

    return false;
};

/**
 * Calculate content quality score (0-100)
 */
const calculateQualityScore = (text) => {
    let score = 100;

    // Deduct for short content
    if (text.length < 50) score -= 20;

    // Deduct for excessive caps
    if (hasExcessiveCaps(text)) score -= 15;

    // Deduct for excessive punctuation
    if (hasExcessivePunctuation(text)) score -= 10;

    // Deduct for repetitive content
    if (hasRepetitiveContent(text)) score -= 25;

    // Deduct for spam indicators
    if (containsSpam(text)) score -= 40;

    // Deduct for inappropriate language
    if (containsInappropriateLanguage(text)) score -= 50;

    return Math.max(0, score);
};

/**
 * Main moderation function
 */
export const moderateContent = (text) => {
    const flags = [];
    let autoApprove = true;

    // Check for spam
    if (containsSpam(text)) {
        flags.push('spam');
        autoApprove = false;
    }

    // Check for inappropriate language
    if (containsInappropriateLanguage(text)) {
        flags.push('inappropriate_language');
        autoApprove = false;
    }

    // Check for excessive caps
    if (hasExcessiveCaps(text)) {
        flags.push('excessive_caps');
        // Don't auto-reject, just flag
    }

    // Check for excessive punctuation
    if (hasExcessivePunctuation(text)) {
        flags.push('excessive_punctuation');
    }

    // Check for repetitive content
    if (hasRepetitiveContent(text)) {
        flags.push('repetitive');
        autoApprove = false;
    }

    // Calculate quality score
    const qualityScore = calculateQualityScore(text);

    // Auto-reject if quality score is too low
    if (qualityScore < 40) {
        autoApprove = false;
        flags.push('low_quality');
    }

    return {
        autoApprove,
        flags,
        qualityScore,
        needsReview: flags.length > 0
    };
};

/**
 * Moderate review specifically
 */
export const moderateReview = (review) => {
    const titleModeration = moderateContent(review.title);
    const contentModeration = moderateContent(review.content);

    const allFlags = [
        ...titleModeration.flags,
        ...contentModeration.flags
    ];

    const autoApprove = titleModeration.autoApprove &&
        contentModeration.autoApprove &&
        review.rating >= 1 &&
        review.rating <= 5;

    const averageQuality = (titleModeration.qualityScore + contentModeration.qualityScore) / 2;

    return {
        autoApprove,
        flags: [...new Set(allFlags)], // Remove duplicates
        qualityScore: averageQuality,
        needsReview: allFlags.length > 0 || !autoApprove
    };
};

/**
 * Check if user has suspicious behavior
 */
export const checkUserBehavior = async (userId) => {
    // This would check:
    // - Number of reviews posted in short time
    // - Pattern of all 5-star or all 1-star reviews
    // - Reviews on products from same seller
    // - Account age

    // For now, return a simple check
    return {
        suspicious: false,
        reason: null
    };
};

/**
 * Filter and clean text
 */
export const cleanText = (text) => {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Remove excessive punctuation
    cleaned = cleaned.replace(/([!?]){3,}/g, '$1$1');

    // Normalize quotes
    cleaned = cleaned.replace(/[""]/g, '"');
    cleaned = cleaned.replace(/['']/g, "'");

    return cleaned;
};

/**
 * Get moderation statistics
 */
export const getModerationStats = (reviews) => {
    const total = reviews.length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;

    const flagged = reviews.filter(r => r.moderationFlags?.length > 0).length;

    return {
        total,
        approved,
        pending,
        rejected,
        flagged,
        approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : 0
    };
};

export default {
    moderateContent,
    moderateReview,
    checkUserBehavior,
    cleanText,
    getModerationStats,
    containsSpam,
    containsInappropriateLanguage
};
