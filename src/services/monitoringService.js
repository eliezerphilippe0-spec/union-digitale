import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ALERT_CONFIG } from '../config/alerting';

/**
 * Union Digitale Monitoring Service
 * Tracks errors, performance metrics, and system health.
 */
class MonitoringService {
    constructor() {
        this.errorBuffer = [];
        this.metrics = {
            apiCalls: 0,
            errors: 0,
            avgLatency: 0,
            startTime: Date.now()
        };
        this.logInterval = 60000; // Sync every minute
        this.startSync();
    }

    startSync() {
        setInterval(() => {
            this.syncToCloud();
        }, this.logInterval);
    }

    /**
     * Log a system error
     * @param {Error} error 
     * @param {string} context - Where the error happened
     * @param {string} level - 'critical' | 'error' | 'warning' | 'info'
     */
    logError(error, context = 'app', level = 'error') {
        console.error(`[${level.toUpperCase()}] ${context}:`, error);

        const errorEntry = {
            message: error.message || error.toString(),
            stack: error.stack,
            context,
            level,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        this.errorBuffer.push(errorEntry);
        this.metrics.errors++;

        // Trigger immediate alert for critical errors
        if (level === 'critical') {
            this.alertAdmins(errorEntry);
            this.syncToCloud(); // Force immediate sync
        }
    }

    /**
     * Track API Performance
     * @param {string} endpoint 
     * @param {number} durationMs 
     * @param {boolean} success 
     */
    trackApiCall(endpoint, durationMs, success) {
        this.metrics.apiCalls++;
        if (!success) this.metrics.errors++;

        // Running average for latency
        const currentTotal = this.metrics.avgLatency * (this.metrics.apiCalls - 1);
        this.metrics.avgLatency = (currentTotal + durationMs) / this.metrics.apiCalls;

        // Custom Threshold Alerts
        if (durationMs > ALERT_CONFIG.thresholds.apiLatencyWarning) {
            this.logError(new Error(`Slow API detected: ${endpoint} (${durationMs}ms)`), 'performance', 'warning');
        }
    }

    async syncToCloud() {
        if (this.errorBuffer.length === 0 && this.metrics.apiCalls === 0) return;

        try {
            const batchData = {
                errors: this.errorBuffer,
                metrics: { ...this.metrics },
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, 'system_logs'), batchData);

            // Send Mock WhatsApp for specific conditions
            if (this.errorBuffer.length > 5) {
                this.mockWhatsAppAlert(`⚠️ High Error Rate Detected: ${this.errorBuffer.length} errors in last minute.`);
            }

            // Reset buffers
            this.errorBuffer = [];
            this.metrics = {
                apiCalls: 0,
                errors: 0,
                avgLatency: 0,
                startTime: Date.now()
            };
        } catch (e) {
            // Failsafe: don't loop log errors about logging
            console.warn("Failed to sync monitoring logs:", e);
        }
    }

    async mockWhatsAppAlert(message) {
        const { whatsapp } = ALERT_CONFIG;

        if (!whatsapp.enabled) return;

        console.log(`%c[WHATSAPP ALERT] To ${whatsapp.recipientPhone}: ${message}`, 'background: #25D366; color: white; padding: 4px; border-radius: 4px;');

        // Here we would fetch(whatsappUrl, payload)...
        // For now, it remains a mock as per requirements
    }

    async alertAdmins(errorEntry) {
        console.log(`%c[CRITICAL ALERT] ${errorEntry.message}`, 'background: red; color: white; font-weight: bold; padding: 4px;');

        await this.mockWhatsAppAlert(`🚨 CRITICAL: ${errorEntry.context} - ${errorEntry.message}`);

        // Send Email via Firebase Extension logic
        if (ALERT_CONFIG.email.enabled) {
            this.sendEmailAlert(errorEntry);
        }
    }

    async sendEmailAlert(errorEntry) {
        try {
            // Standard Pattern for 'Trigger Email' extension
            await addDoc(collection(db, ALERT_CONFIG.email.collection), {
                to: ALERT_CONFIG.email.to,
                message: {
                    subject: `[CRITICAL] Error in ${errorEntry.context}`,
                    text: `Error details: ${errorEntry.message}\nStack: ${errorEntry.stack}\nUser Agent: ${errorEntry.userAgent}`,
                    html: `<h1>Critical System Error</h1><p><strong>Context:</strong> ${errorEntry.context}</p><pre>${errorEntry.message}</pre>`
                }
            });
            console.log("📧 Email alert queued in Firestore 'mail' collection.");
        } catch (e) {
            console.error("Failed to queue email alert:", e);
        }
    }

    getSystemHealth() {
        const uptime = (Date.now() - this.metrics.startTime) / 1000;
        const errorRate = this.metrics.apiCalls > 0 ? (this.metrics.errors / this.metrics.apiCalls) * 100 : 0;

        return {
            status: errorRate > 5 ? 'degraded' : 'healthy',
            metrics: this.metrics,
            uptime
        };
    }
}

export const monitoringService = new MonitoringService();
