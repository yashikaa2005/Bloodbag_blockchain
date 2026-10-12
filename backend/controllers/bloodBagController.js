import QRCode from 'qrcode';
import BloodBag from '../models/BloodBag.js';
import User from '../models/User.js';
import {
  registerBloodBagOnChain,
  startTestingOnChain,
  approveBloodBagOnChain,
  rejectBloodBagOnChain,
  transferBloodBagOnChain,
  receiveBloodBagOnChain,
  consumeBloodBagOnChain,
  markExpiredOnChain,
  getBloodBagFromChain,
  getBloodHistoryFromChain,
  getSignerForUser,
} from '../services/blockchain.js';

export const registerBloodBag = async (req, res) => {
  try {
    const {
      bagId,
      bloodGroup,
      collectionDate,
      expiryDate,
      donorReference,
      volumeMl,
      location,
      notes,
    } = req.body;

    if (!bagId || !bloodGroup || !collectionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'bagId, bloodGroup, collectionDate, and expiryDate are required',
      });
    }

    const formattedBagId = bagId.trim().toUpperCase();

    // Check if bagId exists in MongoDB
    const existingDbBag = await BloodBag.findOne({ bagId: formattedBagId });
    if (existingDbBag) {
      return res.status(400).json({
        success: false,
        message: `Blood bag with ID "${formattedBagId}" already exists in the system`,
      });
    }

    const colTimestampSec = Math.floor(new Date(collectionDate).getTime() / 1000);
    const expTimestampSec = Math.floor(new Date(expiryDate).getTime() / 1000);

    if (expTimestampSec <= colTimestampSec) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be in the future and strictly after the collection date',
      });
    }

    // Call smart contract to register blood bag on-chain
    const signer = getSignerForUser(req.user);
    console.log(`[Smart Contract] Registering bag ${formattedBagId} by ${req.user.organizationName} (${signer.address})`);

    const txResult = await registerBloodBagOnChain(
      formattedBagId,
      bloodGroup.trim().toUpperCase(),
      colTimestampSec,
      expTimestampSec,
      signer
    );

    // Generate Verification URL and QR Code
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientUrl}/verify/${formattedBagId}`;
    const qrCodeData = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Save off-chain metadata to MongoDB
    const bloodBag = await BloodBag.create({
      bagId: formattedBagId,
      bloodGroup: bloodGroup.trim().toUpperCase(),
      collectionDate: new Date(collectionDate),
      expiryDate: new Date(expiryDate),
      donorReference: donorReference || undefined,
      volumeMl: volumeMl || 450,
      location: location || 'Central Storage',
      storageCondition: 'Refrigerated (2°C - 6°C)',
      qrCodeData,
      verificationUrl,
      registeredBy: req.user._id,
      registeredByOrg: req.user.organizationName,
      lastTransactionHash: txResult.transactionHash,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Blood bag ${formattedBagId} successfully registered on blockchain and cataloged`,
      transactionHash: txResult.transactionHash,
      bloodBag: {
        ...bloodBag.toObject(),
        authoritativeStatus: 'COLLECTED',
        currentCustodian: signer.address,
      },
    });
  } catch (error) {
    console.error('[Register Blood Bag Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register blood bag',
    });
  }
};

export const getBloodBags = async (req, res) => {
  try {
    const { bloodGroup, search } = req.query;

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup.toUpperCase();
    if (search) {
      filter.$or = [
        { bagId: { $regex: search, $options: 'i' } },
        { registeredByOrg: { $regex: search, $options: 'i' } },
        { donorReference: { $regex: search, $options: 'i' } },
      ];
    }

    const dbBags = await BloodBag.find(filter).sort({ createdAt: -1 });

    // Hydrate authoritative status from blockchain for each bag
    const hydratedBags = await Promise.all(
      dbBags.map(async (bag) => {
        const bagObj = bag.toObject();
        try {
          const chainData = await getBloodBagFromChain(bag.bagId);
          return {
            ...bagObj,
            authoritativeStatus: chainData.statusName,
            statusNum: chainData.status,
            currentCustodian: chainData.currentCustodian,
            chainCollectionDate: chainData.collectionDate,
            chainExpiryDate: chainData.expiryDate,
            isExpired: chainData.isExpired,
            onChainVerified: true,
          };
        } catch (chainErr) {
          return {
            ...bagObj,
            authoritativeStatus: 'UNKNOWN',
            statusNum: -1,
            currentCustodian: 'N/A',
            onChainVerified: false,
            chainError: chainErr.message,
          };
        }
      })
    );

    res.json({
      success: true,
      count: hydratedBags.length,
      bloodBags: hydratedBags,
    });
  } catch (error) {
    console.error('[Get Blood Bags Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve blood bags',
    });
  }
};

