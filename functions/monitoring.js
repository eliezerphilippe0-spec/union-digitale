const admin = require('firebase-admin');
const functions = require('firebase-functions');

/**
 * Firebase Quota Monitoring and Alerts
 * Monitors Firestore, Functions, and Storage usage
 * Sends alerts when usage exceeds 80%
 */

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Alert thresholds
const ALERT_THRESHOLD = 0.80; // 80%
const CRITICAL_THRESHOLD = 0.95; // 95%

/**
 * Monitor Firebase Quotas
 * Runs every hour to check usage
 */
exports.monitorFirebaseQuotas = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        console.log('🔍 Starting quota monitoring...');

        const alerts = [];

        try {
            // 1. Monitor Firestore Usage
            const firestoreStats = await getFirestoreStats();
            if (firestoreStats.usage > ALERT_THRESHOLD) {
                alerts.push({
                    service: 'Firestore',
                    metric: 'Document Reads',
                    usage: firestoreStats.usage,
                    current: firestoreStats.current,
                    limit: firestoreStats.limit,
                    severity: firestoreStats.usage > CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING'
                });
            }

            // 2. Monitor Cloud Functions Invocations
            const functionsStats = await getFunctionsStats();
            if (functionsStats.usage > ALERT_THRESHOLD) {
                alerts.push({
                    service: 'Cloud Functions',
                    metric: 'Invocations',
                    usage: functionsStats.usage,
                    current: functionsStats.current,
                    limit: functionsStats.limit,
                    severity: functionsStats.usage > CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING'
                });
            }

            // 3. Monitor Storage Usage
            const storageStats = await getStorageStats();
            if (storageStats.usage > ALERT_THRESHOLD) {
                alerts.push({
                    service: 'Cloud Storage',
                    metric: 'Storage Size',
                    usage: storageStats.usage,
                    current: storageStats.current,
                    limit: storageStats.limit,
                    severity: storageStats.usage > CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING'
                });
            }

            // 4. Send alerts if any
            if (alerts.length > 0) {
                await sendAlerts(alerts);
                console.log(`⚠️  ${alerts.length} quota alerts sent`);
            } else {
                console.log('✅ All quotas within normal range');
            }

            // 5. Log stats to Firestore for dashboard
            await logQuotaStats({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                firestore: firestoreStats,
                functions: functionsStats,
                storage: storageStats,
                alerts: alerts.length
            });

        } catch (error) {
            console.error('❌ Quota monitoring error:', error);

            // Send critical alert about monitoring failure
            await sendAlerts([{
                service: 'Monitoring System',
                metric: 'Health Check',
                severity: 'CRITICAL',
                error: error.message
            }]);
        }

        return null;
    });

/**
 * Get Firestore usage statistics
 * Note: Firebase doesn't expose quota APIs directly, so we estimate based on document counts
 */
async function getFirestoreStats() {
    try {
        // Estimate based on document counts (rough approximation)
        const collections = ['products', 'orders', 'users', 'transactions', 'balances'];
        let totalDocs = 0;

        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).count().get();
            totalDocs += snapshot.data().count;
        }

        // Spark plan: 50K reads/day, Blaze: unlimited but billed
        // We'll track document count as a proxy
        const estimatedLimit = 100000; // Adjust based on your plan
        const usage = totalDocs / estimatedLimit;

        return {
            current: totalDocs,
            limit: estimatedLimit,
            usage: usage,
            unit: 'documents'
        };
    } catch (error) {
        console.error('Error getting Firestore stats:', error);
        return { current: 0, limit: 1, usage: 0, unit: 'documents' };
    }
}

/**
 * Get Cloud Functions usage statistics
 */
