import BloodBag from '../models/BloodBag.js';
import User from '../models/User.js';
import {
  getBloodBagFromChain,
  getBloodHistoryFromChain,
  loadContractConfig,
} from '../services/blockchain.js';

export const verifyBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    if (!bagId) {
      return res.status(400).json({
        success: false,
        message: 'Blood Bag ID is required',
      });
    }

    const formattedBagId = bagId.trim().toUpperCase();

    // 1. Authoritative Blockchain State
    const chainData = await getBloodBagFromChain(formattedBagId);
    const chainHistory = await getBloodHistoryFromChain(formattedBagId);
    const contractConfig = loadContractConfig();

    // 2. Lookup Custodian organization name
    let custodianName = 'Authorized Participant';
    try {
      const custodianUser = await User.findOne({
        walletAddress: { $regex: new RegExp(`^${chainData.currentCustodian}$`, 'i') },
      });
      if (custodianUser) {
        custodianName = `${custodianUser.organizationName} (${custodianUser.role})`;
      }
    } catch {
      // Non-critical
    }

    // 3. Lookup safe off-chain metadata (zero donor PII)
    const dbBag = await BloodBag.findOne({ bagId: formattedBagId }).select(
      'location storageCondition volumeMl registeredByOrg qrCodeData'
    );

    // 4. Enrich history with readable actor names
    const enrichedHistory = await Promise.all(
      chainHistory.map(async (entry) => {
        let actorTitle = entry.actor;
        try {
          const u = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${entry.actor}$`, 'i') },
          });
          if (u) actorTitle = `${u.organizationName} [${u.role}]`;
        } catch {
          // ignore
        }
        return {
          ...entry,
          actorTitle,
        };
      })
    );

    res.json({
      success: true,
      verificationStatus: 'VERIFIED',
      verificationDetails: {
        contractAddress: contractConfig.address,
        network: 'BloodChain Decentralized Ledger (Hardhat)',
        verifiedAt: new Date().toISOString(),
      },
      bloodBag: {
        bagId: chainData.bagId,
        bloodGroup: chainData.bloodGroup,
        status: chainData.status,
        authoritativeStatus: chainData.statusName,
        currentCustodian: chainData.currentCustodian,
        custodianName,
        collectionDate: chainData.collectionDate,
        expiryDate: chainData.expiryDate,
        isExpired: chainData.isExpired,
        volumeMl: dbBag?.volumeMl || 450,
        location: dbBag?.location || 'Authorized Storage',
        storageCondition: dbBag?.storageCondition || 'Refrigerated (2°C - 6°C)',
        registeredByOrg: dbBag?.registeredByOrg || custodianName,
        qrCodeData: dbBag?.qrCodeData || '',
      },
      lifecycleHistory: enrichedHistory,
    });
  } catch (error) {
    console.error('[Public Verification Error]:', error);
    res.status(404).json({
      success: false,
      verificationStatus: 'UNVERIFIED',
      message: error.message || 'Blood bag could not be verified on the blockchain',
    });
  }
};
