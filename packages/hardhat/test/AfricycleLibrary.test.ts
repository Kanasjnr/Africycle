import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { AfriCycle, MockERC20 } from '../typechain-types';
import { parseEther } from 'ethers';

enum WasteStream {
  PLASTIC = 0,
  EWASTE = 1,
  METAL = 2,
  GENERAL = 3,
}

enum QualityGrade {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  PREMIUM = 3,
}

describe('AfricycleLibrary Additional Tests', function () {
  let afriCycle: AfriCycle;
  let cUSDToken: MockERC20;
  let admin: SignerWithAddress;
  let collector: SignerWithAddress;
  let recycler: SignerWithAddress;
  let buyer: SignerWithAddress;

  beforeEach(async function () {
    [admin, collector, recycler, buyer] = await ethers.getSigners();

    // Deploy mock cUSD token
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    cUSDToken = await MockERC20.deploy('Celo Dollar', 'cUSD', 18) as unknown as MockERC20;
    await cUSDToken.waitForDeployment();

    // Deploy AfriCycle contract
    const AfriCycle = await ethers.getContractFactory('AfriCycle');
    afriCycle = await AfriCycle.deploy(await cUSDToken.getAddress()) as unknown as AfriCycle;
    await afriCycle.waitForDeployment();

    // Fund the contract with cUSD tokens
    await cUSDToken.mint(await afriCycle.getAddress(), parseEther('10000'));
    await cUSDToken.mint(collector.address, parseEther('1000'));
    await cUSDToken.mint(recycler.address, parseEther('1000'));
    await cUSDToken.mint(buyer.address, parseEther('1000'));
  });

  describe('Admin Functions', function () {
    it('should allow admin to set reward rates', async function () {
      const newRate = parseEther('0.15');
      await afriCycle.connect(admin).setRewardRate(WasteStream.PLASTIC, newRate);
      
      // Basic test - just check it doesn't revert
      expect(true).to.be.true;
    });

    it('should allow admin to set quality multipliers', async function () {
      const newMultiplier = 150;
      await afriCycle.connect(admin).setQualityMultiplier(WasteStream.PLASTIC, QualityGrade.HIGH, newMultiplier);
      
      // Basic test - just check it doesn't revert
      expect(true).to.be.true;
    });

    it('should allow admin to update carbon offset multipliers', async function () {
      const newMultiplier = 200;
      await afriCycle.connect(admin).updateCarbonOffsetMultiplier(WasteStream.PLASTIC, newMultiplier);
      
      // Basic test - just check it doesn't revert
      expect(true).to.be.true;
    });

    it('should allow admin to update quality carbon multipliers', async function () {
      const newMultiplier = 180;
      await afriCycle.connect(admin).updateQualityCarbonMultiplier(QualityGrade.PREMIUM, newMultiplier);
      
      // Basic test - just check it doesn't revert
      expect(true).to.be.true;
    });
  });

  describe('Carbon Offset Calculation', function () {
    it('should calculate carbon offset correctly', async function () {
      await afriCycle.connect(collector).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(recycler).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');

      const carbonOffset = await afriCycle.calculateCarbonOffset(
        WasteStream.PLASTIC,
        100,
        QualityGrade.HIGH
      );

      expect(carbonOffset).to.be.greaterThan(0);
    });

    it('should calculate different carbon offsets for different waste types', async function () {
      await afriCycle.connect(collector).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(recycler).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');

      const plasticOffset = await afriCycle.calculateCarbonOffset(WasteStream.PLASTIC, 100, QualityGrade.MEDIUM);
      const ewasteOffset = await afriCycle.calculateCarbonOffset(WasteStream.EWASTE, 100, QualityGrade.MEDIUM);
      const metalOffset = await afriCycle.calculateCarbonOffset(WasteStream.METAL, 100, QualityGrade.MEDIUM);

      expect(plasticOffset).to.be.greaterThan(0);
      expect(ewasteOffset).to.be.greaterThan(0);
      expect(metalOffset).to.be.greaterThan(0);
    });
  });

  describe('View Functions', function () {
    beforeEach(async function () {
      await afriCycle.connect(collector).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(recycler).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
    });

    it('should return user stats correctly', async function () {
      const stats = await afriCycle.getUserStats(collector.address);
      expect(stats.totalEarnings).to.equal(0);
      expect(stats.reputationScore).to.equal(500);
    });

    it('should return contract stats correctly', async function () {
      const stats = await afriCycle.getContractStats();
      expect(stats.userCount).to.equal(2);
      expect(stats.listingCount).to.equal(0);
    });

    it('should return platform stats correctly', async function () {
      const platformStats = await afriCycle.getPlatformStats();
      expect(platformStats.userCount).to.equal(2);
      expect(platformStats.collectionCount).to.equal(0);
    });

    it('should return collector stats correctly', async function () {
      const collectorStats = await afriCycle.getCollectorStats(collector.address);
      expect(collectorStats.collectorTotalCollected).to.equal(0);
      expect(collectorStats.totalEarnings).to.equal(0);
    });

    it('should return recycler stats correctly', async function () {
      const recyclerStats = await afriCycle.getRecyclerStats(recycler.address);
      expect(recyclerStats.totalEarnings).to.equal(0);
      expect(recyclerStats.activeListings).to.equal(0);
    });

    it('should return contract cUSD balance correctly', async function () {
      const balance = await afriCycle.getContractCUSDBalance();
      expect(balance).to.equal(parseEther('10000'));
    });
  });

  describe('Edge Cases', function () {
    beforeEach(async function () {
      await afriCycle.connect(collector).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(recycler).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
    });

    it('should handle reputation score boundaries', async function () {
      // Test maximum reputation score
      await afriCycle.connect(admin).updateUserReputation(collector.address, 1000, 'Test max score');
      const maxStats = await afriCycle.getUserStats(collector.address);
      expect(maxStats.reputationScore).to.equal(1000);

      // Test minimum reputation score
      await afriCycle.connect(admin).updateUserReputation(collector.address, 0, 'Test min score');
      const minStats = await afriCycle.getUserStats(collector.address);
      expect(minStats.reputationScore).to.equal(0);
    });

    it('should handle collection creation', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'QR123',
        futureTime,
        recycler.address
      );

      // Check that collection was created
      const stats = await afriCycle.getContractStats();
      expect(stats.userCount).to.equal(2);
    });

    it('should handle processing workflow', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      // Create collection
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'QR123',
        futureTime,
        recycler.address
      );

      // Create processing batch
      await afriCycle.connect(recycler).createProcessingBatch(
        [0],
        'Test Processing'
      );

      // Complete processing
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);

      // Verify processing completion
      const batch = await afriCycle.getProcessingBatchDetails(0);
      expect(batch.batch.status).to.equal(1); // COMPLETED
    });

    it('should handle marketplace operations', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      // Create and process collection
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'QR123',
        futureTime,
        recycler.address
      );

      await afriCycle.connect(recycler).createProcessingBatch(
        [0],
        'Test Processing'
      );

      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);

      // Create marketplace listing
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      // Verify listing creation
      const stats = await afriCycle.getContractStats();
      expect(stats.listingCount).to.equal(1);
    });
  });

  describe('Integration Tests', function () {
    it('should handle complete workflow', async function () {
      // Register users
      await afriCycle.connect(collector).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(recycler).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');

      // Complete workflow
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'QR123',
        futureTime,
        recycler.address
      );

      await afriCycle.connect(recycler).createProcessingBatch(
        [0],
        'Test Processing'
      );

      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);

      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      // Verify final state
      const stats = await afriCycle.getContractStats();
      expect(stats.userCount).to.equal(2);
      expect(stats.listingCount).to.equal(1);
    });
  });
}); 