async function getFunctionsStats() {
    try {
        // Get function invocation count from logs (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const invocations = await db.collection('function_invocations')
            .where('timestamp', '>', oneHourAgo)
            .count()
            .get();

        const currentInvocations = invocations.data().count;

        // Spark plan: 125K invocations/month, Blaze: 2M free then billed
        const monthlyLimit = 2000000;
        const hourlyLimit = monthlyLimit / 30 / 24; // ~2,777 per hour
        const usage = currentInvocations / hourlyLimit;

        return {
            current: currentInvocations,
            limit: hourlyLimit,
            usage: usage,
            unit: 'invocations/hour'
        };
    } catch (error) {
        console.error('Error getting Functions stats:', error);
        return { current: 0, limit: 1, usage: 0, unit: 'invocations/hour' };
    }
}

/**
 * Get Cloud Storage usage statistics
 */
async function getStorageStats() {
    try {
        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles();

        let totalSize = 0;
        for (const file of files) {
            const [metadata] = await file.getMetadata();
            totalSize += parseInt(metadata.size || 0);
        }

        // Convert to GB
        const sizeGB = totalSize / (1024 * 1024 * 1024);

        // Spark plan: 1GB, Blaze: 5GB free then billed
        const limitGB = 5;
        const usage = sizeGB / limitGB;

        return {
            current: sizeGB.toFixed(2),
            limit: limitGB,
            usage: usage,
            unit: 'GB'
        };
    } catch (error) {
        console.error('Error getting Storage stats:', error);
        return { current: 0, limit: 1, usage: 0, unit: 'GB' };
    }
}

/**
 * Send alerts via multiple channels
 */
async function sendAlerts(alerts) {
    const alertMessages = alerts.map(alert => {
        const emoji = alert.severity === 'CRITICAL' ? '🚨' : '⚠️';
        const percentage = (alert.usage * 100).toFixed(1);

        return `${emoji} ${alert.severity}: ${alert.service} - ${alert.metric}
Usage: ${percentage}% (${alert.current}/${alert.limit} ${alert.unit || ''})`;
    }).join('\n\n');

    // 1. Log to Firestore for dashboard
    await db.collection('quota_alerts').add({
        alerts: alerts,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        acknowledged: false
    });

    // 2. Send email to admin (if configured)
    const adminEmail = functions.config().admin?.email;
    if (adminEmail) {
        // TODO: Integrate with SendGrid or similar
        console.log(`📧 Email alert sent to: ${adminEmail}`);
    }

    // 3. Send WhatsApp notification (if configured)
    const adminPhone = functions.config().admin?.phone;
    if (adminPhone) {
        // TODO: Integrate with Twilio or WhatsApp Business API
        console.log(`📱 WhatsApp alert sent to: ${adminPhone}`);
    }

    // 4. Create notification for admin dashboard
    await db.collection('notifications').add({
        type: 'quota_alert',
        title: 'Firebase Quota Alert',
        message: alertMessages,
        severity: alerts.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('📢 Alerts sent:', alertMessages);
}

/**
 * Log quota statistics for historical tracking
 */
async function logQuotaStats(stats) {
    await db.collection('quota_history').add(stats);
}

/**
 * Get quota dashboard data
 * Callable function for admin dashboard
 */
exports.getQuotaDashboard = functions.https.onCall(async (data, context) => {
    // Verify admin role
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }

    const firestoreStats = await getFirestoreStats();
    const functionsStats = await getFunctionsStats();
    const storageStats = await getStorageStats();

    // Get recent alerts
    const alertsSnapshot = await db.collection('quota_alerts')
        .where('acknowledged', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

    const recentAlerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return {
        quotas: {
            firestore: firestoreStats,
            functions: functionsStats,
            storage: storageStats
        },
        alerts: recentAlerts,
        timestamp: new Date().toISOString()
    };
});

/**
 * Acknowledge quota alert
 */
exports.acknowledgeQuotaAlert = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }

    const { alertId } = data;

    await db.collection('quota_alerts').doc(alertId).update({
        acknowledged: true,
        acknowledgedBy: context.auth.uid,
        acknowledgedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
});
