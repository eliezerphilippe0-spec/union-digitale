/**
 * COD Constants for Zabely
 */

export const COD_DEPOSIT_PERCENTAGE = 0.10; // 10% upfront deposit

export const ALLOWED_COD_ZONES = [
    'PAP',      // Port-au-Prince
    'Cap',      // Cap-Haïtien
    'Gonaïves'  // Gonaïves
];

export const COD_STATUSES = {
    CONFIRMED: 'confirmed',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED_PAID: 'delivered_paid',
    REFUSED: 'refused',
    RETURNED: 'returned'
};

export const COD_REFUSAL_LIMIT = 2; // User blocked from COD after this many refusals

export default {
    COD_DEPOSIT_PERCENTAGE,
    ALLOWED_COD_ZONES,
    COD_STATUSES,
    COD_REFUSAL_LIMIT
};
