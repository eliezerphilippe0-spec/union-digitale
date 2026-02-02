import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const storage = admin.storage();
const db = admin.firestore();

interface GenerateLinkRequest {
    fileId: string;
    productId: string;
    orderId?: string;
}

export const generateDownloadLinks = onCall(
    { region: 'us-central1' },
    async (request) => {
        const { fileId, productId, orderId } = request.data as GenerateLinkRequest;
        const uid = request.auth?.uid;

        if (!uid) {
            throw new HttpsError('unauthenticated', 'Vous devez être connecté');
        }

        if (!productId && !fileId) {
            throw new HttpsError('invalid-argument', 'Product ID ou File ID requis');
        }

        console.log(`📥 Download request: user=${uid}, product=${productId}, file=${fileId}`);

        // 1. Verify Ownership - Multiple methods
        let hasAccess = false;

        // Method 1: Check user's library subcollection
        const libraryRef = db.collection('users').doc(uid).collection('library');
        const libraryCheck = await libraryRef.where('productId', '==', productId).limit(1).get();

        if (!libraryCheck.empty) {
            hasAccess = true;
            console.log(`✅ Access via library`);
        }

        // Method 2: Check paid orders containing this product
        if (!hasAccess) {
            const ordersQuery = await db.collection('orders')
                .where('userId', '==', uid)
                .where('status', 'in', ['paid', 'completed', 'delivered'])
                .get();

            for (const orderDoc of ordersQuery.docs) {
                const order = orderDoc.data();
                const hasProduct = order.items?.some((item: any) =>
                    item.productId === productId ||
                    item.id === productId ||
                    String(item.productId) === String(productId)
                );

                if (hasProduct) {
                    hasAccess = true;
                    console.log(`✅ Access via order ${orderDoc.id}`);
                    break;
                }
            }
        }

        // Method 3: If orderId provided, check specific order
        if (!hasAccess && orderId) {
            const orderDoc = await db.collection('orders').doc(orderId).get();
            if (orderDoc.exists) {
                const order = orderDoc.data();
                if (order?.userId === uid && ['paid', 'completed', 'delivered'].includes(order.status)) {
                    const hasProduct = order.items?.some((item: any) =>
                        item.productId === productId || item.id === productId
                    );
                    if (hasProduct) {
                        hasAccess = true;
                        console.log(`✅ Access via specific order ${orderId}`);
                    }
                }
            }
        }

        if (!hasAccess) {
            console.warn(`❌ Access denied for user ${uid} to product ${productId}`);
            throw new HttpsError('permission-denied', 'Vous n\'avez pas accès à ce produit');
        }

        // 2. Get File Path
        let filePath: string | null = null;

        // Try digital_files collection first
        if (fileId) {
            const fileDoc = await db.collection('digital_files').doc(fileId).get();
            if (fileDoc.exists) {
                filePath = fileDoc.data()?.storagePath;
            }
        }

        // Try product's digitalFile field
        if (!filePath && productId) {
            const productDoc = await db.collection('products').doc(productId).get();
            if (productDoc.exists) {
                const product = productDoc.data();
                filePath = product?.digitalFilePath || product?.filePath || product?.downloadUrl;
            }
        }

        // Try digital_products collection
        if (!filePath && productId) {
            const digitalProductDoc = await db.collection('digital_products').doc(productId).get();
            if (digitalProductDoc.exists) {
                filePath = digitalProductDoc.data()?.filePath;
            }
        }

        if (!filePath) {
            console.error(`❌ No file path found for product ${productId}`);
            throw new HttpsError('not-found', 'Fichier non trouvé. Contactez le support.');
        }

        // 3. Generate Signed URL
        try {
            const bucket = storage.bucket();
            const file = bucket.file(filePath);

            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                console.error(`❌ File does not exist in storage: ${filePath}`);
                throw new HttpsError('not-found', 'Fichier non disponible');
            }

            const expiresAt = Date.now() + 1000 * 60 * 60 * 2; // 2 hours

            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: expiresAt,
            });

            console.log(`✅ Signed URL generated for ${filePath}`);

            // Log download for analytics
            await db.collection('download_logs').add({
                userId: uid,
                productId,
                fileId: fileId || null,
                filePath,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(expiresAt)
            });

            return {
                url,
                expiresAt,
                fileName: filePath.split('/').pop()
            };
        } catch (error: any) {
            console.error("Signed URL Error:", error);

            if (error.code === 'storage/object-not-found') {
                throw new HttpsError('not-found', 'Fichier non disponible');
            }

            throw new HttpsError('internal', 'Erreur lors de la génération du lien');
        }
    }
);
