const mongoose = require('mongoose');

const withOptionalTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    // Fallback for standalone MongoDB without replica set
    const msg = err.message || '';
    if (
      msg.includes('Transaction numbers are only allowed') ||
      msg.includes('replica set') ||
      msg.includes('does not support transactions')
    ) {
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { withOptionalTransaction };
