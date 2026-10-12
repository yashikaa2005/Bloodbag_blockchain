import BloodBag from '../models/BloodBag.js';
import User from '../models/User.js';
import { getBloodBagFromChain } from '../services/blockchain.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const bloodBanksCount = await User.countDocuments({ role: 'BLOOD_BANK' });
    const labsCount = await User.countDocuments({ role: 'LAB' });
    const hospitalsCount = await User.countDocuments({ role: 'HOSPITAL' });

    const bags = await BloodBag.find().sort({ createdAt: -1 });

    const statusCounts = {
      COLLECTED: 0,
      TESTING: 0,
      APPROVED: 0,
      AVAILABLE: 0,
      TRANSFERRED: 0,
      RECEIVED: 0,
      CONSUMED: 0,
      EXPIRED: 0,
      REJECTED: 0,
      UNKNOWN: 0,
    };

    const bloodGroupCounts = {
      'A+': 0, 'A-': 0,
      'B+': 0, 'B-': 0,
      'AB+': 0, 'AB-': 0,
      'O+': 0, 'O-': 0,
    };

    await Promise.all(
      bags.map(async (b) => {
        if (bloodGroupCounts[b.bloodGroup] !== undefined) {
          bloodGroupCounts[b.bloodGroup]++;
        }
        try {
          const chainData = await getBloodBagFromChain(b.bagId);
          if (statusCounts[chainData.statusName] !== undefined) {
            statusCounts[chainData.statusName]++;
          }
        } catch {
          statusCounts.UNKNOWN++;
        }
      })
    );

    res.json({
      success: true,
      stats: {
        totalBags: bags.length,
        totalUsers,
        bloodBanksCount,
        labsCount,
        hospitalsCount,
        statusCounts,
        bloodGroupCounts,
      },
      recentBags: bags.slice(0, 5),
    });
  } catch (error) {
    console.error('[Dashboard Stats Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to compute dashboard statistics',
    });
  }
};
