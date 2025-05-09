import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import dotenv from 'dotenv';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AfriCycle, MockERC20 } from "../typechain-types";

// Load environment variables
dotenv.config();

describe('AfriCycle', () => {
  let africycle: AfriCycle;
  let mockCUSD: MockERC20;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];

  // Constants
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const COLLECTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COLLECTOR_ROLE"));
  const COLLECTION_POINT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COLLECTION_POINT_ROLE"));
  const RECYCLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RECYCLER_ROLE"));
  const CORPORATE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CORPORATE_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  const EMERGENCY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE"));
  const WASTE_STREAM_PLASTIC = 0;
  const WASTE_STREAM_EWASTE = 1;
  const WASTE_STREAM_METAL = 2;
  const WASTE_STREAM_GENERAL = 3;

  const QUALITY_GRADE_LOW = 0;
  const QUALITY_GRADE_MEDIUM = 1;
  const QUALITY_GRADE_HIGH = 2;
  const QUALITY_GRADE_PREMIUM = 3;

  const STATUS_PENDING = 0;
  const STATUS_VERIFIED = 1;
  const STATUS_REJECTED = 2;
  const STATUS_IN_PROGRESS = 3;
  const STATUS_COMPLETED = 4;
  const STATUS_CANCELLED = 5;

  async function deployAfriCycleFixture() {
    const [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // Deploy mock cUSD token
    const MockToken = await ethers.getContractFactory('MockERC20');
    const mockCUSD = await MockToken.deploy('Mock cUSD', 'mcUSD', 18);
    await mockCUSD.mint(owner.address, ethers.parseEther('10000'));

    // Deploy AfriCycle contract
    const AfriCycle = await ethers.getContractFactory('AfriCycle');
    const africycle = await AfriCycle.deploy(await mockCUSD.getAddress());

    // Transfer some tokens to the contract for rewards
    await mockCUSD.connect(owner).transfer(await africycle.getAddress(), ethers.parseEther('5000'));

    // Grant roles to owner
    await africycle.grantRole(ADMIN_ROLE, owner.address);
    await africycle.grantRole(VERIFIER_ROLE, owner.address);

    return {
      africycle,
      mockCUSD,
      owner,
      addr1,
      addr2,
      addr3,
      addrs
    };
  }

  beforeEach(async function () {
    const { africycle: _africycle, mockCUSD: _mockCUSD, owner: _owner, addr1: _addr1, addr2: _addr2, addr3: _addr3, addrs: _addrs } = await loadFixture(deployAfriCycleFixture);
    africycle = _africycle;
    mockCUSD = _mockCUSD;
    owner = _owner;
    addr1 = _addr1;
    addr2 = _addr2;
    addr3 = _addr3;
    addrs = _addrs;
  });

  describe('Deployment', () => {
    it('Should set the correct admin', async () => {
      expect(await africycle.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it('Should set the correct cUSD token address', async () => {
      expect(await africycle.cUSDToken()).to.equal(await mockCUSD.getAddress());
    });

    it('Should initialize reward rates correctly', async () => {
      expect(await africycle.rewardRates(WASTE_STREAM_PLASTIC)).to.equal(ethers.parseEther('0.5'));
      expect(await africycle.rewardRates(WASTE_STREAM_EWASTE)).to.equal(ethers.parseEther('2.0'));
      expect(await africycle.rewardRates(WASTE_STREAM_METAL)).to.equal(ethers.parseEther('1.0'));
      expect(await africycle.rewardRates(WASTE_STREAM_GENERAL)).to.equal(ethers.parseEther('0.2'));
    });

    it('Should initialize quality multipliers correctly', async () => {
      expect(await africycle.qualityMultipliers(WASTE_STREAM_PLASTIC, QUALITY_GRADE_LOW)).to.equal(8000);
      expect(await africycle.qualityMultipliers(WASTE_STREAM_PLASTIC, QUALITY_GRADE_MEDIUM)).to.equal(10000);
      expect(await africycle.qualityMultipliers(WASTE_STREAM_PLASTIC, QUALITY_GRADE_HIGH)).to.equal(12000);
      expect(await africycle.qualityMultipliers(WASTE_STREAM_PLASTIC, QUALITY_GRADE_PREMIUM)).to.equal(15000);
    });
  });

  describe('User Management', () => {
    it('Should register a user', async () => {
      await expect(africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      )).to.emit(africycle, 'UserRegistered')
        .withArgs(addr1.address, "John Doe", "Location A");
    });

    it('Should verify a user', async () => {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await expect(africycle.verifyUser(addr1.address))
        .to.emit(africycle, 'UserVerified')
        .withArgs(addr1.address);
    });

    it('Should not allow duplicate user registration', async () => {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await expect(africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      )).to.be.revertedWith('Already registered');
    });

    it('Should not allow unregistered user to be verified', async () => {
      await expect(africycle.verifyUser(addr1.address))
        .to.be.revertedWith('User not registered');
    });

    it('Should not allow already verified user to be verified again', async () => {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.verifyUser(addr1.address);
      await expect(africycle.verifyUser(addr1.address))
        .to.be.revertedWith('Already verified');
    });

    it('Should not allow empty name registration', async () => {
      await expect(africycle.connect(addr1).registerUser(
        "",
        "Location A",
        "Contact Info"
      )).to.be.revertedWith('Name required');
    });

    it('Should not allow empty location registration', async () => {
      await expect(africycle.connect(addr1).registerUser(
        "John Doe",
        "",
        "Contact Info"
      )).to.be.revertedWith('Location required');
    });
  });

  describe('Collection Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await mockCUSD.transfer(await africycle.getAddress(), ethers.parseEther("1000"));
    });

    it('Should create a collection', async function () {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.emit(africycle, 'CollectionCreated');
    });

    it('Should verify a collection', async function () {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await expect(africycle.verifyCollection(0, QUALITY_GRADE_HIGH))
        .to.emit(africycle, 'CollectionVerified');
    });

    it('Should reject a collection', async function () {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await expect(africycle.rejectCollection(0, "Invalid quality"))
        .to.emit(africycle, 'CollectionRejected');
    });

    it('Should handle invalid waste stream', async () => {
      await expect(africycle.connect(addr1).createCollection(
        4, // Invalid waste stream (enum has only 4 values: 0-3)
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.reverted;
    });

    it('Should not allow non-collector to create collection', async () => {
      await expect(africycle.connect(addr2).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('Caller is not a collector');
    });

    it('Should not allow empty location in collection', async () => {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('Location required');
    });

    it('Should not allow empty QR code in collection', async () => {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "",
        "ipfs://QmHash"
      )).to.be.revertedWith('QR code required');
    });

    it('Should not allow empty image hash in collection', async () => {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        ""
      )).to.be.revertedWith('Image hash required');
    });

    it('Should not allow verification of non-existent collection', async () => {
      await expect(africycle.verifyCollection(999, QUALITY_GRADE_HIGH))
        .to.be.reverted;
    });

    it('Should not allow verification of already verified collection', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await expect(africycle.verifyCollection(0, QUALITY_GRADE_HIGH))
        .to.be.revertedWith('Not pending');
    });

    it('Should not allow rejection of non-existent collection', async () => {
      await expect(africycle.rejectCollection(999, "Invalid"))
        .to.be.revertedWith('Collection does not exist');
    });

    it('Should not allow rejection of already verified collection', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await expect(africycle.rejectCollection(0, "Invalid"))
        .to.be.revertedWith('Not pending');
    });
  });

  describe('Processing Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should create a processing batch', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await expect(africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      )).to.emit(africycle, 'ProcessingBatchCreated');
    });

    it('Should complete processing', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      );
      await expect(africycle.connect(addr3).completeProcessing(
        0,
        900,
        QUALITY_GRADE_HIGH,
        100
      )).to.emit(africycle, 'ProcessingCompleted');
    });

    it('Should not allow empty processing batch', async () => {
      await expect(africycle.connect(addr3).createProcessingBatch(
        [],
        "Processing plastic into pellets"
      )).to.be.revertedWith('No collections');
    });

    it('Should not allow processing of unverified collections', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await expect(africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      )).to.be.revertedWith('Collection not verified');
    });

    it('Should not allow processing of already processed collections', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      );
      await expect(africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      )).to.be.revertedWith('Already processed');
    });

    it('Should not allow mixed waste types in processing batch', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_EWASTE,
        1000,
        "Location Y",
        "QR456",
        "ipfs://QmHash2"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.verifyCollection(1, QUALITY_GRADE_HIGH);
      await expect(africycle.connect(addr3).createProcessingBatch(
        [0, 1],
        "Processing mixed waste"
      )).to.be.revertedWith('Mixed waste types');
    });
  });

  describe('Marketplace Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should create a listing', async () => {
      await expect(africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.emit(africycle, 'ListingCreated');
    });

    it('Should update a listing', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );
      await expect(africycle.connect(addr3).updateListing(
        0,
        800,
        ethers.parseEther('1.2')
      )).to.emit(africycle, 'ListingUpdated');
    });

    it('Should cancel a listing', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );
      await expect(africycle.connect(addr3).cancelListing(0))
        .to.emit(africycle, 'ListingCancelled');
    });

    it('Should not allow non-recycler to create listing', async () => {
      await expect(africycle.connect(addr1).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.be.revertedWith('Caller is not a recycler');
    });

    it('Should not allow zero amount in listing', async () => {
      await expect(africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        0,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.be.reverted;
    });

    it('Should not allow zero price in listing', async () => {
      await expect(africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        0,
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.be.reverted;
    });

    it('Should not allow update of non-existent listing', async () => {
      await expect(africycle.connect(addr3).updateListing(
        999,
        800,
        ethers.parseEther('1.2')
      )).to.be.reverted;
    });

    it('Should not allow cancellation of non-existent listing', async () => {
      await expect(africycle.connect(addr3).cancelListing(999))
        .to.be.reverted;
    });
  });

  describe('Contract Administration', () => {
    it('Should pause and unpause the contract', async () => {
      await expect(africycle.pause())
        .to.emit(africycle, 'ContractPaused')
        .withArgs(owner.address);
      await expect(africycle.unpause())
        .to.emit(africycle, 'ContractUnpaused')
        .withArgs(owner.address);
    });

    it('Should update reward rates', async () => {
      const newRate = ethers.parseEther('0.6');
      await expect(africycle.setRewardRate(WASTE_STREAM_PLASTIC, newRate))
        .to.emit(africycle, 'RewardRateUpdated')
        .withArgs(WASTE_STREAM_PLASTIC, newRate);
      expect(await africycle.rewardRates(WASTE_STREAM_PLASTIC)).to.equal(newRate);
    });

    it('Should perform emergency withdrawal', async () => {
      const amount = ethers.parseEther('1000');
      await mockCUSD.transfer(await africycle.getAddress(), amount);
      await africycle.pause();
      await expect(africycle.emergencyWithdraw(await mockCUSD.getAddress(), amount))
        .to.emit(africycle, 'EmergencyWithdrawal')
        .withArgs(owner.address, await mockCUSD.getAddress(), amount);
    });

    it('Should not allow emergency withdrawal when not paused', async () => {
      const amount = ethers.parseEther('1000');
      await mockCUSD.transfer(await africycle.getAddress(), amount);
      await expect(africycle.emergencyWithdraw(await mockCUSD.getAddress(), amount))
        .to.be.revertedWith('Pausable: not paused');
    });

    it('Should not allow emergency withdrawal of zero amount', async () => {
      await africycle.pause();
      await expect(africycle.emergencyWithdraw(await mockCUSD.getAddress(), 0))
        .to.be.revertedWith('Amount must be positive');
    });

    it('Should not allow setting reward rate for invalid waste stream', async () => {
      await expect(africycle.setRewardRate(4, ethers.parseEther('0.6')))
        .to.be.reverted;
    });
  });

  describe('Access Control', () => {
    it('Should not allow non-admin to pause contract', async () => {
      await expect(africycle.connect(addr1).pause())
        .to.be.revertedWith('Caller is not an admin');
    });

    it('Should not allow non-admin to update reward rates', async () => {
      await expect(africycle.connect(addr1).setRewardRate(WASTE_STREAM_PLASTIC, ethers.parseEther('0.6')))
        .to.be.revertedWith('Caller is not an admin');
    });

    it('Should not allow non-verifier to verify collections', async () => {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await expect(africycle.connect(addr1).verifyCollection(0, QUALITY_GRADE_HIGH))
        .to.be.revertedWith('Caller is not a verifier');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
    });

    it('Should handle zero amount collections', async () => {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        0,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('Weight must be positive');
    });

    it('Should handle maximum collection weight', async () => {
      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1001, // MAX_COLLECTION_WEIGHT + 1
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('Weight exceeds maximum');
    });

    it('Should handle invalid quality grade', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await expect(africycle.verifyCollection(0, 4)) // Invalid quality grade
        .to.be.reverted;
    });
  });

  describe('E-Waste Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
    });

    it('Should add e-waste details to collection', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_EWASTE,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      const componentCounts = [2, 3, 1, 4]; // CPU, BATTERY, PCB, OTHER
      await expect(africycle.connect(addr1).addEWasteDetails(
        0,
        componentCounts,
        "SN12345",
        "Manufacturer A",
        1000
      )).to.emit(africycle, 'EWasteDetailsAdded');
    });

    it('Should not allow e-waste details for non-e-waste collection', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      const componentCounts = [2, 3, 1, 4];
      await expect(africycle.connect(addr1).addEWasteDetails(
        0,
        componentCounts,
        "SN12345",
        "Manufacturer A",
        1000
      )).to.be.revertedWith('Not e-waste');
    });

    it('Should not allow invalid component counts', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_EWASTE,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      const componentCounts = [2, 3, 1]; // Missing OTHER component
      await expect(africycle.connect(addr1).addEWasteDetails(
        0,
        componentCounts,
        "SN12345",
        "Manufacturer A",
        1000
      )).to.be.revertedWith('Invalid component count');
    });
  });

  describe('Impact Credit Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should generate impact credit from processing', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic"
      );
      await expect(africycle.connect(addr3).completeProcessing(
        0,
        90,
        QUALITY_GRADE_HIGH,
        10
      )).to.emit(africycle, 'ImpactCreditMinted');
    });

    it('Should transfer impact credit', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic"
      );
      await africycle.connect(addr3).completeProcessing(
        0,
        90,
        QUALITY_GRADE_HIGH,
        10
      );

      await expect(africycle.connect(addr3).transferImpactCredit(0, addr1.address))
        .to.emit(africycle, 'ImpactCreditTransferred')
        .withArgs(0, addr3.address, addr1.address);
    });

    it('Should verify impact credit', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic"
      );
      await africycle.connect(addr3).completeProcessing(
        0,
        90,
        QUALITY_GRADE_HIGH,
        10
      );

      await expect(africycle.verifyImpactCredit(0, "Verification proof"))
        .to.emit(africycle, 'ImpactCreditVerified')
        .withArgs(0, owner.address, "Verification proof");
    });

    it('Should burn impact credit', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic"
      );
      await africycle.connect(addr3).completeProcessing(
        0,
        90,
        QUALITY_GRADE_HIGH,
        10
      );

      await expect(africycle.connect(addr3).burnImpactCredit(0))
        .to.emit(africycle, 'ImpactCreditBurned')
        .withArgs(0, addr3.address);
    });
  });

  describe('User Profile Management', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
    });

    it('Should update user profile', async () => {
      await expect(africycle.connect(addr1).updateUserProfile(
        "John Doe Updated",
        "Location B",
        "New Contact Info"
      )).to.emit(africycle, 'UserProfileUpdated');
    });

    it('Should update user reputation', async () => {
      await expect(africycle.updateUserReputation(addr1.address, 200))
        .to.emit(africycle, 'UserReputationUpdated');
    });

    it('Should not allow profile update too soon', async () => {
      await africycle.connect(addr1).updateUserProfile(
        "John Doe Updated",
        "Location B",
        "New Contact Info"
      );
      await expect(africycle.connect(addr1).updateUserProfile(
        "John Doe Updated Again",
        "Location C",
        "New Contact Info Again"
      )).to.be.revertedWith('Too soon to update profile');
    });

    it('Should not allow invalid reputation score', async () => {
      await expect(africycle.updateUserReputation(addr1.address, 1001))
        .to.be.revertedWith('Score too high');
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should create multiple collections in batch', async () => {
      const wasteTypes = [WASTE_STREAM_PLASTIC, WASTE_STREAM_PLASTIC];
      const weights = [100, 200];
      const locations = ["Location X", "Location Y"];
      const qrCodes = ["QR123", "QR456"];
      const imageHashes = ["ipfs://QmHash1", "ipfs://QmHash2"];

      await expect(africycle.connect(addr1).batchCreateCollections(
        wasteTypes,
        weights,
        locations,
        qrCodes,
        imageHashes
      )).to.emit(africycle, 'BatchOperationCompleted');
    });

    // it('Should update multiple listings in batch', async () => {
    //   // Create initial listings
    //   await africycle.connect(addr3).createListing(
    //     WASTE_STREAM_PLASTIC,
    //     900,
    //     ethers.parseEther('1.0'),
    //     QUALITY_GRADE_HIGH,
    //     'High quality recycled plastic pellets',
    //     100
    //   );
    //   await africycle.connect(addr3).createListing(
    //     WASTE_STREAM_PLASTIC,
    //     800,
    //     ethers.parseEther('1.2'),
    //     QUALITY_GRADE_HIGH,
    //     'High quality recycled plastic pellets',
    //     100
    //   );

    //   const listingIds = [0, 1];
    //   const newAmounts = [800, 700];
    //   const newPrices = [ethers.parseEther('1.1'), ethers.parseEther('1.3')];

    //   await expect(africycle.connect(addr3).batchUpdateListings(
    //     listingIds,
    //     newAmounts,
    //     newPrices
    //   )).to.emit(africycle, 'BatchOperationCompleted');
    // });

    it('Should not allow batch operations exceeding max size', async () => {
      const wasteTypes = new Array(51).fill(WASTE_STREAM_PLASTIC);
      const weights = new Array(51).fill(100);
      const locations = new Array(51).fill("Location X");
      const qrCodes = new Array(51).fill("QR123");
      const imageHashes = new Array(51).fill("ipfs://QmHash");

      await expect(africycle.connect(addr1).batchCreateCollections(
        wasteTypes,
        weights,
        locations,
        qrCodes,
        imageHashes
      )).to.be.revertedWith('Batch too large');
    });
  });

  describe('Additional Marketplace Scenarios', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should purchase partial amount from listing', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );

      // Mint tokens to addr1 and approve spending
      await mockCUSD.mint(addr1.address, ethers.parseEther('1000'));
      await mockCUSD.connect(addr1).approve(await africycle.getAddress(), ethers.parseEther('1000'));

      await expect(africycle.connect(addr1).purchaseListing(0, 500))
        .to.emit(africycle, 'ListingPurchased');
    });

    it('Should handle maximum active listings', async () => {
      // Create maximum number of listings
      for (let i = 0; i < 20; i++) {
        await africycle.connect(addr3).createListing(
          WASTE_STREAM_PLASTIC,
          900,
          ethers.parseEther('1.0'),
          QUALITY_GRADE_HIGH,
          'High quality recycled plastic pellets',
          100
        );
      }

      await expect(africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.be.revertedWith('Too many active listings');
    });

    it('Should handle insufficient token approval', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );

      await expect(africycle.connect(addr1).purchaseListing(0, 900))
        .to.be.revertedWith('ERC20: insufficient allowance');
    });
  });

  describe('Additional Edge Cases', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
    });

    it('Should handle suspended user operations', async () => {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
      await africycle.suspendUser(addr1.address, "Test suspension");
      const isSuspended = await africycle.isSuspended(addr1.address);
      expect(isSuspended).to.be.true;

      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('User is suspended');
    });

    it('Should handle blacklisted user operations', async () => {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
      await africycle.blacklistUser(addr1.address, "Test blacklist");
      const isBlacklisted = await africycle.isBlacklisted(addr1.address);
      expect(isBlacklisted).to.be.true;

      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('User is blacklisted');
    });

    it('Should handle contract pause state', async () => {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
      await africycle.pause();
      expect(await africycle.paused()).to.be.true;

      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('Pausable: paused');
    });

    it('Should handle reentrancy protection', async () => {
      // This test would require a malicious contract that tries to reenter
      // during a purchase operation. The ReentrancyGuard should prevent this.
      // Implementation would require a separate malicious contract.
    });
  });

  describe('Getter Functions', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should get user profile', async () => {
      const profile = await africycle.userProfiles(addr1.address);
      expect(profile.name).to.equal("John Doe");
      expect(profile.location).to.equal("Location A");
      expect(profile.contactInfo).to.equal("Contact Info");
      expect(profile.isVerified).to.be.false;
      expect(profile.reputationScore).to.equal(100);
      expect(profile.registrationDate).to.be.gt(0);
    });

    it('Should get collection details', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      const collection = await africycle.getCollectionDetails(0);
      expect(collection.collection.wasteType).to.equal(WASTE_STREAM_PLASTIC);
      expect(collection.collection.weight).to.equal(100);
      expect(collection.collection.location).to.equal("Location X");
      expect(collection.collection.qrCode).to.equal("QR123");
      expect(collection.collection.imageHash).to.equal("ipfs://QmHash");
      expect(collection.collection.status).to.equal(STATUS_PENDING);
    });

    it('Should get processing batch details', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      );
      const batch = await africycle.getProcessingBatchDetails(0);
      expect(batch.batch.processor).to.equal(addr3.address);
      expect(batch.batch.processDescription).to.equal("Processing plastic into pellets");
      expect(batch.batch.status).to.equal(STATUS_IN_PROGRESS);
    });

    it('Should get listing details', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );
      const listing = await africycle.listings(0);
      expect(listing.wasteType).to.equal(WASTE_STREAM_PLASTIC);
      expect(listing.amount).to.equal(900);
      expect(listing.pricePerUnit).to.equal(ethers.parseEther('1.0'));
      expect(listing.quality).to.equal(QUALITY_GRADE_HIGH);
      expect(listing.description).to.equal('High quality recycled plastic pellets');
      expect(listing.isActive).to.be.true;
    });

    it('Should get impact credit details', async () => {
      // Create and complete processing to generate impact credit
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.connect(addr3).createProcessingBatch(
        [0],
        "Processing plastic into pellets"
      );
      await africycle.connect(addr3).completeProcessing(
        0,
        900,
        QUALITY_GRADE_HIGH,
        100
      );

      const credit = await africycle.impactCredits(0);
      expect(credit.amount).to.equal(900);
      expect(credit.wasteType).to.equal(WASTE_STREAM_PLASTIC);
      expect(credit.carbonOffset).to.equal(100);
    });

    it('Should get contract statistics', async () => {
      const totalProcessed = await africycle.totalProcessed(WASTE_STREAM_PLASTIC);
      expect(totalProcessed).to.equal(0);
    });

    it('Should get role members', async () => {
      const hasRole = await africycle.hasRole(COLLECTOR_ROLE, addr1.address);
      expect(hasRole).to.be.true;
    });

    it('Should get user roles', async () => {
      const hasRole = await africycle.hasRole(COLLECTOR_ROLE, addr1.address);
      expect(hasRole).to.be.true;
    });
  });

  describe('Additional Functionality Tests', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should handle user suspension and reactivation', async () => {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
      await africycle.suspendUser(addr1.address, "Test suspension");
      const isSuspended = await africycle.isSuspended(addr1.address);
      expect(isSuspended).to.be.true;

      await africycle.unsuspendUser(addr1.address);
      const updatedIsSuspended = await africycle.isSuspended(addr1.address);
      expect(updatedIsSuspended).to.be.false;
    });

    it('Should handle user blacklisting and removal', async () => {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
      await africycle.blacklistUser(addr1.address, "Test blacklist");
      const isBlacklisted = await africycle.isBlacklisted(addr1.address);
      expect(isBlacklisted).to.be.true;

      await africycle.removeFromBlacklist(addr1.address);
      const updatedIsBlacklisted = await africycle.isBlacklisted(addr1.address);
      expect(updatedIsBlacklisted).to.be.false;
    });

    it('Should handle reward distribution', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      
      const initialBalance = await mockCUSD.balanceOf(addr1.address);
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      const finalBalance = await mockCUSD.balanceOf(addr1.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it('Should handle batch reward distribution', async () => {
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      );
      await africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        1000,
        "Location Y",
        "QR456",
        "ipfs://QmHash2"
      );

      const initialBalance = await mockCUSD.balanceOf(addr1.address);
      await africycle.verifyCollection(0, QUALITY_GRADE_HIGH);
      await africycle.verifyCollection(1, QUALITY_GRADE_HIGH);
      const finalBalance = await mockCUSD.balanceOf(addr1.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe('User Suspension and Blacklisting', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.grantRole(ADMIN_ROLE, owner.address);
    });

    it('Should suspend a user', async () => {
      await africycle.suspendUser(addr1.address, "Test suspension");
      const isSuspended = await africycle.isSuspended(addr1.address);
      expect(isSuspended).to.be.true;

      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('User is suspended');
    });

    it('Should blacklist a user', async () => {
      await africycle.blacklistUser(addr1.address, "Test blacklist");
      const isBlacklisted = await africycle.isBlacklisted(addr1.address);
      expect(isBlacklisted).to.be.true;

      await expect(africycle.connect(addr1).createCollection(
        WASTE_STREAM_PLASTIC,
        100,
        "Location X",
        "QR123",
        "ipfs://QmHash"
      )).to.be.revertedWith('User is blacklisted');
    });
  });

  describe('Marketplace Operations', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
      await africycle.connect(addr3).registerUser(
        "Recycler A",
        "Location C",
        "Contact Info"
      );
      await africycle.grantRole(RECYCLER_ROLE, addr3.address);
      await africycle.verifyUser(addr3.address);
    });

    it('Should create a listing', async () => {
      await expect(africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      )).to.emit(africycle, 'ListingCreated');
    });

    it('Should purchase a listing', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );

      // Mint tokens to addr1 and approve spending
      await mockCUSD.mint(addr1.address, ethers.parseEther('1000'));
      await mockCUSD.connect(addr1).approve(await africycle.getAddress(), ethers.parseEther('1000'));

      await expect(africycle.connect(addr1).purchaseListing(0, 500))
        .to.emit(africycle, 'ListingPurchased');
    });

    it('Should not allow purchase with insufficient funds', async () => {
      await africycle.connect(addr3).createListing(
        WASTE_STREAM_PLASTIC,
        900,
        ethers.parseEther('1.0'),
        QUALITY_GRADE_HIGH,
        'High quality recycled plastic pellets',
        100
      );

      await expect(africycle.connect(addr1).purchaseListing(0, 900))
        .to.be.revertedWith('ERC20: insufficient allowance');
    });
  });

  describe('Verification Thresholds', () => {
    beforeEach(async function () {
      await africycle.grantRole(ADMIN_ROLE, owner.address);
    });

    it('Should set verification threshold', async () => {
      const newThreshold = 1000;
      await expect(africycle.setVerificationThreshold(WASTE_STREAM_PLASTIC, newThreshold))
        .to.emit(africycle, 'VerificationThresholdUpdated')
        .withArgs(WASTE_STREAM_PLASTIC, newThreshold);
    });

    it('Should not allow non-admin to set verification threshold', async () => {
      await expect(africycle.connect(addr1).setVerificationThreshold(WASTE_STREAM_PLASTIC, 1000))
        .to.be.revertedWith('Caller is not an admin');
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async function () {
      await africycle.connect(addr1).registerUser(
        "John Doe",
        "Location A",
        "Contact Info"
      );
      await africycle.grantRole(COLLECTOR_ROLE, addr1.address);
    });

    it('Should create multiple collections in batch', async () => {
      const wasteTypes = [WASTE_STREAM_PLASTIC, WASTE_STREAM_PLASTIC];
      const weights = [100, 200];
      const locations = ["Location X", "Location Y"];
      const qrCodes = ["QR123", "QR456"];
      const imageHashes = ["ipfs://QmHash1", "ipfs://QmHash2"];

      await expect(africycle.connect(addr1).batchCreateCollections(
        wasteTypes,
        weights,
        locations,
        qrCodes,
        imageHashes
      )).to.emit(africycle, 'BatchOperationCompleted');
    });

    it('Should not allow batch operations exceeding max size', async () => {
      const wasteTypes = new Array(51).fill(WASTE_STREAM_PLASTIC);
      const weights = new Array(51).fill(100);
      const locations = new Array(51).fill("Location X");
      const qrCodes = new Array(51).fill("QR123");
      const imageHashes = new Array(51).fill("ipfs://QmHash");

      await expect(africycle.connect(addr1).batchCreateCollections(
        wasteTypes,
        weights,
        locations,
        qrCodes,
        imageHashes
      )).to.be.revertedWith('Batch too large');
    });
  });
});
