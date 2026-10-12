import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BloodChain Enums matching BloodChain.sol
export const ROLES = {
  NONE: 0,
  ADMIN: 1,
  BLOOD_BANK: 2,
  LAB: 3,
  HOSPITAL: 4,
};

export const ROLE_NAMES = {
  0: 'NONE',
  1: 'ADMIN',
  2: 'BLOOD_BANK',
  3: 'LAB',
  4: 'HOSPITAL',
};

export const STATUSES = {
  COLLECTED: 0,
  TESTING: 1,
  APPROVED: 2,
  REJECTED: 3,
  AVAILABLE: 4,
  TRANSFERRED: 5,
  RECEIVED: 6,
  CONSUMED: 7,
  EXPIRED: 8,
};

export const STATUS_NAMES = {
  0: 'COLLECTED',
  1: 'TESTING',
  2: 'APPROVED',
  3: 'REJECTED',
  4: 'AVAILABLE',
  5: 'TRANSFERRED',
  6: 'RECEIVED',
  7: 'CONSUMED',
  8: 'EXPIRED',
};

// Known default deterministic accounts on Hardhat node for simulation fallback
export const HARDHAT_DEFAULT_ACCOUNTS = {
  ADMIN: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  BLOOD_BANK: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  LAB: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
  HOSPITAL: {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  },
};

let contractConfigCache = null;

export const loadContractConfig = () => {
  if (contractConfigCache) return contractConfigCache;

  const configPath = path.join(__dirname, '../config/BloodChainContract.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    contractConfigCache = JSON.parse(raw);
    return contractConfigCache;
  }

  // Fallback to environment variables if file not yet written
  return {
    address: process.env.BLOODCHAIN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: [],
  };
};

export const getProvider = () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
};

export const getContract = (signerOrProvider) => {
  const config = loadContractConfig();
  const address = process.env.BLOODCHAIN_CONTRACT_ADDRESS || config.address;
  if (!address) {
    throw new Error('BloodChain contract address is not configured');
  }
  return new ethers.Contract(address, config.abi, signerOrProvider);
};

export const getReadOnlyContract = () => {
  const provider = getProvider();
  return getContract(provider);
};

/**
 * Resolves a dedicated Ethers.js Signer for a user based on their privateKey,
 * or mapped role account on the local development chain.
 */
export const getSignerForUser = (user) => {
  const provider = getProvider();

  // If user has privateKey defined in document
  if (user && user.privateKey && user.privateKey.startsWith('0x')) {
    return new ethers.Wallet(user.privateKey, provider);
  }

  // Match wallet address case-insensitively against known accounts
  if (user && user.walletAddress) {
    const targetAddr = user.walletAddress.toLowerCase();
    for (const [key, acc] of Object.entries(HARDHAT_DEFAULT_ACCOUNTS)) {
      if (acc.address.toLowerCase() === targetAddr) {
        return new ethers.Wallet(acc.privateKey, provider);
      }
    }
  }

  // If user role has a known test key
  const normalizedRole = user?.role ? user.role.toUpperCase() : '';
  if (normalizedRole && HARDHAT_DEFAULT_ACCOUNTS[normalizedRole]) {
    return new ethers.Wallet(HARDHAT_DEFAULT_ACCOUNTS[normalizedRole].privateKey, provider);
  }

  // Fallback to main private key from .env (Admin)
  const fallbackKey = process.env.PRIVATE_KEY || HARDHAT_DEFAULT_ACCOUNTS.ADMIN.privateKey;
  return new ethers.Wallet(fallbackKey, provider);
};

/**
 * Ensures an account possesses the required on-chain role,
 * auto-assigning via Admin if absent (e.g. after a local node restart).
 */