export const getBloodBagById = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();

    // Fetch on-chain authoritative data
    let chainData;
    try {
      chainData = await getBloodBagFromChain(formattedBagId);
    } catch (chainErr) {
      return res.status(404).json({
        success: false,
        message: `Blood bag "${formattedBagId}" not found on the blockchain: ${chainErr.message}`,
      });
    }

    // Fetch off-chain database metadata
    const dbBag = await BloodBag.findOne({ bagId: formattedBagId }).populate(
      'registeredBy',
      'name organizationName email'
    );

    // Fetch custodian organization name if matching a registered user
    let custodianOrgName = 'Unknown Entity';
    if (chainData.currentCustodian) {
      const custodianUser = await User.findOne({
        walletAddress: { $regex: new RegExp(`^${chainData.currentCustodian}$`, 'i') },
      });
      if (custodianUser) {
        custodianOrgName = custodianUser.organizationName;
      }
    }

    res.json({
      success: true,
      bloodBag: {
        bagId: chainData.bagId,
        bloodGroup: chainData.bloodGroup,
        collectionDate: chainData.collectionDate,
        expiryDate: chainData.expiryDate,
        status: chainData.statusNum,
        authoritativeStatus: chainData.statusName,
        currentCustodian: chainData.currentCustodian,
        custodianOrgName,
        isExpired: chainData.isExpired,
        donorReference: dbBag?.donorReference || 'ANON-REF',
        volumeMl: dbBag?.volumeMl || 450,
        location: dbBag?.location || 'Central Facility',
        storageCondition: dbBag?.storageCondition || 'Refrigerated (2°C - 6°C)',
        qrCodeData: dbBag?.qrCodeData || '',
        registeredByOrg: dbBag?.registeredByOrg || custodianOrgName,
        createdAt: dbBag?.createdAt || chainData.collectionDate,
      },
    });
  } catch (error) {
    console.error('[Get Single Blood Bag Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve blood bag details',
    });
  }
};

export const getBloodBagHistory = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();

    const history = await getBloodHistoryFromChain(formattedBagId);

    // Enrich history with organization names where possible
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        let actorOrg = entry.actor;
        try {
          const user = await User.findOne({
            walletAddress: { $regex: new RegExp(`^${entry.actor}$`, 'i') },
          });
          if (user) {
            actorOrg = `${user.organizationName} (${user.role})`;
          }
        } catch {
          // ignore lookup failure
        }
        return {
          ...entry,
          actorOrg,
        };
      })
    );

    res.json({
      success: true,
      bagId: formattedBagId,
      count: enrichedHistory.length,
      history: enrichedHistory,
    });
  } catch (error) {
    console.error('[Get Blood History Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve blood bag history',
    });
  }
};

export const startTesting = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await startTestingOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Laboratory testing started for blood bag ${formattedBagId}`,
      transactionHash: txResult.transactionHash,
      newStatus: 'TESTING',
    });
  } catch (error) {
    console.error('[Start Testing Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start testing',
    });
  }
};

export const approveBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await approveBloodBagOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} approved and is now AVAILABLE for clinical transfer`,
      transactionHash: txResult.transactionHash,
      newStatus: 'AVAILABLE',
    });
  } catch (error) {
    console.error('[Approve Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve blood bag',
    });
  }
};

export const rejectBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await rejectBloodBagOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} was REJECTED during laboratory testing`,
      transactionHash: txResult.transactionHash,
      newStatus: 'REJECTED',
    });
  } catch (error) {
    console.error('[Reject Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject blood bag',
    });
  }
};

export const transferBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const { recipientAddress } = req.body;
    const formattedBagId = bagId.trim().toUpperCase();

    if (!recipientAddress) {
      return res.status(400).json({
        success: false,
        message: 'recipientAddress is required for transfer',
      });
    }

    const signer = getSignerForUser(req.user);

    const txResult = await transferBloodBagOnChain(
      formattedBagId,
      recipientAddress,
      signer
    );

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} transferred successfully to ${recipientAddress}`,
      transactionHash: txResult.transactionHash,
      newStatus: 'TRANSFERRED',
    });
  } catch (error) {
    console.error('[Transfer Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to transfer blood bag',
    });
  }
};

export const receiveBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await receiveBloodBagOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} successfully received and verified by hospital`,
      transactionHash: txResult.transactionHash,
      newStatus: 'RECEIVED',
    });
  } catch (error) {
    console.error('[Receive Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to receive blood bag',
    });
  }
};

export const consumeBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await consumeBloodBagOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} marked as CONSUMED for patient transfusion`,
      transactionHash: txResult.transactionHash,
      newStatus: 'CONSUMED',
    });
  } catch (error) {
    console.error('[Consume Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to consume blood bag',
    });
  }
};

export const expireBloodBag = async (req, res) => {
  try {
    const { bagId } = req.params;
    const formattedBagId = bagId.trim().toUpperCase();
    const signer = getSignerForUser(req.user);

    const txResult = await markExpiredOnChain(formattedBagId, signer);

    await BloodBag.findOneAndUpdate(
      { bagId: formattedBagId },
      { lastTransactionHash: txResult.transactionHash }
    );

    res.json({
      success: true,
      message: `Blood bag ${formattedBagId} has been marked EXPIRED on the blockchain`,
      transactionHash: txResult.transactionHash,
      newStatus: 'EXPIRED',
    });
  } catch (error) {
    console.error('[Expire Bag Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark blood bag as expired',
    });
  }
};
