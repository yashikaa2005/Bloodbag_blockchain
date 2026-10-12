import mongoose from 'mongoose';

const bloodBagSchema = new mongoose.Schema(
  {
    bagId: {
      type: String,
      required: [true, 'Blood Bag ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      uppercase: true,
      trim: true,
    },
    collectionDate: {
      type: Date,
      required: [true, 'Collection date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    // Safe de-identified donor reference (no PII on-chain or off-chain)
    donorReference: {
      type: String,
      default: function () {
        return `DNR-${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },
    volumeMl: {
      type: Number,
      default: 450,
    },
    location: {
      type: String,
      default: 'Main Blood Bank Storage',
    },
    storageCondition: {
      type: String,
      default: 'Refrigerated (2°C - 6°C)',
    },
    qrCodeData: {
      type: String, // Base64 data URL of the generated QR code
      default: '',
    },
    verificationUrl: {
      type: String,
      default: '',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    registeredByOrg: {
      type: String,
      default: '',
    },
    lastTransactionHash: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const BloodBag = mongoose.model('BloodBag', bloodBagSchema);
export default BloodBag;