export const ensureRoleOnChain = async (walletAddress, expectedRoleNumber) => {
  try {
    const contract = getReadOnlyContract();
    const currentRole = await contract.roles(walletAddress);
    if (Number(currentRole) !== expectedRoleNumber) {
      console.log(`[Smart Contract Auto-Sync] Address ${walletAddress} has on-chain role ${currentRole}, expected ${expectedRoleNumber}. Self-healing via Admin...`);
      const adminSigner = getSignerForUser({ role: 'ADMIN' });
      await assignRoleOnChain(walletAddress, expectedRoleNumber, adminSigner);
      console.log(`[Smart Contract Auto-Sync] Successfully assigned role ${expectedRoleNumber} to ${walletAddress}`);
    }
  } catch (err) {
    console.warn(`[Smart Contract Auto-Sync Warning] Could not verify/assign role: ${err.message}`);
  }
};

/**
 * Verifies and syncs default roles on-chain on application startup
 */
export const syncDefaultRoles = async () => {
  try {
    const provider = getProvider();
    const config = loadContractConfig();
    const address = process.env.BLOODCHAIN_CONTRACT_ADDRESS || config.address;

    const code = await provider.getCode(address);
    if (code.length <= 2) {
      console.warn(`[Startup Sync] No contract code found at ${address}. Skipping role sync.`);
      return;
    }

    const adminSigner = getSignerForUser({ role: 'ADMIN' });
    const contract = getContract(adminSigner);

    let currentNonce = await adminSigner.getNonce('latest');

    for (const [roleName, acc] of Object.entries(HARDHAT_DEFAULT_ACCOUNTS)) {
      if (roleName !== 'ADMIN') {
        const expectedRoleNum = ROLES[roleName];
        const currentRole = await contract.roles(acc.address);
        if (Number(currentRole) !== expectedRoleNum) {
          console.log(`[Startup Sync] Assigning role ${roleName} (${expectedRoleNum}) to ${acc.address}...`);
          const tx = await contract.assignRole(acc.address, expectedRoleNum, { nonce: currentNonce++ });
          await tx.wait(1);
          console.log(`[Startup Sync] Role ${roleName} assigned to ${acc.address}`);
        }
      }
    }
    console.log('[Startup Sync] All default on-chain participant roles verified and active.');
  } catch (err) {
    console.warn('[Startup Sync Warning] Role sync error:', err.message);
  }
};

/**
 * Parse and translate Solidity revert errors into user-friendly messages
 */
export const parseBlockchainError = (error) => {
  const message = error?.message || '';

  // Common revert strings directly from BloodChain.sol
  if (message.includes('Blood bag already exists')) return 'Blood bag already exists on the blockchain.';
  if (message.includes('Blood bag does not exist')) return 'Blood bag does not exist on the blockchain.';
  if (message.includes('Only blood bank can perform this action')) return 'Unauthorized: Only an authorized Blood Bank can perform this action.';
  if (message.includes('Only lab can perform this action')) return 'Unauthorized: Only an authorized Laboratory can perform this action.';
  if (message.includes('Only hospital can perform this action')) return 'Unauthorized: Only an authorized Hospital can perform this action.';
  if (message.includes('Only admin can perform this action')) return 'Unauthorized: Only an Admin can perform this action.';
  if (message.includes('Only current custodian can transfer')) return 'Unauthorized: Only the current custodian can transfer this blood bag.';
  if (message.includes('Hospital is not the recipient')) return 'Unauthorized: Your hospital is not the designated recipient for this blood bag.';
  if (message.includes('Bag is not ready for testing')) return 'Blood bag is not in COLLECTED state and cannot start testing.';
  if (message.includes('Bag is not under testing')) return 'Blood bag is not under active testing.';
  if (message.includes('Bag cannot be transferred in current state')) return 'Blood bag cannot be transferred in its current state (must be AVAILABLE or RECEIVED).';
  if (message.includes('Bag is not in transit')) return 'Blood bag is not in transit (status must be TRANSFERRED).';
  if (message.includes('Bag has not been received')) return 'Blood bag has not been received yet.';
  if (message.includes('Blood bag has expired')) return 'Blood bag has expired and cannot undergo this operation.';
  if (message.includes('Blood bag has not expired')) return 'Blood bag expiry date has not been reached yet.';
  if (message.includes('Bag cannot be marked expired')) return 'Blood bag cannot be marked expired in its current state.';
  if (message.includes('Recipient must be authorized')) return 'Recipient address is not an authorized Hospital or Blood Bank.';
  if (message.includes('Expiry must be after collection')) return 'Expiry date must be after collection date.';

  // Ethers reason string if present
  if (error?.reason) {
    return error.reason;
  }

  // Network connection issue
  if (message.includes('ECONNREFUSED') || message.includes('could not detect network')) {
    return 'Cannot connect to Hardhat blockchain RPC. Please verify the blockchain node is running on port 8545.';
  }

  return error?.shortMessage || error?.message || 'Blockchain transaction failed';
};

