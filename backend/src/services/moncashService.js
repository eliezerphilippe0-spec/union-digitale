/**
 * MonCash Payment Service
 * Official Digicel Haiti Mobile Money API
 * Docs: https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/
 */

const axios = require('axios');
const config = require('../config');

class MonCashService {
  constructor() {
    this.baseUrl = config.MONCASH_MODE === 'production'
      ? 'https://moncashbutton.digicelgroup.com/Api'
      : 'https://sandbox.moncashbutton.digicelgroup.com/Api';
    
    this.restUrl = config.MONCASH_MODE === 'production'
      ? 'https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect'
      : 'https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect';
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken() {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${config.MONCASH_CLIENT_ID}:${config.MONCASH_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        'grant_type=client_credentials&scope=read,write',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 59 minutes, refresh at 50 minutes
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('MonCash OAuth error:', error.response?.data || error.message);
      throw new Error('Impossible de se connecter à MonCash');
    }
  }

  /**
   * Create a payment
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in HTG
   * @param {string} params.orderId - Unique order reference
   * @returns {Object} Payment response with redirect URL
   */
  async createPayment({ amount, orderId }) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/CreatePayment`,
        {
          amount: amount,
          orderId: orderId,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const paymentToken = response.data.payment_token?.token;
      
      if (!paymentToken) {
        throw new Error('Token de paiement non reçu');
      }

      // Build redirect URL
      const redirectUrl = `${this.restUrl}?token=${paymentToken}`;

      return {
        success: true,
        paymentToken,
        redirectUrl,
        orderId,
        amount,
      };
    } catch (error) {
      console.error('MonCash CreatePayment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du paiement MonCash');
    }
  }

  /**
   * Get payment details by transaction ID
   * @param {string} transactionId - MonCash transaction ID
   */
  async getPaymentByTransactionId(transactionId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/RetrieveTransactionPayment`,
        { transactionId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('MonCash GetPayment error:', error.response?.data || error.message);
      throw new Error('Transaction non trouvée');
    }
  }

  /**
   * Get payment details by order ID
   * @param {string} orderId - Order reference
   */
  async getPaymentByOrderId(orderId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/RetrieveOrderPayment`,
        { orderId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('MonCash GetPaymentByOrder error:', error.response?.data || error.message);
      throw new Error('Commande non trouvée');
    }
  }

  /**
   * Transfer money to a MonCash wallet (for payouts)
   * @param {Object} params - Transfer parameters
   * @param {string} params.receiver - Receiver phone number (509XXXXXXXX)
   * @param {number} params.amount - Amount in HTG
   * @param {string} params.description - Transfer description
   */
  async transfer({ receiver, amount, description }) {
    try {
      const token = await this.getAccessToken();

      // Format phone number
      const formattedPhone = receiver.replace(/[^0-9]/g, '');
      const phone = formattedPhone.startsWith('509') 
        ? formattedPhone 
        : `509${formattedPhone}`;

      const response = await axios.post(
        `${this.baseUrl}/v1/Transfert`,
        {
          receiver: phone,
          amount: amount,
          desc: description || 'Paiement Union Digitale',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.transaction_id,
        amount,
        receiver: phone,
      };
    } catch (error) {
      console.error('MonCash Transfer error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors du transfert MonCash');
    }
  }
}

module.exports = new MonCashService();
