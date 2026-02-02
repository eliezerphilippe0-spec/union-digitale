/**
 * Union Digitale - Legal Blacklist
 * 
 * Comprehensive list of prohibited terms and patterns based on Haitian Law.
 * Languages: FR, HT, EN, ES
 */

export const LEGAL_BLACKLIST = {
    // 1. Weapons & Dangerous Items (Armes et munitions)
    weapons: {
        severity: 'critical',
        category: 'WEAPONS_VIOLATION',
        terms: [
            // French
            'fusil', 'pistolet', 'mitraillette', 'balle réelle', 'munition', 'explosif', 'grenade', 'arme à feu', 'silencieux arme',
            // Creole
            'zam', 'boun', 'kanon', 'katouch', 'revòlve', 'mitrayèt', 'kout zam', 'bal',
            // English
            'gun', 'rifle', 'pistol', 'ammo', 'ammunition', 'explosive', 'firearm', 'silencer', 'glock', 'ak47', 'ar15',
            // Spanish
            'arma', 'pistola', 'rifle', 'municion', 'explosivo', 'bala'
        ]
    },

    // 2. Drugs & Narcotics (Drogues et stupéfiants)
    drugs: {
        severity: 'critical',
        category: 'DRUGS_VIOLATION',
        terms: [
            // French
            'cocaïne', 'héroïne', 'cannabis', 'marijuana', 'weed', 'extasy', 'lsd', 'méthamphétamine', 'drogue', 'stupéfiant',
            // Creole
            'kokayin', 'dwòg', 'mariwana', 'bwa', 'poud', 'krak',
            // English
            'cocaine', 'heroin', 'meth', 'weed', 'drug', 'narcotic',
            // Spanish
            'cocaina', 'heroina', 'droga', 'marihuana'
        ]
    },

    // 3. Fraud & Illegal Documents (Fraude et faux documents)
    fraud: {
        severity: 'high',
        category: 'FRAUD_VIOLATION',
        terms: [
            // French
            'faux passeport', 'faux visa', 'fausse carte', 'permis falsifié', 'faux diplôme', 'carte clonée',
            // Creole
            'fo papye', 'fo viza', 'fo paspò', 'fo kat',
            // English
            'fake id', 'fake passport', 'fake visa', 'cloned card', 'stolen card',
            // Spanish
            'falso pasaporte', 'falsa visa'
        ]
    },

    // 4. Violence & Hate Speech (Violence et haine)
    violence: {
        severity: 'high',
        category: 'VIOLENCE_VIOLATION',
        terms: [
            // French
            'tueur à gages', 'assassinat', 'poison mortel', 'torture',
            // Creole
            'touye moun', 'pwazon',
            // English
            'hitman', 'kill contract', 'lethal poison',
            // Spanish
            'asesino', 'veneno mortal'
        ]
    }
};

/**
 * Regex patterns for stricter detection (e.g. credit card numbers pattern if needed)
 */
export const RISK_PATTERNS = {
    // Basic pattern for potential credit card leak or format (simplified)
    creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b/
};
