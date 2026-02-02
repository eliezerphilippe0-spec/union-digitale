import { z } from 'zod';

/**
 * Validation Schemas for Vendor Commission & Payout System
 * Union Digitale Marketplace
 */

// ============================================================================
// VENDOR SCHEMAS
// ============================================================================

export const VendorVerificationDocumentSchema = z.object({
    url: z.string().url('Invalid document URL'),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    uploadedAt: z.date().optional(),
    rejectionReason: z.string().optional()
});

export const VendorSchema = z.object({
    userId: z.string().min(1, 'User ID required'),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
    verificationLevel: z.enum(['standard', 'verified', 'premium']).default('standard'),
    verificationStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    verificationDocuments: z.object({
        idCard: VendorVerificationDocumentSchema.optional(),
        selfie: VendorVerificationDocumentSchema.optional(),
        businessLicense: VendorVerificationDocumentSchema.optional()
    }).optional(),
    rating: z.number().min(0).max(5).default(0),
    totalSales: z.number().nonnegative().default(0),
    totalOrders: z.number().int().nonnegative().default(0),
    responseTime: z.number().nonnegative().default(24), // hours
    successRate: z.number().min(0).max(100).default(100), // percentage
    badges: z.array(z.enum(['verified', 'premium', 'fast_responder', 'top_seller'])).default([]),
    commissionRate: z.number().min(0.05).max(0.20).optional(), // Custom rate if applicable
    status: z.enum(['active', 'suspended', 'banned']).default('active'),
    suspensionReason: z.string().optional(),
    phoneNumber: z.string().regex(/^\+509[0-9]{8}$/, 'Invalid Haitian phone number').optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

export const VendorUpdateSchema = VendorSchema.partial().omit({
    userId: true,
    verificationLevel: true,
    verificationStatus: true,
    commissionRate: true,
    totalSales: true,
    totalOrders: true
});

// ============================================================================
// WALLET SCHEMAS
// ============================================================================

export const WalletSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID required'),
    availableBalance: z.number().nonnegative('Balance cannot be negative').default(0),
    pendingBalance: z.number().nonnegative('Pending balance cannot be negative').default(0),
    totalEarnings: z.number().nonnegative().default(0),
    totalWithdrawn: z.number().nonnegative().default(0),
    currency: z.string().default('HTG'),
    lastPayoutAt: z.date().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

// ============================================================================
// WALLET TRANSACTION SCHEMAS
// ============================================================================

export const WalletTransactionSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID required'),
    type: z.enum(['sale', 'commission', 'payout', 'refund', 'adjustment', 'release', 'hold']),
    amount: z.number(), // Can be negative for payouts
    balanceAfter: z.number().nonnegative(),
    orderId: z.string().optional(),
    payoutId: z.string().optional(),
    description: z.string().min(1, 'Description required').max(500),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date().optional()
});

// ============================================================================
// PAYOUT SCHEMAS
// ============================================================================

export const PayoutDestinationSchema = z.object({
    phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/, 'Invalid phone format (XXXX-XXXX)').optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    bankName: z.string().optional()
});

export const PayoutSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID required'),
    amount: z.number().positive('Amount must be positive').min(500, 'Minimum payout: 500 HTG').max(1000000, 'Maximum payout: 1,000,000 HTG'),
    currency: z.string().default('HTG'),
    method: z.enum(['moncash', 'natcash', 'bank_transfer']),
    destination: PayoutDestinationSchema,
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending'),
    requestedAt: z.date().optional(),
    processedAt: z.date().optional(),
    completedAt: z.date().optional(),
    failureReason: z.string().optional(),
    transactionReference: z.string().optional(),
    fees: z.number().nonnegative().default(0),
    netAmount: z.number().positive().optional(),
    createdAt: z.date().optional()
});

export const PayoutRequestSchema = PayoutSchema.omit({
    vendorId: true,
    status: true,
    requestedAt: true,
    processedAt: true,
    completedAt: true,
    failureReason: true,
    transactionReference: true,
    netAmount: true,
    createdAt: true
});

// ============================================================================
// COMMISSION RULE SCHEMAS
// ============================================================================

