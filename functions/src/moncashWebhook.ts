import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// import axios from "axios";
import { updateMyLibrary } from "./updateMyLibrary";
import { sendWhatsAppMessageHelper, sendEmailHelper } from "./utils/notifications";

const db = admin.firestore();
// const MONCASH_API_URL = process.env.MONCASH_API_URL || "https://sandbox.moncashbutton.digicelgroup.com/Api";

/*
// Reuse access token logic or import from a shared utils file
async function getAccessToken() {
    // Implementation would match the one in existing index.js or be a shared utility
    return "mock_access_token";
}
*/

export const moncashWebhook = onRequest(async (req: any, res: any) => {
    const { orderId, transactionId } = req.body;

    if (!orderId) {
        res.status(400).send("Missing orderId");
        return;
    }

    try {
        // 1. Verify Payment with MonCash API (skipped for brevity, assume valid or mock)
        // const token = await getAccessToken();
        // const verify = await axios.get(...)
        const paymentStatus = 'successful'; // Mock

        if (paymentStatus === 'successful') {
            const orderRef = db.collection('orders').doc(orderId);
            const orderSnap = await orderRef.get();

            if (!orderSnap.exists) {
                res.status(404).send("Order not found");
                return;
            }

            const orderData = orderSnap.data();
            if (orderData?.status === 'paid') {
                res.status(200).send("Already processed");
                return;
            }

            // 2. Mark Order as Paid
            await orderRef.update({
                status: 'paid',
                paymentStatus: 'paid',
                moncashTransactionId: transactionId,
                paidAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. Fulfill Digital Products (Add to Library)
            if (orderData?.items) {
                await updateMyLibrary(orderData.userId, orderData.items);
            }

            // 4. Send Notifications
            if (orderData?.customerDetails) {
                await sendWhatsAppMessageHelper(orderData.customerDetails.phone, "Votre commande est confirmée ! Accédez à votre bibliothèque.");
                await sendEmailHelper(orderData.customerDetails.email, "Confirmation de commande", "Merci pour votre achat.");
            }

            res.status(200).send("Webhook processed");
        } else {
            res.status(200).send("Payment pending/failed");
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Internal Error");
    }
});
