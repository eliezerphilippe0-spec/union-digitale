/**
 * Real-time Chat System
 * Enables vendor-buyer messaging
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Start or get existing conversation
 */
export const getOrCreateConversation = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { vendorId, productId } = data;

    if (!vendorId) {
      throw new HttpsError('invalid-argument', 'Vendor ID is required');
    }

    // Check if conversation exists
    const existingConv = await db
      .collection('conversations')
      .where('buyerId', '==', auth.uid)
      .where('vendorId', '==', vendorId)
      .limit(1)
      .get();

    if (!existingConv.empty) {
      const conv = existingConv.docs[0];
      return { conversationId: conv.id, ...conv.data() };
    }

    // Get user and vendor info
    const [userDoc, vendorDoc] = await Promise.all([
      db.collection('users').doc(auth.uid).get(),
      db.collection('users').doc(vendorId).get()
    ]);

    const userData = userDoc.data();
    const vendorData = vendorDoc.data();

    // Create new conversation
    const conversationData = {
      buyerId: auth.uid,
      buyerName: userData?.displayName || 'Acheteur',
      buyerPhoto: userData?.photoURL || null,
      vendorId,
      vendorName: vendorData?.storeName || vendorData?.displayName || 'Vendeur',
      vendorPhoto: vendorData?.storePhoto || vendorData?.photoURL || null,
      productId: productId || null,
      lastMessage: null,
      lastMessageAt: null,
      unreadBuyer: 0,
      unreadVendor: 0,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const convRef = await db.collection('conversations').add(conversationData);

    console.log(`💬 Conversation created: ${convRef.id}`);

    return { conversationId: convRef.id, ...conversationData };
  }
);

/**
 * Send a message
 */
export const sendMessage = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { conversationId, content, type = 'text', attachments = [] } = data;

    if (!conversationId || !content) {
      throw new HttpsError('invalid-argument', 'Conversation ID and content required');
    }

    // Get conversation
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists) {
      throw new HttpsError('not-found', 'Conversation not found');
    }

    const conv = convDoc.data();

    // Verify user is part of conversation
    if (auth.uid !== conv?.buyerId && auth.uid !== conv?.vendorId) {
      throw new HttpsError('permission-denied', 'Not part of this conversation');
    }

    const isBuyer = auth.uid === conv?.buyerId;

    // Create message
    const messageData = {
      conversationId,
      senderId: auth.uid,
      senderType: isBuyer ? 'buyer' : 'vendor',
      content,
      type,
      attachments,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const messageRef = await db.collection('messages').add(messageData);

    // Update conversation
    await db.collection('conversations').doc(conversationId).update({
      lastMessage: content.substring(0, 100),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      [isBuyer ? 'unreadVendor' : 'unreadBuyer']: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { messageId: messageRef.id };
  }
);

/**
 * Get messages for a conversation
 */
export const getMessages = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { conversationId, limit = 50 } = data;

    if (!conversationId) {
      throw new HttpsError('invalid-argument', 'Conversation ID required');
    }

    // Verify access
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists) {
      throw new HttpsError('not-found', 'Conversation not found');
    }

    const conv = convDoc.data();
    if (auth.uid !== conv?.buyerId && auth.uid !== conv?.vendorId) {
      throw new HttpsError('permission-denied', 'Not part of this conversation');
    }

    // Get messages
    const messagesSnapshot = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { messages: messages.reverse() };
  }
);

/**
 * Mark messages as read
 */
export const markMessagesRead = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { conversationId } = data;

    // Get conversation
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists) return { success: false };

    const conv = convDoc.data();
    const isBuyer = auth.uid === conv?.buyerId;

    // Mark all unread messages as read
    const unreadMessages = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .where('senderId', '!=', auth.uid)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    unreadMessages.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    // Reset unread counter
    await db.collection('conversations').doc(conversationId).update({
      [isBuyer ? 'unreadBuyer' : 'unreadVendor']: 0
    });

    return { success: true, count: unreadMessages.size };
  }
);

/**
 * Get user conversations
 */
export const getUserConversations = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    // Get conversations where user is buyer or vendor
    const [asBuyer, asVendor] = await Promise.all([
      db.collection('conversations')
        .where('buyerId', '==', auth.uid)
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .get(),
      db.collection('conversations')
        .where('vendorId', '==', auth.uid)
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .get()
    ]);

    const conversations = [
      ...asBuyer.docs.map(d => ({ id: d.id, role: 'buyer' as const, ...d.data() })),
      ...asVendor.docs.map(d => ({ id: d.id, role: 'vendor' as const, ...d.data() }))
    ].sort((a, b) => {
      const aTime = (a as any).updatedAt?.toMillis?.() || 0;
      const bTime = (b as any).updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return { conversations };
  }
);

/**
 * Send notification on new message
 */
export const onNewMessage = onDocumentCreated(
  {
    document: 'messages/{messageId}',
    region: 'us-central1'
  },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const convDoc = await db.collection('conversations').doc(message.conversationId).get();
    const conv = convDoc.data();

    // Get recipient ID
    const recipientId = message.senderType === 'buyer' ? conv?.vendorId : conv?.buyerId;

    // Get recipient's FCM token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    const recipient = recipientDoc.data();

    if (recipient?.fcmToken) {
      try {
        await admin.messaging().send({
          token: recipient.fcmToken,
          notification: {
            title: message.senderType === 'buyer'
              ? `Message de ${conv?.buyerName}`
              : `Message de ${conv?.vendorName}`,
            body: message.content.substring(0, 100)
          },
          data: {
            type: 'chat',
            conversationId: message.conversationId
          }
        });
        console.log(`📲 Push notification sent to ${recipientId}`);
      } catch (error) {
        console.error('Push notification failed:', error);
      }
    }
  }
);
