const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSignupOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

const OTP_TTL_MS = 15 * 60 * 1000;

function generateSixDigitOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

const toUserResponse = (user) => ({
  _id: user._id,
  name: user.fullName,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
  access: user.access,
  accessLevel: user.accessLevel,
  avatar: user.avatar,
  loginCount: user.loginCount,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

const signupUser = async (req, res) => {
  try {
    const { fullName, email, password, role, access, accessLevel, avatar } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });

    if (existingUser && existingUser.status === 'Verified') {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateSixDigitOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);

    let newUserId = null;

    if (existingUser) {
      existingUser.fullName = fullName.trim();
      existingUser.password = hashedPassword;
      existingUser.role = role || existingUser.role;
      existingUser.access = typeof access === 'boolean' ? access : existingUser.access;
      existingUser.accessLevel = accessLevel || existingUser.accessLevel;
      existingUser.avatar = typeof avatar === 'string' ? avatar : existingUser.avatar;
      existingUser.status = 'Unverified';
      existingUser.emailVerificationOtpHash = otpHash;
      existingUser.emailVerificationOtpExpires = otpExpires;
      await existingUser.save();
    } else {
      const created = await User.create({
        fullName: fullName.trim(),
        email: emailLower,
        password: hashedPassword,
        role: role || 'User',
        status: 'Unverified',
        access: typeof access === 'boolean' ? access : true,
        accessLevel: accessLevel || 'Free',
        avatar: avatar || '',
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpExpires: otpExpires,
      });
      newUserId = created._id;
    }

    try {
      await sendSignupOtpEmail(emailLower, otp, fullName.trim());
    } catch (sendErr) {
      console.error('[signup] sendSignupOtpEmail failed:', sendErr.message);
      if (newUserId) {
        await User.findByIdAndDelete(newUserId);
      }
      return res.status(503).json({
        message: 'Unable to send the verification email. Please try again later.',
      });
    }

    return res.status(existingUser ? 200 : 201).json({
      message: 'Verification code sent to your email',
      requiresVerification: true,
      email: emailLower,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifySignupUser = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || otp === undefined || otp === null || String(otp).trim() === '') {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+emailVerificationOtpHash +emailVerificationOtpExpires'
    );

    if (!user || !user.emailVerificationOtpHash) {
      return res.status(400).json({ message: 'Invalid or expired verification request' });
    }

    if (!user.emailVerificationOtpExpires || user.emailVerificationOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Request a new code.' });
    }

    const valid = await bcrypt.compare(String(otp).trim(), user.emailVerificationOtpHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { status: 'Verified' },
        $unset: { emailVerificationOtpHash: '', emailVerificationOtpExpires: '' },
      }
    );

    const verifiedUser = await User.findById(user._id);

    return res.status(200).json({
      message: 'Email verified. Welcome!',
      token: generateToken(verifiedUser),
      user: toUserResponse(verifiedUser),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resendSignupOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password +emailVerificationOtpHash'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'Verified') {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const otp = generateSixDigitOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);

    try {
      await sendSignupOtpEmail(user.email, otp, user.fullName);
    } catch (sendErr) {
      console.error('[resendSignupOtp] sendSignupOtpEmail failed:', sendErr.message);
      return res.status(503).json({
        message: 'Unable to send the verification email. Please try again later.',
      });
    }

    user.emailVerificationOtpHash = otpHash;
    user.emailVerificationOtpExpires = otpExpires;
    await user.save();

    return res.status(200).json({
      message: 'A new verification code has been sent to your email',
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+emailVerificationOtpHash'
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'Unverified' && user.emailVerificationOtpHash) {
      return res.status(403).json({
        message: 'Please verify your email with the code we sent you.',
        requiresVerification: true,
        email: user.email,
      });
    }

    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      message: 'Login successful',
      token: generateToken(user),
      user: toUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json(users.map(toUserResponse));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, email, role, status, access, accessLevel, avatar } = req.body;

    const updates = {};
    if (name || fullName) updates.fullName = (name || fullName).trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (typeof access === 'boolean') updates.access = access;
    if (accessLevel) updates.accessLevel = accessLevel;
    if (typeof avatar === 'string') updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(toUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });
    return res.status(200).json({
      message: 'Users deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkAccessUpdate = async (req, res) => {
  try {
    const { userIds, access } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0 || typeof access !== 'boolean') {
      return res
        .status(400)
        .json({ message: 'userIds (array) and access (boolean) are required' });
    }

    const result = await User.updateMany({ _id: { $in: userIds } }, { $set: { access } });
    return res.status(200).json({ message: 'Access updated successfully', modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkAccessLevelUpdate = async (req, res) => {
  try {
    const { userIds, accessLevel } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0 || !accessLevel) {
      return res
        .status(400)
        .json({ message: 'userIds (array) and accessLevel are required' });
    }

    const normalizedAccessLevel =
      accessLevel.toLowerCase() === 'pro' ? 'Pro' : 'Free';

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { accessLevel: normalizedAccessLevel } }
    );

    return res
      .status(200)
      .json({ message: 'Tier access updated successfully', modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get current authenticated user
exports.getCurrentUser = async (req, res) => {
  try {
    // The user object is already available from the auth middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Current user retrieved successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        access: user.access,
        role: user.role,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: Get count of users with access set to true
exports.getUsersWithAccessCount = async (req, res) => {
  try {
    // Filter users where access is true
    const count = await User.countDocuments({ access: true });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUsersWithoutAccessCount = async (req, res) => {
  try {
    // Filter users where access is false
    const count = await User.countDocuments({ access: false });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Check user status by email (for debugging)
exports.checkUserStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        exists: false,
      });
    }

    res.json({
      message: "User found",
      exists: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        access: user.access,
        role: user.role,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Check User Status Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getActiveUsersDynamicDays = async (req, res) => {
  try {
    // Get the number of days from the query, default to 30 if not provided
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate users with a lastLogin within the dynamic time period,
    // grouping them by the day (formatted as YYYY-MM-DD)
    const data = await User.aggregate([
      { $match: { lastLogin: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTotalUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserGrowth = async (req, res) => {
  try {
    // Parse query parameters: start and end dates, verified, and access
    const { start, end, verified, access } = req.query;
    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Build the filter for the aggregation
    const filter = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Filter by verification status if provided.
    // Here, verified=true means status "Verified" and verified=false means status "Unverified".
    if (verified !== undefined) {
      if (verified.toLowerCase() === "true") {
        filter.status = "Verified";
      } else if (verified.toLowerCase() === "false") {
        filter.status = "Unverified";
      }
    }

    // Optional: filter by access if provided.
    if (access !== undefined) {
      if (access.toLowerCase() === "true") {
        filter.access = true;
      } else if (access.toLowerCase() === "false") {
        filter.access = false;
      }
    }

    // Aggregate users: group by day (formatted as YYYY-MM-DD)
    const data = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate cumulative totals
    let cumulative = 0;
    const result = data.map((item) => {
      cumulative += item.count;
      return {
        date: item._id,
        daily: item.count,
        cumulative: cumulative,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get Subscriber Growth Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyAdminStatus = async (req, res) => {
  try {
    return res.status(200).json({
      isAdmin: req.user?.role === 'Admin',
      role: req.user?.role || null,
      userId: req.user?._id || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.signupUser = signupUser;
exports.verifySignupUser = verifySignupUser;
exports.resendSignupOtp = resendSignupOtp;
exports.loginUser = loginUser;
exports.getUsers = getUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.deleteMultipleUsers = deleteMultipleUsers;
exports.bulkAccessUpdate = bulkAccessUpdate;
exports.bulkAccessLevelUpdate = bulkAccessLevelUpdate;
exports.verifyAdminStatus = verifyAdminStatus;
