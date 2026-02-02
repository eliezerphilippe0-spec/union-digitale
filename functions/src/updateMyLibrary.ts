import * as admin from "firebase-admin";

const db = admin.firestore();

export async function updateMyLibrary(userId: string, items: any[]) {
    const batch = db.batch();
    const libraryRef = db.collection('users').doc(userId).collection('library');

    items.forEach(item => {
        if (item.type === 'digital') {
            // Check if already exists to avoid overwrites or duplicates if needed
            // For batch simplicity, we just set a new doc or overwrite based on productId
            const itemRef = libraryRef.doc(item.productId);
            batch.set(itemRef, {
                productId: item.productId,
                title: item.title,
                purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Copy fileIds from product definition if not in item
                // This might require a product lookup if item doesn't have details
            }, { merge: true });
        }
    });

    await batch.commit();
    console.log(`Updated library for user ${userId} with ${items.length} items.`);
}