// ============================================
// AUTHORITATIVE SMART CONTRACT OPERATIONS
// ============================================

export const assignRoleOnChain = async (accountAddress, roleNumber, signer) => {
  try {
    const contract = getContract(signer);
    const tx = await contract.assignRole(accountAddress, roleNumber);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const registerBloodBagOnChain = async (bagId, bloodGroup, collectionDateSec, expiryDateSec, signer) => {
  try {
    // Self-healing: verify on-chain BLOOD_BANK role before executing transaction
    await ensureRoleOnChain(signer.address, ROLES.BLOOD_BANK);

    const contract = getContract(signer);
    const tx = await contract.registerBloodBag(
      bagId,
      bloodGroup,
      BigInt(collectionDateSec),
      BigInt(expiryDateSec)
    );
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const startTestingOnChain = async (bagId, signer) => {
  try {
    await ensureRoleOnChain(signer.address, ROLES.LAB);

    const contract = getContract(signer);
    const tx = await contract.startTesting(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const approveBloodBagOnChain = async (bagId, signer) => {
  try {
    await ensureRoleOnChain(signer.address, ROLES.LAB);

    const contract = getContract(signer);
    const tx = await contract.approveBloodBag(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const rejectBloodBagOnChain = async (bagId, signer) => {
  try {
    await ensureRoleOnChain(signer.address, ROLES.LAB);

    const contract = getContract(signer);
    const tx = await contract.rejectBloodBag(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const transferBloodBagOnChain = async (bagId, recipientAddress, signer) => {
  try {
    const contract = getContract(signer);
    const tx = await contract.transferBloodBag(bagId, recipientAddress);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const receiveBloodBagOnChain = async (bagId, signer) => {
  try {
    await ensureRoleOnChain(signer.address, ROLES.HOSPITAL);

    const contract = getContract(signer);
    const tx = await contract.receiveBloodBag(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const consumeBloodBagOnChain = async (bagId, signer) => {
  try {
    await ensureRoleOnChain(signer.address, ROLES.HOSPITAL);

    const contract = getContract(signer);
    const tx = await contract.consumeBloodBag(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const markExpiredOnChain = async (bagId, signer) => {
  try {
    const contract = getContract(signer);
    const tx = await contract.markExpired(bagId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const getBloodBagFromChain = async (bagId) => {
  try {
    const contract = getReadOnlyContract();
    const result = await contract.getBloodBag(bagId);
    const statusNum = Number(result[4]);
    return {
      bagId: result[0],
      bloodGroup: result[1],
      collectionDate: new Date(Number(result[2]) * 1000).toISOString(),
      expiryDate: new Date(Number(result[3]) * 1000).toISOString(),
      status: statusNum,
      statusName: STATUS_NAMES[statusNum] || 'UNKNOWN',
      currentCustodian: result[5],
      isExpired: Date.now() >= Number(result[3]) * 1000,
    };
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};

export const getBloodHistoryFromChain = async (bagId) => {
  try {
    const contract = getReadOnlyContract();
    const history = await contract.getBloodHistory(bagId);
    return history.map((entry) => {
      const statusNum = Number(entry.status);
      return {
        status: statusNum,
        statusName: STATUS_NAMES[statusNum] || 'UNKNOWN',
        actor: entry.actor,
        timestamp: Number(entry.timestamp),
        date: new Date(Number(entry.timestamp) * 1000).toISOString(),
        action: entry.action,
      };
    });
  } catch (error) {
    throw new Error(parseBlockchainError(error));
  }
};
