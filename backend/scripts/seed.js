import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import User from '../models/User.js';
import BloodBag from '../models/BloodBag.js';
import {
  HARDHAT_DEFAULT_ACCOUNTS,
  ROLES,
  assignRoleOnChain,
  registerBloodBagOnChain,
  startTestingOnChain,
  approveBloodBagOnChain,
  getSignerForUser,
} from '../services/blockchain.js';

dotenv.config();

const demoUsers = [
  {
    name: 'Chief Medical Officer',
    email: 'admin@bloodchain.org',
    password: 'password123',
    role: 'ADMIN',
    organizationName: 'National Blood Transfusion Authority',
    walletAddress: HARDHAT_DEFAULT_ACCOUNTS.ADMIN.address,
    privateKey: HARDHAT_DEFAULT_ACCOUNTS.ADMIN.privateKey,
  },
  {
    name: 'Blood Bank Director',
    email: 'bloodbank@bloodchain.org',
    password: 'password123',
    role: 'BLOOD_BANK',
    organizationName: 'Central Red Cross Blood Bank',
    walletAddress: HARDHAT_DEFAULT_ACCOUNTS.BLOOD_BANK.address,
    privateKey: HARDHAT_DEFAULT_ACCOUNTS.BLOOD_BANK.privateKey,
  },
  {
    name: 'Senior Serologist',
    email: 'lab@bloodchain.org',
    password: 'password123',
    role: 'LAB',
    organizationName: 'Apex Diagnostic Laboratory',
    walletAddress: HARDHAT_DEFAULT_ACCOUNTS.LAB.address,
    privateKey: HARDHAT_DEFAULT_ACCOUNTS.LAB.privateKey,
  },
  {
    name: 'Transfusion Specialist',
    email: 'hospital@bloodchain.org',
    password: 'password123',
    role: 'HOSPITAL',
    organizationName: 'City General Hospital',
    walletAddress: HARDHAT_DEFAULT_ACCOUNTS.HOSPITAL.address,
    privateKey: HARDHAT_DEFAULT_ACCOUNTS.HOSPITAL.privateKey,
  },
];

const seed = async () => {
  try {
    console.log('==================================================');
    console.log('Starting BloodChain Database & Chain Seeding...');
    console.log('==================================================');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seeder] Connected to MongoDB');

    // Clean existing users
    await User.deleteMany({});
    console.log('[Seeder] Cleared existing users from MongoDB');

    const createdUsers = [];
    for (const u of demoUsers) {
      const created = await User.create(u);
      createdUsers.push(created);
      console.log(`[User Created] ${u.role}: ${u.email} (${u.walletAddress})`);
    }

    // Try assigning on-chain roles if blockchain is running
    try {
      const adminSigner = getSignerForUser({ role: 'ADMIN' });
      console.log('[Seeder] Assigning on-chain roles via Admin signer...');

      let currentNonce = await adminSigner.getNonce('latest');
      const contract = (await import('../services/blockchain.js')).getContract(adminSigner);

      for (const u of createdUsers) {
        if (u.role !== 'ADMIN') {
          const roleNum = ROLES[u.role];
          console.log(`[Smart Contract] Assigning role ${u.role} (${roleNum}) to ${u.walletAddress} (nonce: ${currentNonce})...`);
          const tx = await contract.assignRole(u.walletAddress, roleNum, { nonce: currentNonce++ });
          await tx.wait(1);
          console.log(`[Smart Contract] Successfully assigned role ${u.role} to ${u.walletAddress}`);
        }
      }
    } catch (chainErr) {
      console.warn(`[Seeder Warning] On-chain role assignment skipped (blockchain may not be running): ${chainErr.message}`);
    }

    console.log('==================================================');
    console.log('Seeding Completed Successfully!');
    console.log('Credentials:');
    console.log('  Admin:      admin@bloodchain.org     / password123');
    console.log('  Blood Bank: bloodbank@bloodchain.org / password123');
    console.log('  Lab:        lab@bloodchain.org       / password123');
    console.log('  Hospital:   hospital@bloodchain.org  / password123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Failed]:', error);
    process.exit(1);
  }
};

seed();
