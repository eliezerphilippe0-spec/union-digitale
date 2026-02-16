const { AppError } = require('../middleware/errorHandler');

const logInvariantViolation = (payload) => {
  console.log(JSON.stringify({ event: 'finance_invariant_violation', ...payload }));
};

const assertNonNegative = (label, value, context = {}) => {
  if (value < 0) {
    logInvariantViolation({ type: 'NEGATIVE_BALANCE', label, value, ...context });
    throw new AppError(`${label} cannot be negative`, 400);
  }
};

const assertNoDuplicateLedger = async (tx, { type, orderId, payoutRequestId, storeId }) => {
  const existing = await tx.financialLedger.findFirst({
    where: {
      type,
      ...(orderId && { orderId }),
      ...(payoutRequestId && { payoutRequestId }),
      ...(storeId && { storeId }),
    },
  });

  if (existing) {
    logInvariantViolation({ type: 'DUPLICATE_LEDGER', ledgerType: type, orderId, payoutRequestId, storeId });
    throw new AppError('Duplicate ledger entry', 409);
  }
};

module.exports = { assertNonNegative, assertNoDuplicateLedger, logInvariantViolation };
