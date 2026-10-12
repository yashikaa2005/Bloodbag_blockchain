import User from '../models/User.js';
import {
  assignRoleOnChain,
  ROLES,
  getSignerForUser,
} from '../services/blockchain.js';

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password -privateKey')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve users',
    });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { isActive: true };
    if (role) {
      filter.role = role;
    } else {
      filter.role = { $in: ['HOSPITAL', 'BLOOD_BANK'] };
    }

    const orgs = await User.find(filter)
      .select('name organizationName role walletAddress')
      .sort({ organizationName: 1 });

    res.json({
      success: true,
      organizations: orgs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve organizations',
    });
  }
};

export const assignUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId and role are required',
      });
    }

    if (!ROLES[role]) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${Object.keys(ROLES).join(', ')}`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Call smart contract assignRole
    const adminSigner = getSignerForUser(req.user);
    const roleNum = ROLES[role];

    const txResult = await assignRoleOnChain(user.walletAddress, roleNum, adminSigner);

    // Update MongoDB
    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `Role ${role} successfully assigned to ${user.organizationName} (${user.walletAddress})`,
      transactionHash: txResult.transactionHash,
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
    console.error('[Assign Role Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign role',
    });
  }
};
