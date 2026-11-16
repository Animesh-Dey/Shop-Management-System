const Counter = require('../models/Counter');

const getNextSequence = async (ownerId, key, prefix, session) => {
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;
  const counter = await Counter.findOneAndUpdate(
    { ownerId, key },
    { $inc: { seq: 1 } },
    opts
  );
  const num = String(counter.seq).padStart(6, '0');
  return `${prefix}-${num}`;
};

module.exports = { getNextSequence };
