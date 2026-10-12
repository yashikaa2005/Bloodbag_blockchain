import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  assignRoleOnChain,
  ROLES,
  getSignerForUser,
  HARDHAT_DEFAULT_ACCOUNTS,
} from '../services/blockchain.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'bloodchain_super_secret_jwt_key_2026_dlt_project',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, organizationName, walletAddress, privateKey } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and organization name are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists',
      });
    }

    const assignedRole = role || 'BLOOD_BANK';
    const assignedWallet =
      walletAddress ||
      (HARDHAT_DEFAULT_ACCOUNTS[assignedRole]
        ? HARDHAT_DEFAULT_ACCOUNTS[assignedRole].address
        : HARDHAT_DEFAULT_ACCOUNTS.ADMIN.address);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      organizationName,
      walletAddress: assignedWallet,
      privateKey: privateKey || (HARDHAT_DEFAULT_ACCOUNTS[assignedRole]?.privateKey || ''),
    });

    // Automatically sync role to smart contract if role is not NONE
    try {
      const adminSigner = getSignerForUser({ role: 'ADMIN' });
      const roleEnumNumber = ROLES[assignedRole];
      if (roleEnumNumber && roleEnumNumber > 0) {
        await assignRoleOnChain(assignedWallet, roleEnumNumber, adminSigner);
        console.log(`[Smart Contract] Automatically assigned on-chain role ${assignedRole} to ${assignedWallet}`);
      }
    } catch (onChainErr) {
      console.warn(`[Smart Contract Warning] Could not assign role on chain (node may be offline): ${onChainErr.message}`);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact an administrator.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Authentication error',
    });
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organizationName: req.user.organizationName,
      walletAddress: req.user.walletAddress,
      createdAt: req.user.createdAt,
    },
  });
};
