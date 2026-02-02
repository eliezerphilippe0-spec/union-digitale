import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LEGAL_BLACKLIST } from '../data/legal_blacklist';
import { monitoringService } from './monitoringService';

/**
 * Compliance Service
 * Enforces legal restrictions and content safety.
 */
class ComplianceService {
    constructor() {
        this.blacklist = LEGAL_BLACKLIST;
    }

    /**
     * Analyze a product or content for violations.
     * @param {Object} data - The content data (title, description, tags)
     * @param {Object} user - The user submitting the content
     * @returns {Object} result - { allowed: boolean, reason: string, violations: [] }
     */
    async checkContent(data, user) {
        const textToScan = `
            ${data.title || ''} 
            ${data.description || ''} 
            ${data.tags ? data.tags.join(' ') : ''}
            ${data.category || ''}
        `.toLowerCase();

        const violations = [];
        let severity = 'low';

        // 1. Scan against Blacklist categories
        for (const [key, category] of Object.entries(this.blacklist)) {
            for (const term of category.terms) {
                // Check for whole word or significant substring match
                // Using simple includes for robustness, could use regex for word boundaries
                if (textToScan.includes(term.toLowerCase())) {
                    violations.push({
                        term: term,
                        category: category.category,
                        severity: category.severity
                    });

                    if (category.severity === 'critical') severity = 'critical';
                    else if (category.severity === 'high' && severity !== 'critical') severity = 'high';
                }
            }
        }

        // 2. Decision Logic
        if (violations.length > 0) {
            // Log the attempt immediately for legal audit trail
            await this.logViolation(data, user, violations, severity);

            return {
                allowed: false,
                reason: "Contenu non conforme aux règles juridiques (Articles interdits détectés).",
                violations: violations,
                severity: severity
            };
        }

        return { allowed: true };
    }

    /**
     * Log violation to secure 'compliance_events' collection
     */
    async logViolation(data, user, violations, severity) {
        try {
            const auditEntry = {
                type: 'CONTENT_BLOCKED',
                severity: severity,
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'unknown',
                contentSummary: {
                    title: data.title,
                    price: data.price
                },
                violations: violations,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent,
                status: 'BLOCKED'
            };

            await addDoc(collection(db, 'compliance_events'), auditEntry);

            // Also trigger system alert if critical
            if (severity === 'critical') {
                monitoringService.logError(
                    new Error(`SECURITY BLOCK: User ${user?.email} attempted to post restricted items: ${violations.map(v => v.term).join(', ')}`),
                    'compliance',
                    'critical'
                );
            }
        } catch (e) {
            console.error("Failed to log compliance event:", e);
            // Critical fail: If we can't log, we should probably still block but warn admin
            monitoringService.logError(e, 'compliance_logger', 'error');
        }
    }
}

export const complianceService = new ComplianceService();