export const CommissionRuleConditionsSchema = z.object({
    category: z.string().optional(),
    productType: z.enum(['physical', 'digital', 'service', 'rental']).optional(),
    vendorLevel: z.enum(['standard', 'verified', 'premium']).optional(),
    minAmount: z.number().nonnegative().optional(),
    maxAmount: z.number().positive().optional()
}).refine(data => {
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
        return data.maxAmount > data.minAmount;
    }
    return true;
}, {
    message: 'Max amount must be greater than min amount',
    path: ['maxAmount']
});

export const CommissionRuleSchema = z.object({
    name: z.string().min(1, 'Rule name required').max(100),
    type: z.enum(['default', 'category', 'vendor', 'product_type']),
    rate: z.number().min(0.05, 'Minimum commission: 5%').max(0.20, 'Maximum commission: 20%'),
    conditions: CommissionRuleConditionsSchema.optional(),
    priority: z.number().int().nonnegative().default(0),
    active: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

// ============================================================================
// VENDOR REVIEW SCHEMAS
// ============================================================================

export const VendorReviewSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID required'),
    orderId: z.string().min(1, 'Order ID required'),
    userId: z.string().min(1, 'User ID required'),
    rating: z.number().int().min(1, 'Minimum rating: 1').max(5, 'Maximum rating: 5'),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long'),
    response: z.string().max(1000).optional(), // Vendor response
    helpful: z.number().int().nonnegative().default(0),
    createdAt: z.date().optional(),
    respondedAt: z.date().optional()
});

// ============================================================================
// VENDOR DISPUTE SCHEMAS
// ============================================================================

export const DisputeEvidenceSchema = z.object({
    url: z.string().url(),
    type: z.enum(['image', 'document', 'video']),
    uploadedAt: z.date()
});

export const VendorDisputeSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID required'),
    orderId: z.string().min(1, 'Order ID required'),
    userId: z.string().min(1, 'User ID required'),
    type: z.enum(['product_issue', 'delivery_issue', 'refund_request', 'fraud', 'other']),
    status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open'),
    description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
    evidence: z.array(DisputeEvidenceSchema).max(10, 'Maximum 10 evidence files').optional(),
    resolution: z.string().max(2000).optional(),
    fundsHeld: z.boolean().default(false),
    heldAmount: z.number().nonnegative().default(0),
    createdAt: z.date().optional(),
    resolvedAt: z.date().optional()
});

// ============================================================================
// COMMISSION CALCULATION SCHEMAS
// ============================================================================

export const CommissionCalculationSchema = z.object({
    orderId: z.string().min(1),
    vendorId: z.string().min(1),
    amount: z.number().positive(),
    productType: z.enum(['physical', 'digital', 'service', 'rental']),
    vendorLevel: z.enum(['standard', 'verified', 'premium']),
    category: z.string().optional()
});

export const CommissionResultSchema = z.object({
    amount: z.number().positive(),
    commissionRate: z.number().min(0.05).max(0.20),
    commission: z.number().nonnegative(),
    vendorEarnings: z.number().positive(),
    appliedRule: z.string().optional()
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate vendor data
 */
export function validateVendor(data: unknown) {
    return VendorSchema.parse(data);
}

/**
 * Validate payout request
 */
export function validatePayoutRequest(data: unknown) {
    const result = PayoutRequestSchema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    return result.data;
}

/**
 * Validate wallet transaction
 */
export function validateWalletTransaction(data: unknown) {
    return WalletTransactionSchema.parse(data);
}

/**
 * Validate commission calculation input
 */
export function validateCommissionCalculation(data: unknown) {
    return CommissionCalculationSchema.parse(data);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    VendorSchema,
    VendorUpdateSchema,
    WalletSchema,
    WalletTransactionSchema,
    PayoutSchema,
    PayoutRequestSchema,
    CommissionRuleSchema,
    VendorReviewSchema,
    VendorDisputeSchema,
    CommissionCalculationSchema,
    CommissionResultSchema,
    validateVendor,
    validatePayoutRequest,
    validateWalletTransaction,
    validateCommissionCalculation
};
