/**
 * NatCash Payment Service
 * Natcom Haiti Mobile Money API
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class NatCashService {
  constructor() {
    this.baseUrl = config.NATCASH_MODE === 'production'
      ? 'https://api.natcash.ht/v1'
      : 'https://sandbox.natcash.ht/v1';
    
    this.merchantId = config.NATCASH_MERCHANT_ID;
    this.secretKey = config.NATCASH_SECRET_KEY;
  }

  /**
   * Generate signature for API requests
   */
  generateSignature(data) {
    const payload = JSON.stringify(data) + this.secretKey;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Create a payment request
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in HTG
   * @param {string} params.orderId - Unique order reference
   * @param {string} params.customerPhone - Customer phone number
   * @param {string} params.description - Payment description
   */
  async createPayment({ amount, orderId, customerPhone, description }) {
    try {
      const data = {
        merchantId: this.merchantId,
        orderId: orderId,
        amount: amount,
        currency: 'HTG',
        customerPhone: this.formatPhone(customerPhone),
        description: description || `Commande ${orderId}`,
        callbackUrl: `${config.BACKEND_URL}/api/payments/callback/natcash`,
        returnUrl: `${config.FRONTEND_URL}/order-confirmation`,
        timestamp: Date.now(),
      };

      const signature = this.generateSignature(data);

      const response = await axios.post(
        `${this.baseUrl}/payment/create`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
            'X-Signature': signature,
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          paymentId: response.data.paymentId,
          ussdCode: response.data.ussdCode, // *202*XXX# format
          qrCode: response.data.qrCode,
          expiresAt: response.data.expiresAt,
          instructions: `Composez ${response.data.ussdCode} sur votre téléphone Natcom pour payer`,
        };
      } else {
        throw new Error(response.data.message || 'Erreur NatCash');
      }
    } catch (error) {
      console.error('NatCash CreatePayment error:', error.response?.data || error.message);
      
      // Fallback to manual payment flow
      return this.createManualPayment({ amount, orderId, description });
    }
  }

  /**
   * Manual payment flow (when API is unavailable)
   * Customer sends money to merchant number
   */
  createManualPayment({ amount, orderId, description }) {
    const merchantNumber = config.NATCASH_MERCHANT_NUMBER || '4040-0000';
    
    return {
      success: true,
      isManual: true,
      merchantNumber,
      amount,
      reference: orderId,
      instructions: [
        `1. Ouvrez NatCash sur votre téléphone`,
        `2. Sélectionnez "Envoyer de l'argent"`,
        `3. Entrez le numéro: ${merchantNumber}`,
        `4. Montant: ${amount.toLocaleString()} HTG`,
        `5. Référence: ${orderId}`,
        `6. Confirmez le paiement`,
      ],
      note: 'Votre commande sera confirmée après vérification du paiement (2-5 minutes)',
    };
  }

  /**
   * Check payment status
   * @param {string} paymentId - NatCash payment ID
   */
  async getPaymentStatus(paymentId) {
    try {
      const data = {
        merchantId: this.merchantId,
        paymentId: paymentId,
        timestamp: Date.now(),
      };

      const signature = this.generateSignature(data);

      const response = await axios.get(
        `${this.baseUrl}/payment/status/${paymentId}`,
        {
          headers: {
            'X-Merchant-Id': this.merchantId,
            'X-Signature': signature,
          },
        }
      );

      return {
        success: true,
        status: response.data.status, // pending, completed, failed, expired
        transactionId: response.data.transactionId,
        paidAt: response.data.paidAt,
      };
    } catch (error) {
      console.error('NatCash GetStatus error:', error.response?.data || error.message);
      throw new Error('Impossible de vérifier le statut du paiement');
    }
  }

  /**
   * Verify webhook callback
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Signature from headers
   */
  verifyWebhook(payload, signature) {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Transfer money to a NatCash wallet (for payouts)
   * @param {Object} params - Transfer parameters
   */
  async transfer({ receiver, amount, description }) {
    try {
      const data = {
        merchantId: this.merchantId,
        receiver: this.formatPhone(receiver),
        amount: amount,
        currency: 'HTG',
        description: description || 'Paiement Union Digitale',
        timestamp: Date.now(),
      };

      const signature = this.generateSignature(data);

      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
            'X-Signature': signature,
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
        amount,
        receiver: data.receiver,
      };
    } catch (error) {
      console.error('NatCash Transfer error:', error.response?.data || error.message);
      throw new Error('Erreur lors du transfert NatCash');
    }
  }

  /**
   * Format phone number to NatCash format
   */
  formatPhone(phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('509')) {
      return cleaned;
    }
    return `509${cleaned}`;
  }
}

module.exports = new NatCashService();
