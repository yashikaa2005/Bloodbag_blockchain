import { expect } from "chai";
import { network } from "hardhat";

const NOW = Math.floor(Date.now() / 1000);
const EXPIRY = NOW + 30 * 24 * 60 * 60;

describe("BloodChain", function () {

  async function deployBloodChain() {

    const { ethers } = await network.connect();

    const [admin, bloodBank, lab, hospital, unauthorized] =
        await ethers.getSigners();

    const BloodChain =
        await ethers.getContractFactory("BloodChain");

    const bloodChain =
        await BloodChain.deploy();

    await bloodChain.waitForDeployment();

    return {
        bloodChain,
        admin,
        bloodBank,
        lab,
        hospital,
        unauthorized
    };
}

  describe("Deployment and Roles", function () {

    it("should assign ADMIN role to deployer", async function () {

      const {
        bloodChain,
        admin
      } = await deployBloodChain();

      expect(
        await bloodChain.roles(admin.address)
      ).to.equal(1n);
    });

    it("should allow admin to assign roles", async function () {

      const {
        bloodChain,
        admin,
        bloodBank
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      expect(
        await bloodChain.roles(bloodBank.address)
      ).to.equal(2n);
    });

  });

  describe("Blood Bag Registration", function () {

    it("should allow blood bank to register a blood bag", async function () {

      const {
        bloodChain,
        admin,
        bloodBank
      } = await deployBloodChain();

      // Assign Blood Bank role
      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      const collectionDate = NOW;
      const expiryDate = EXPIRY;

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00001",
          "O+",
          collectionDate,
          expiryDate
        );

      const bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00001"
        );

      expect(bag[0]).to.equal(
        "BC-BAG-2026-00001"
      );

      expect(bag[1]).to.equal("O+");

      // COLLECTED = 0
      expect(bag[4]).to.equal(0n);

      expect(bag[5]).to.equal(
        bloodBank.address
      );
    });

    it("should reject duplicate blood bag IDs", async function () {

      const {
        bloodChain,
        admin,
        bloodBank
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00001",
          "O+",
          NOW,
          EXPIRY
        );

      await expect(
        bloodChain
          .connect(bloodBank)
          .registerBloodBag(
            "BC-BAG-2026-00001",
            "O+",
            NOW,
            EXPIRY
          )
      ).to.be.revertedWith(
        "Blood bag already exists"
      );
    });

    it("should reject registration by unauthorized user", async function () {

      const {
        bloodChain,
        unauthorized
      } = await deployBloodChain();

      await expect(
        bloodChain
          .connect(unauthorized)
          .registerBloodBag(
            "BC-BAG-2026-00002",
            "A+",
            NOW,
            EXPIRY
          )
      ).to.be.revertedWith(
        "Only blood bank can perform this action"
      );
    });

  });

  describe("Testing and Approval", function () {

    it("should allow lab to test and approve a blood bag", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab
      } = await deployBloodChain();

      // Assign roles
      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      // Register
      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00003",
          "A+",
          NOW,
          EXPIRY
        );

      // Start testing
      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00003"
        );

      let bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00003"
        );

      // TESTING = 1
      expect(bag[4]).to.equal(1n);

      // Approve
      await bloodChain
        .connect(lab)
        .approveBloodBag(
          "BC-BAG-2026-00003"
        );

      bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00003"
        );

      // AVAILABLE = 4
      expect(bag[4]).to.equal(4);
    });

    it("should allow lab to reject a blood bag", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00004",
          "B-",
          NOW,
          EXPIRY
        );

      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00004"
        );

      await bloodChain
        .connect(lab)
        .rejectBloodBag(
          "BC-BAG-2026-00004"
        );

      const bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00004"
        );

      // REJECTED = 3
      expect(bag[4]).to.equal(3);
    });

  });

  describe("Transfer and Receiving", function () {

    it("should transfer a blood bag from blood bank to hospital", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab,
        hospital
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          hospital.address,
          4
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00005",
          "AB+",
          NOW,
          EXPIRY
        );

      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00005"
        );

      await bloodChain
        .connect(lab)
        .approveBloodBag(
          "BC-BAG-2026-00005"
        );

      await bloodChain
        .connect(bloodBank)
        .transferBloodBag(
          "BC-BAG-2026-00005",
          hospital.address
        );

      const bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00005"
        );

      // TRANSFERRED = 5
      expect(bag[4]).to.equal(5);

      expect(bag[5]).to.equal(
        hospital.address
      );
    });

    it("should allow hospital to receive the blood bag", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab,
        hospital
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          hospital.address,
          4
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00006",
          "O-",
          NOW,
          EXPIRY
        );

      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00006"
        );

      await bloodChain
        .connect(lab)
        .approveBloodBag(
          "BC-BAG-2026-00006"
        );

      await bloodChain
        .connect(bloodBank)
        .transferBloodBag(
          "BC-BAG-2026-00006",
          hospital.address
        );

      await bloodChain
        .connect(hospital)
        .receiveBloodBag(
          "BC-BAG-2026-00006"
        );

      const bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00006"
        );

      // RECEIVED = 6
      expect(bag[4]).to.equal(6);
    });

  });

  describe("Consumption", function () {

    it("should allow hospital to consume received blood bag", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab,
        hospital
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          hospital.address,
          4
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00007",
          "AB-",
          NOW,
          EXPIRY
        );

      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00007"
        );

      await bloodChain
        .connect(lab)
        .approveBloodBag(
          "BC-BAG-2026-00007"
        );

      await bloodChain
        .connect(bloodBank)
        .transferBloodBag(
          "BC-BAG-2026-00007",
          hospital.address
        );

      await bloodChain
        .connect(hospital)
        .receiveBloodBag(
          "BC-BAG-2026-00007"
        );

      await bloodChain
        .connect(hospital)
        .consumeBloodBag(
          "BC-BAG-2026-00007"
        );

      const bag =
        await bloodChain.getBloodBag(
          "BC-BAG-2026-00007"
        );

      // CONSUMED = 7
      expect(bag[4]).to.equal(7);
    });

  });

  describe("Security Rules", function () {

    it("should prevent rejected blood bags from being transferred", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        lab,
        hospital
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          lab.address,
          3
        );

      await bloodChain
        .connect(admin)
        .assignRole(
          hospital.address,
          4
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00008",
          "A-",
          NOW,
          EXPIRY
        );

      await bloodChain
        .connect(lab)
        .startTesting(
          "BC-BAG-2026-00008"
        );

      await bloodChain
        .connect(lab)
        .rejectBloodBag(
          "BC-BAG-2026-00008"
        );

      await expect(
        bloodChain
          .connect(bloodBank)
          .transferBloodBag(
            "BC-BAG-2026-00008",
            hospital.address
          )
      ).to.be.revertedWith(
        "Bag cannot be transferred in current state"
      );
    });

    it("should prevent unauthorized users from approving blood bags", async function () {

      const {
        bloodChain,
        admin,
        bloodBank,
        unauthorized
      } = await deployBloodChain();

      await bloodChain
        .connect(admin)
        .assignRole(
          bloodBank.address,
          2
        );

      await bloodChain
        .connect(bloodBank)
        .registerBloodBag(
          "BC-BAG-2026-00009",
          "O+",
          NOW,
          EXPIRY
        );

      await expect(
        bloodChain
          .connect(unauthorized)
          .approveBloodBag(
            "BC-BAG-2026-00009"
          )
      ).to.be.revertedWith(
        "Only lab can perform this action"
      );
    });

  });

});