import { describe, test, expect } from '@jest/globals';
import {
    UserSchema,
    ProductSchema,
    OrderSchema,
    OrderCreateSchema,
    TransactionSchema,
    TransactionValidators,
    MonCashWebhookSchema,
    ReservationSchema,
    ReviewSchema,
    safeValidate,
    formatValidationErrors
} from '../src/utils/validationSchemas.js';

describe('Validation Schemas - Security Tests', () => {

    // ========================================================================
    // USER VALIDATION TESTS
    // ========================================================================

    describe('UserSchema', () => {
        test('should accept valid user data', () => {
            const validUser = {
                uid: 'user123',
                email: 'test@example.com',
                displayName: 'John Doe',
                phoneNumber: '+50937123456',
                role: 'user',
                emailVerified: true
            };

            const result = safeValidate(UserSchema, validUser);
            expect(result.success).toBe(true);
        });

        test('should reject invalid email', () => {
            const invalidUser = {
                uid: 'user123',
                email: 'not-an-email',
                role: 'user'
            };

            const result = safeValidate(UserSchema, invalidUser);
            expect(result.success).toBe(false);
            expect(result.error.errors[0].message).toContain('Invalid email');
        });

        test('should reject invalid Haitian phone number', () => {
            const invalidUser = {
                uid: 'user123',
                email: 'test@example.com',
                phoneNumber: '+1234567890', // Not Haitian format
                role: 'user'
            };

            const result = safeValidate(UserSchema, invalidUser);
            expect(result.success).toBe(false);
        });

        test('should prevent role injection', () => {
            const maliciousUser = {
                uid: 'user123',
                email: 'test@example.com',
                role: 'super_admin' // Invalid role
            };

            const result = safeValidate(UserSchema, maliciousUser);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // ORDER VALIDATION TESTS
    // ========================================================================

    describe('OrderSchema', () => {
        test('should accept valid order', () => {
            const validOrder = {
                items: [{
                    productId: 'prod123',
                    vendorId: 'vendor123',
                    name: 'Test Product',
                    price: 100,
                    quantity: 2
                }],
                totalAmount: 200,
                currency: 'HTG',
                paymentMethod: 'moncash'
            };

            const result = safeValidate(OrderCreateSchema, validOrder);
            expect(result.success).toBe(true);
        });

        test('should reject order with excessive amount', () => {
            const invalidOrder = {
                items: [{
                    productId: 'prod123',
                    vendorId: 'vendor123',
                    name: 'Test Product',
                    price: 20000000,
                    quantity: 1
                }],
                totalAmount: 20000000, // Exceeds 10M limit
                paymentMethod: 'moncash'
            };

            const result = safeValidate(OrderCreateSchema, invalidOrder);
            expect(result.success).toBe(false);
        });

        test('should reject order with negative quantity', () => {
            const invalidOrder = {
                items: [{
                    productId: 'prod123',
                    vendorId: 'vendor123',
                    name: 'Test Product',
                    price: 100,
                    quantity: -5 // Negative quantity
                }],
                totalAmount: -500,
                paymentMethod: 'moncash'
            };

            const result = safeValidate(OrderCreateSchema, invalidOrder);
            expect(result.success).toBe(false);
        });

        test('should reject order with too many items', () => {
            const items = Array(51).fill({
                productId: 'prod123',
                vendorId: 'vendor123',
                name: 'Test Product',
                price: 100,
                quantity: 1
            });

            const invalidOrder = {
                items,
                totalAmount: 5100,
                paymentMethod: 'moncash'
            };

            const result = safeValidate(OrderCreateSchema, invalidOrder);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // TRANSACTION VALIDATION TESTS
    // ========================================================================

    describe('TransactionValidators', () => {
        test('should validate MonCash recharge with correct limits', () => {
            const validRecharge = {
                userId: 'user123',
                type: 'recharge_moncash',
                amount: 1000,
                currency: 'HTG',
                phoneNumber: '3712-3456',
                status: 'pending'
            };

            const result = safeValidate(TransactionValidators.recharge_moncash, validRecharge);
            expect(result.success).toBe(true);
        });

        test('should reject MonCash recharge below minimum', () => {
            const invalidRecharge = {
                userId: 'user123',
                type: 'recharge_moncash',
                amount: 25, // Below 50 HTG minimum
                phoneNumber: '3712-3456',
                status: 'pending'
            };

            const result = safeValidate(TransactionValidators.recharge_moncash, invalidRecharge);
            expect(result.success).toBe(false);
        });

        test('should reject MonCash recharge above maximum', () => {
            const invalidRecharge = {
                userId: 'user123',
                type: 'recharge_moncash',
                amount: 60000, // Above 50,000 HTG maximum
                phoneNumber: '3712-3456',
                status: 'pending'
            };

            const result = safeValidate(TransactionValidators.recharge_moncash, invalidRecharge);
            expect(result.success).toBe(false);
        });

        test('should validate EDH payment with meter number format', () => {
            const validPayment = {
                userId: 'user123',
                type: 'payment_edh',
                amount: 500,
                accountNumber: '12345678', // 8 digits
                status: 'pending'
            };

            const result = safeValidate(TransactionValidators.payment_edh, validPayment);
            expect(result.success).toBe(true);
        });

        test('should reject EDH payment with invalid meter number', () => {
            const invalidPayment = {
                userId: 'user123',
                type: 'payment_edh',
                amount: 500,
                accountNumber: '123', // Too short
                status: 'pending'
            };

            const result = safeValidate(TransactionValidators.payment_edh, invalidPayment);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // WEBHOOK VALIDATION TESTS
    // ========================================================================

    describe('MonCashWebhookSchema', () => {
        test('should accept valid webhook payload', () => {
            const validWebhook = {
                orderId: 'order123',
                transactionId: 'txn456',
                amount: 1000,
                status: 'successful',
                timestamp: new Date().toISOString()
            };

            const result = safeValidate(MonCashWebhookSchema, validWebhook);
            expect(result.success).toBe(true);
        });

        test('should reject webhook with invalid status', () => {
            const invalidWebhook = {
                orderId: 'order123',
                transactionId: 'txn456',
                amount: 1000,
                status: 'hacked', // Invalid status
                timestamp: new Date().toISOString()
            };

            const result = safeValidate(MonCashWebhookSchema, invalidWebhook);
            expect(result.success).toBe(false);
        });

        test('should reject webhook with missing required fields', () => {
            const invalidWebhook = {
                orderId: 'order123',
                // Missing transactionId
                amount: 1000,
                status: 'successful'
            };

            const result = safeValidate(MonCashWebhookSchema, invalidWebhook);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // RESERVATION VALIDATION TESTS
    // ========================================================================

    describe('ReservationSchema', () => {
        test('should accept valid reservation', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const validReservation = {
                userId: 'user123',
                itemId: 'car123',
                itemType: 'car',
                startDate: tomorrow.toISOString(),
                endDate: nextWeek.toISOString(),
                totalAmount: 5000,
                status: 'pending'
            };

            const result = safeValidate(ReservationSchema, validReservation);
            expect(result.success).toBe(true);
        });

        test('should reject reservation with end date before start date', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const invalidReservation = {
                userId: 'user123',
                itemId: 'car123',
                itemType: 'car',
                startDate: tomorrow.toISOString(),
                endDate: yesterday.toISOString(), // Before start date
                totalAmount: 5000
            };

            const result = safeValidate(ReservationSchema, invalidReservation);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // REVIEW VALIDATION TESTS
    // ========================================================================

    describe('ReviewSchema', () => {
        test('should accept valid review', () => {
            const validReview = {
                userId: 'user123',
                productId: 'prod123',
                orderId: 'order123',
                rating: 5,
                comment: 'Excellent product, highly recommended!'
            };

            const result = safeValidate(ReviewSchema, validReview);
            expect(result.success).toBe(true);
        });

        test('should reject review with rating out of range', () => {
            const invalidReview = {
                userId: 'user123',
                productId: 'prod123',
                orderId: 'order123',
                rating: 6, // Above maximum of 5
                comment: 'Great product'
            };

            const result = safeValidate(ReviewSchema, invalidReview);
            expect(result.success).toBe(false);
        });

        test('should reject review with comment too short', () => {
            const invalidReview = {
                userId: 'user123',
                productId: 'prod123',
                orderId: 'order123',
                rating: 5,
                comment: 'Good' // Too short (< 10 chars)
            };

            const result = safeValidate(ReviewSchema, invalidReview);
            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // ERROR FORMATTING TESTS
    // ========================================================================

    describe('formatValidationErrors', () => {
        test('should format validation errors in user-friendly way', () => {
            const invalidData = {
                email: 'not-an-email',
                phoneNumber: 'invalid'
            };

            const result = safeValidate(UserSchema, invalidData);
            expect(result.success).toBe(false);

            const errors = formatValidationErrors(result.error);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain(':');
        });
    });
});
