const assertNonNegative = (label, value) => {
  if (value < 0) {
    const error = new Error(`${label} cannot be negative`);
    error.code = 'NEGATIVE_BALANCE';
    throw error;
  }
};

module.exports = { assertNonNegative };
