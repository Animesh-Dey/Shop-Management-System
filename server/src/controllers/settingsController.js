const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, data: user });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { name, shopName, shopAddress, shopPhone, email, gstNumber } = req.body;
  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (shopName !== undefined) user.shopName = shopName;
  if (shopAddress !== undefined) user.shopAddress = shopAddress;
  if (shopPhone !== undefined) user.shopPhone = shopPhone;
  if (email !== undefined) user.email = email;
  if (gstNumber !== undefined) user.gstNumber = gstNumber;
  await user.save();
  const data = user.toObject();
  delete data.password;
  res.json({ success: true, data });
});

module.exports = { getSettings, updateSettings };
