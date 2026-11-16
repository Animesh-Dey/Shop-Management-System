const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, shopName, shopAddress, shopPhone, gstNumber } = req.body;
  if (!name || !email || !password || !shopName) {
    throw new ApiError(400, 'Name, email, password and shopName are required');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(400, 'User already exists');
  }
  const user = await User.create({
    name,
    email,
    password,
    shopName,
    shopAddress: shopAddress || '',
    shopPhone: shopPhone || '',
    gstNumber: gstNumber || '',
  });
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        gstNumber: user.gstNumber,
      },
      token: generateToken(user._id),
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        gstNumber: user.gstNumber,
      },
      token: generateToken(user._id),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { register, login, me };
