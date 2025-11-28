// PhonePe Payment Gateway Helper Functions
import CryptoJS from 'crypto-js';

// Configuration
const PHONEPE_CONFIG = {
    merchantId: process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    mode: process.env.PHONEPE_MODE || 'UAT', // UAT or PRODUCTION
};

// API URLs
const PHONEPE_URLS = {
    UAT: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    PRODUCTION: 'https://api.phonepe.com/apis/hermes',
};

const getBaseUrl = () => {
    return PHONEPE_CONFIG.mode === 'PRODUCTION'
        ? PHONEPE_URLS.PRODUCTION
        : PHONEPE_URLS.UAT;
};

/**
 * Generate SHA256 checksum for PhonePe API
 * @param {string} payload - Base64 encoded payload
 * @returns {string} - SHA256 hash
 */
export const generateChecksum = (payload) => {
    const string = payload + '/pg/v1/pay' + PHONEPE_CONFIG.saltKey;
    const sha256 = CryptoJS.SHA256(string);
    return sha256.toString(CryptoJS.enc.Hex) + '###' + PHONEPE_CONFIG.saltIndex;
};

/**
 * Verify webhook checksum
 * @param {string} receivedChecksum - Checksum from PhonePe
 * @param {string} payload - Response payload
 * @returns {boolean} - Is valid
 */
export const verifyWebhookChecksum = (receivedChecksum, payload) => {
    const string = payload + PHONEPE_CONFIG.saltKey;
    const sha256 = CryptoJS.SHA256(string);
    const calculatedChecksum = sha256.toString(CryptoJS.enc.Hex);

    // Extract checksum without salt index
    const checksumWithoutIndex = receivedChecksum.split('###')[0];

    return calculatedChecksum === checksumWithoutIndex;
};

/**
 * Create payment payload
 * @param {Object} params - Payment parameters
 * @returns {Object} - Encoded payload and checksum
 */
export const createPaymentPayload = ({
    transactionId,
    amount,
    userId,
    userName,
    userPhone,
    callbackUrl,
    redirectUrl,
}) => {
    const payload = {
        merchantId: PHONEPE_CONFIG.merchantId,
        merchantTransactionId: transactionId,
        merchantUserId: userId,
        amount: amount * 100, // Convert to paise
        redirectUrl: redirectUrl,
        redirectMode: 'POST',
        callbackUrl: callbackUrl,
        mobileNumber: userPhone,
        paymentInstrument: {
            type: 'PAY_PAGE',
        },
    };

    // Base64 encode the payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Generate checksum
    const checksum = generateChecksum(base64Payload);

    return {
        request: base64Payload,
        checksum: checksum,
    };
};

/**
 * Initiate payment with PhonePe
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} - Payment response
 */
export const initiatePayment = async (paymentData) => {
    try {
        const { request, checksum } = createPaymentPayload(paymentData);

        const response = await fetch(`${getBaseUrl()}/pg/v1/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
            },
            body: JSON.stringify({ request }),
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                paymentUrl: data.data.instrumentResponse.redirectInfo.url,
                transactionId: paymentData.transactionId,
            };
        } else {
            return {
                success: false,
                error: data.message || 'Payment initiation failed',
            };
        }
    } catch (error) {
        console.error('PhonePe payment initiation error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Check payment status
 * @param {string} transactionId - Merchant transaction ID
 * @returns {Promise<Object>} - Payment status
 */
export const checkPaymentStatus = async (transactionId) => {
    try {
        const string = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${transactionId}${PHONEPE_CONFIG.saltKey}`;
        const sha256 = CryptoJS.SHA256(string);
        const checksum = sha256.toString(CryptoJS.enc.Hex) + '###' + PHONEPE_CONFIG.saltIndex;

        const response = await fetch(
            `${getBaseUrl()}/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${transactionId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
                },
            }
        );

        const data = await response.json();

        return {
            success: data.success,
            code: data.code,
            message: data.message,
            data: data.data,
        };
    } catch (error) {
        console.error('PhonePe status check error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Generate unique transaction ID
 * @returns {string} - Transaction ID
 */
export const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TXN${timestamp}${random}`;
};

export default {
    initiatePayment,
    checkPaymentStatus,
    generateTransactionId,
    verifyWebhookChecksum,
};
