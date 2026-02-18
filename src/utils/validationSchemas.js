import { z } from 'zod';

/**
 * Validation Schemas for Union Digitale Backend
 * Using Zod for runtime type validation and schema enforcement
 */

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserSchema = z.object({
    uid: z.string().min(1, 'User ID is required'),
    email: z.string().email('Invalid email format'),
    displayName: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phoneNumber: z.string().regex(/^\+509[0-9]{8}$/, 'Invalid Haitian phone number').optional(),
    role: z.enum(['user', 'seller', 'admin']).default('user'),
    emailVerified: z.boolean().default(false)
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Product name must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
    price: z.number().positive('Price must be positive').max(10000000, 'Price exceeds maximum'),
    category: z.string().min(1, 'Category is required'),
    vendorId: z.string().min(1, 'Vendor ID is required'),
    images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image required').max(10),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    isDigital: z.boolean().default(false),
    tags: z.array(z.string()).max(20).optional(),
    status: z.enum(['active', 'inactive', 'draft']).default('draft')
});

export const ProductUpdateSchema = ProductSchema.partial().omit({ vendorId: true });

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const OrderItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    vendorId: z.string().min(1, 'Vendor ID is required'),
    name: z.string().min(1),
    price: z.number().positive('Price must be positive'),
    quantity: z.number().int().positive('Quantity must be positive').max(100, 'Quantity exceeds maximum'),
    image: z.string().url().optional()
});

export const ShippingAddressSchema = z.object({
    fullName: z.string().min(2, 'Full name required'),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Invalid phone number'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    city: z.string().min(2, 'City required'),
    department: z.string().min(2, 'Department required'),
    postalCode: z.string().optional(),
    country: z.string().default('Haiti')
});

export const PickupOptionSchema = z.object({
    hubId: z.string().min(1, 'Pickup hub ID is required')
});

export const OrderSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    items: z.array(OrderItemSchema).min(1, 'At least one item required').max(50, 'Too many items'),
    totalAmount: z.number().positive('Total must be positive').max(10000000, 'Total exceeds maximum'),
    currency: z.string().default('HTG'),
    paymentMethod: z.enum(['moncash', 'natcash', 'stripe', 'wallet', 'cash_on_delivery']),
    shippingMethod: z.enum(['delivery', 'pickup']).default('delivery'),
    shippingAddress: ShippingAddressSchema.optional(),
    pickupHubId: z.string().optional(),
    status: z.enum(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending_payment'),
    referral: z.object({
        ambassadorId: z.string(),
        code: z.string()
    }).optional()
});

export const OrderCreateSchema = OrderSchema.omit({ userId: true, status: true });

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const TransactionSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    type: z.enum([
        'recharge_moncash',
        'recharge_natcash',
        'transfer',
        'payment_edh',
        'payment_camep',
        'order_payment',
        'wallet_deposit',
        'wallet_withdrawal'
    ]),
    amount: z.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum'),
    currency: z.string().default('HTG'),
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending'),
    recipient: z.string().optional(),
    phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/, 'Invalid phone format (XXXX-XXXX)').optional(),
    accountNumber: z.string().optional(),
    metadata: z.record(z.any()).optional()
});

// Validation par type de transaction
export const TransactionValidators = {
    recharge_moncash: TransactionSchema.extend({
        amount: z.number().min(50, 'Minimum 50 HTG').max(50000, 'Maximum 50,000 HTG'),
        phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/)
    }),

    recharge_natcash: TransactionSchema.extend({
        amount: z.number().min(50, 'Minimum 50 HTG').max(50000, 'Maximum 50,000 HTG'),
        phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/)
    }),

    transfer: TransactionSchema.extend({
        amount: z.number().min(50, 'Minimum 50 HTG').max(50000, 'Maximum 50,000 HTG'),
        recipient: z.string().min(2, 'Recipient name required'),
        phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/)
    }),

    payment_edh: TransactionSchema.extend({
        amount: z.number().min(100, 'Minimum 100 HTG').max(100000, 'Maximum 100,000 HTG'),
        accountNumber: z.string().regex(/^[0-9]{8,12}$/, 'Invalid meter number (8-12 digits)')
    }),

    payment_camep: TransactionSchema.extend({
        amount: z.number().min(50, 'Minimum 50 HTG').max(50000, 'Maximum 50,000 HTG'),
        accountNumber: z.string().regex(/^[0-9]{6,10}$/, 'Invalid client number (6-10 digits)')
    })
};

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const MonCashPaymentSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    amount: z.number().positive('Amount must be positive').max(10000000),
    currency: z.string().default('HTG'),
    idempotencyKey: z.string().min(1, 'Idempotency key required')
});

export const StripePaymentSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    amount: z.number().positive('Amount must be positive').max(10000000),
    currency: z.string().default('HTG'),
    paymentMethodId: z.string().min(1, 'Payment method required')
});

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const MonCashWebhookSchema = z.object({
    orderId: z.string().min(1),
    transactionId: z.string().min(1),
    amount: z.number().positive(),
    status: z.enum(['successful', 'completed', 'failed', 'pending']),
    timestamp: z.string().datetime()
});

// ============================================================================
// RESERVATION SCHEMAS (Cars/Real Estate)
// ============================================================================

export const ReservationSchema = z.object({
    userId: z.string().min(1, 'User ID required'),
    itemId: z.string().min(1, 'Item ID required'),
    itemType: z.enum(['car', 'real_estate']),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
    totalAmount: z.number().positive().max(1000000),
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending')
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate']
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const ReviewSchema = z.object({
    userId: z.string().min(1, 'User ID required'),
    productId: z.string().min(1, 'Product ID required'),
    orderId: z.string().min(1, 'Order ID required'),
    rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long'),
    images: z.array(z.string().url()).max(5, 'Maximum 5 images').optional()
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a schema and return typed result
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {*} Validated data
 */
export function validate(schema, data) {
    return schema.parse(data);
}

/**
 * Safe validation that returns success/error
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {{ success: boolean, data?: *, error?: import('zod').ZodError }}
 */
export function safeValidate(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Format Zod errors for user-friendly messages
 * @param {import('zod').ZodError} error - Zod error object
 * @returns {string[]} Array of formatted error messages
 */
export function formatValidationErrors(error) {
    return error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    UserSchema,
    ProductSchema,
    ProductUpdateSchema,
    OrderSchema,
    OrderCreateSchema,
    OrderItemSchema,
    ShippingAddressSchema,
    PickupOptionSchema,
    TransactionSchema,
    TransactionValidators,
    MonCashPaymentSchema,
    StripePaymentSchema,
    MonCashWebhookSchema,
    ReservationSchema,
    ReviewSchema,
    validate,
    safeValidate,
    formatValidationErrors
};
