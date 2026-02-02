import { db } from '../lib/firebase.js'; // Ensure this path works for Node execution or adjust text
// Note: Normally we'd use firebase-admin for seeding script, but for client-side app consistency we might use client SDK if authenticated.
// However, since this is 'seed', let's assume it's running in Node.
// IF running via `node scripts/seed_policies.js`, it needs "type": "module" in package.json and working firebase imports.
// To avoid "process is not defined" issues in browser, this stays in scripts/.

// Since we had issues with import in Node before, we will structure this as a file that CAN be run if environment is set up, 
// OR we can export a function to be run from the specific "Admin > Settings" page for "Deploy Policies".
// Let's make it a dual-purpose file: Export data for Client, and have a function we can trigger from the Admin Dashboard.

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { OFFICIAL_POLICIES } from '../data/legal/official_policies.js';

export const deployPoliciesToFirestore = async () => {
    console.log("🚀 Starting Policy Deployment...");
    const timestamp = new Date(); // Use client-side timestamp to avoid SDK issues

    try {
        // 1. Deploy Main Policies
        try {
            console.log("Deploying Main Policies...", OFFICIAL_POLICIES.policies);
            await setDoc(doc(db, 'platform_policies', 'main'), {
                ...OFFICIAL_POLICIES.policies,
                updatedAt: timestamp
            });
            console.log("✅ Main Policies Deployed.");
        } catch (err) {
            console.error("❌ Failed to deploy Main Policies:", err);
            throw new Error("Main Policies: " + err.message);
        }

        // 2. Deploy Restrictions
        try {
            console.log("Deploying Restrictions...", OFFICIAL_POLICIES.restricted_categories);
            await setDoc(doc(db, 'platform_policies', 'restrictions'), {
                ...OFFICIAL_POLICIES.restricted_categories,
                updatedAt: timestamp
            });
            console.log("✅ Restrictions Deployed.");
        } catch (err) {
            console.error("❌ Failed to deploy Restrictions:", err);
            throw new Error("Restrictions: " + err.message);
        }

        // 3. Deploy Compliance
        try {
            console.log("Deploying Compliance...", OFFICIAL_POLICIES.compliance_engine);
            await setDoc(doc(db, 'platform_policies', 'compliance'), {
                ...OFFICIAL_POLICIES.compliance_engine,
                updatedAt: timestamp
            });
            console.log("✅ Compliance Deployed.");
        } catch (err) {
            console.error("❌ Failed to deploy Compliance:", err);
            throw new Error("Compliance: " + err.message);
        }

        return true;
    } catch (error) {
        console.error("🚨 Critical Deployment Error:", error);
        throw error;
    }
};
