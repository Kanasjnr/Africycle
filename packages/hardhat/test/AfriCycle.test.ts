import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { AfriCycle, MockERC20 } from '../typechain-types';
import { parseEther } from 'ethers';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { EventLog } from 'ethers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';

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

enum Status {
  PENDING = 0,
  VERIFIED = 1,
  REJECTED = 2,
  IN_PROGRESS = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  ACTIVE = 6,
}

enum EWasteComponent {
  CPU = 0,
  BATTERY = 1,
  PCB = 2,
  OTHER = 3,
}

enum ProcessingStatus {
  PENDING = 0,
  COMPLETED = 1,
}

describe('AfriCycle', function () {
  interface AfriCycleFixture {
    afriCycle: AfriCycle;
    cUSDToken: MockERC20;
    admin: SignerWithAddress;
    collector: SignerWithAddress;
    recycler: SignerWithAddress;
    buyer: SignerWithAddress;
  }

  async function deployAfriCycleFixture(): Promise<AfriCycleFixture> {
    const [admin, collector, recycler, buyer] = await ethers.getSigners();

    const CUSDTokenFactory = await ethers.getContractFactory('MockERC20');
    const cUSDToken = (await CUSDTokenFactory.deploy(
      'cUSD Token',
      'cUSD',
      18
    )) as unknown as MockERC20;
    await cUSDToken.waitForDeployment();

    const AfriCycleFactory = await ethers.getContractFactory('AfriCycle');
    const afriCycle = (await AfriCycleFactory.deploy(
      await cUSDToken.getAddress()
    )) as unknown as AfriCycle;
    await afriCycle.waitForDeployment();

    const mintAmount = parseEther('1000000');
    await cUSDToken.mint(admin.address, mintAmount);
    await cUSDToken.mint(collector.address, mintAmount);
    await cUSDToken.mint(recycler.address, mintAmount);
    await cUSDToken.mint(buyer.address, mintAmount);
    await cUSDToken.mint(await afriCycle.getAddress(), mintAmount);

    await cUSDToken
      .connect(collector)
      .approve(await afriCycle.getAddress(), mintAmount);
    await cUSDToken
      .connect(recycler)
      .approve(await afriCycle.getAddress(), mintAmount);
    await cUSDToken
      .connect(buyer)
      .approve(await afriCycle.getAddress(), mintAmount);

    return { afriCycle, cUSDToken, admin, collector, recycler, buyer };
  }

  describe('Initialization', function () {
    it('should initialize with correct roles and parameters', async function () {
      const { afriCycle, cUSDToken, admin } = await loadFixture(
        deployAfriCycleFixture
      );
      expect(
        await afriCycle.hasRole(await afriCycle.ADMIN_ROLE(), admin.address)
      ).to.be.true;
      expect(
        await afriCycle.hasRole(
          await afriCycle.DEFAULT_ADMIN_ROLE(),
          admin.address
        )
      ).to.be.true;
      expect(await afriCycle.cUSDToken()).to.equal(
        await cUSDToken.getAddress()
      );
      expect(await afriCycle.rewardRates(WasteStream.PLASTIC)).to.equal(
        parseEther('0.05')
      );
      expect(
        await afriCycle.qualityMultipliers(
          WasteStream.PLASTIC,
          QualityGrade.HIGH
        )
      ).to.equal(12000);
      expect(
        await afriCycle.carbonOffsetMultipliers(WasteStream.PLASTIC)
      ).to.equal(15000);
      expect(
        await afriCycle.qualityCarbonMultipliers(QualityGrade.HIGH)
      ).to.equal(12000);
      expect(await afriCycle.MAX_COLLECTION_WEIGHT()).to.equal(1000);
    });
  });

  describe('User Management', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
    });

    it('should register collector and emit events', async function () {
      const { afriCycle, collector } = fixture;
      await expect(
        afriCycle
          .connect(collector)
          .registerCollector('John Doe', 'Lagos', 'john@example.com')
      )
        .to.emit(afriCycle, 'UserRegistered')
        .withArgs(collector.address, 'John Doe', 'Lagos')
        .to.emit(afriCycle, 'UserRoleGranted')
        .withArgs(collector.address, await afriCycle.COLLECTOR_ROLE());
      const profile = await afriCycle.getUserProfile(collector.address);
      expect(profile.name).to.equal('John Doe');
      expect(profile.isVerified).to.be.true;
      expect(profile.collectorReputationScore).to.equal(100);
      expect(profile.role).to.equal(await afriCycle.COLLECTOR_ROLE());
      expect(profile.status).to.equal(Status.VERIFIED);
      expect(await afriCycle.getUserRole(collector.address)).to.equal(
        await afriCycle.COLLECTOR_ROLE()
      );
    });

    it('should register recycler and emit events', async function () {
      const { afriCycle, recycler } = fixture;
      await expect(
        afriCycle
          .connect(recycler)
          .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com')
      )
        .to.emit(afriCycle, 'UserRegistered')
        .withArgs(recycler.address, 'Recycle Inc', 'Abuja')
        .to.emit(afriCycle, 'UserRoleGranted')
        .withArgs(recycler.address, await afriCycle.RECYCLER_ROLE())
        .to.emit(afriCycle, 'RecyclerStatsUpdated')
        .withArgs(recycler.address, 0, 0, 0, 100);
      const profile = await afriCycle.getUserProfile(recycler.address);
      expect(profile.recyclerReputationScore).to.equal(100);
      expect(profile.role).to.equal(await afriCycle.RECYCLER_ROLE());
      expect(await afriCycle.getUserRole(recycler.address)).to.equal(
        await afriCycle.RECYCLER_ROLE()
      );
    });

    it('should prevent duplicate registration', async function () {
      const { afriCycle, collector } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await expect(
        afriCycle
          .connect(collector)
          .registerCollector('John Doe', 'Lagos', 'john@example.com')
      ).to.be.revertedWith('Already registered');
    });

    it('should revert on invalid registration inputs', async function () {
      const { afriCycle, collector } = fixture;
      await expect(
        afriCycle
          .connect(collector)
          .registerCollector('', 'Lagos', 'john@example.com')
      ).to.be.revertedWith('Name required');
      await expect(
        afriCycle
          .connect(collector)
          .registerCollector('John Doe', '', 'john@example.com')
      ).to.be.revertedWith('Location required');
    });

    it('should update user profile', async function () {
      const { afriCycle, collector } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await expect(
        afriCycle
          .connect(collector)
          .updateUserProfile('Jane Doe', 'Abuja', 'jane@example.com')
      )
        .to.emit(afriCycle, 'UserProfileUpdated')
        .withArgs(collector.address, 'Jane Doe', 'Abuja');
      const profile = await afriCycle.getUserProfile(collector.address);
      expect(profile.name).to.equal('Jane Doe');
      expect(profile.location).to.equal('Abuja');
      expect(profile.contactInfo).to.equal('jane@example.com');
    });

    it('should handle profile update timing correctly', async function () {
      const { afriCycle, collector } = fixture;

      // Register collector
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');

      // First update should succeed (no cooldown after registration)
      await expect(
        afriCycle
          .connect(collector)
          .updateUserProfile('Jane Doe', 'Abuja', 'jane@example.com')
      ).to.emit(afriCycle, 'UserProfileUpdated');

      // Second update attempt should fail (too soon)
      await expect(
        afriCycle
          .connect(collector)
          .updateUserProfile('John Smith', 'Kano', 'john@example.com')
      ).to.be.revertedWithCustomError(afriCycle, 'ProfileUpdateTooSoon');

      // Wait for cooldown period
      await time.increase(86400); // Advance by 1 day

      // Third update should succeed
      await expect(
        afriCycle
          .connect(collector)
          .updateUserProfile('John Smith', 'Kano', 'john@example.com')
      ).to.emit(afriCycle, 'UserProfileUpdated');
    });

    it('should update user reputation', async function () {
      const { afriCycle, admin, collector } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await expect(
        afriCycle
          .connect(admin)
          .updateUserReputation(collector.address, 200, 'Good performance')
      )
        .to.emit(afriCycle, 'ReputationChange')
        .withArgs(collector.address, 100, 200, 'Good performance')
        .to.emit(afriCycle, 'UserReputationUpdated')
        .withArgs(collector.address, 200);
      const profile = await afriCycle.getUserProfile(collector.address);
      expect(profile.collectorReputationScore).to.equal(200);
    });

    it('should batch update reputations', async function () {
      const { afriCycle, admin, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);

      const users = [collector.address, recycler.address];
      const scores = [200, 300];

      // Fetch initial reputation scores
      const collectorProfile = await afriCycle.getUserProfile(collector.address);
      const recyclerProfile = await afriCycle.getUserProfile(recycler.address);
      const initialCollectorScore = collectorProfile.collectorReputationScore;
      const initialRecyclerScore = recyclerProfile.recyclerReputationScore;

      await expect(
        afriCycle
          .connect(admin)
          .batchUpdateReputation(users, scores, 'Batch update')
      )
        .to.emit(afriCycle, 'ReputationChange')
        .withArgs(collector.address, initialCollectorScore, 200, 'Batch update')
        .to.emit(afriCycle, 'ReputationChange')
        .withArgs(recycler.address, initialRecyclerScore, 300, 'Batch update');

      // Verify updated scores
      const updatedCollectorProfile = await afriCycle.getUserProfile(collector.address);
      const updatedRecyclerProfile = await afriCycle.getUserProfile(recycler.address);
      expect(updatedCollectorProfile.collectorReputationScore).to.equal(200);
      expect(updatedRecyclerProfile.recyclerReputationScore).to.equal(300);
    });

    it('should suspend and unsuspend user', async function () {
      const { afriCycle, admin, collector } = fixture;
      await expect(
        afriCycle
          .connect(admin)
          .suspendUser(collector.address, 'Non-compliance')
      )
        .to.emit(afriCycle, 'UserSuspended')
        .withArgs(collector.address, 'Non-compliance');
      expect(await afriCycle.isSuspended(collector.address)).to.be.true;
      await expect(afriCycle.connect(admin).unsuspendUser(collector.address))
        .to.emit(afriCycle, 'UserUnsuspended')
        .withArgs(collector.address);
      expect(await afriCycle.isSuspended(collector.address)).to.be.false;
    });

    it('should blacklist and remove from blacklist', async function () {
      const { afriCycle, admin, collector } = fixture;
      await expect(
        afriCycle.connect(admin).blacklistUser(collector.address, 'Fraud')
      )
        .to.emit(afriCycle, 'UserBlacklisted')
        .withArgs(collector.address, 'Fraud');
      expect(await afriCycle.isBlacklisted(collector.address)).to.be.true;
      await expect(
        afriCycle.connect(admin).removeFromBlacklist(collector.address)
      )
        .to.emit(afriCycle, 'UserRemovedFromBlacklist')
        .withArgs(collector.address);
      expect(await afriCycle.isBlacklisted(collector.address)).to.be.false;
    });

    it('should register and remove collector at recycler', async function () {
      const { afriCycle, recycler, collector } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await expect(
        afriCycle
          .connect(recycler)
          .registerCollectorAtRecycler(collector.address)
      )
        .to.emit(afriCycle, 'CollectorRegisteredAtRecycler')
        .to.emit(afriCycle, 'RecyclerStatsUpdated');
      const recyclerProfile = await afriCycle.getUserProfile(recycler.address);
      expect(recyclerProfile.activeCollectors).to.equal(1);
      await expect(
        afriCycle
          .connect(recycler)
          .removeCollectorFromRecycler(collector.address)
      )
        .to.emit(afriCycle, 'CollectorRemovedFromRecycler')
        .to.emit(afriCycle, 'RecyclerStatsUpdated');
      expect(
        (await afriCycle.getUserProfile(recycler.address)).activeCollectors
      ).to.equal(0);
    });
  });

  describe('Collection Management', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
    });

    it('should create collection and emit events', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      const pickupTime = (await time.latest()) + 3600;

      // Calculate expected amounts
      const baseReward =
        (await afriCycle.rewardRates(WasteStream.PLASTIC)) * 500n;
      const platformFee = (baseReward * 2n) / 100n; // 2% platform fee
      const rewardAmount = baseReward - platformFee;

      const tx = await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          500,
          'Lagos',
          'QmHash123',
          pickupTime,
          recycler.address
        );

      const receipt = await tx.wait();
      const event = receipt?.logs
        .filter((log): log is EventLog => log instanceof EventLog)
        .find((log) => log.fragment.name === 'CollectionCreated');
      const collectionId = event?.args[0];

      await expect(tx)
        .to.emit(afriCycle, 'CollectionCreated')
        .withArgs(collectionId, collector.address, 500, WasteStream.PLASTIC)
        .to.emit(afriCycle, 'RewardPaid')
        .withArgs(
          collector.address,
          rewardAmount,
          WasteStream.PLASTIC,
          collectionId
        )
        .to.emit(afriCycle, 'PickupScheduled')
        .withArgs(collectionId, collector.address, recycler.address, pickupTime);

      const collection = await afriCycle.collections(collectionId);
      expect(collection.weight).to.equal(500);
      expect(collection.status).to.equal(Status.PENDING);
      expect(collection.quality).to.equal(QualityGrade.MEDIUM);
      expect(collection.rewardAmount).to.equal(rewardAmount);
      expect(await afriCycle.totalPlatformFees()).to.be.closeTo(platformFee, 1e12);
    });

    it('should batch create collections', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');

      const wasteTypes = [WasteStream.PLASTIC, WasteStream.EWASTE];
      const weights = [500, 300];
      const locations = ['Lagos', 'Abuja'];
      const imageHashes = ['QmHash1', 'QmHash2'];
      const pickupTimes = [
        (await time.latest()) + 3600,
        (await time.latest()) + 7200,
      ];
      const recyclers = [recycler.address, recycler.address];

      // Calculate expected rewards and fees
      const plasticBaseReward = 500n * 50000000000000000n; // 500 * 0.05 ether
      const eWasteBaseReward = 300n * 250000000000000000n; // 300 * 0.25 ether
      const plasticFee = (plasticBaseReward * 2n) / 100n;
      const eWasteFee = (eWasteBaseReward * 2n) / 100n;
      const plasticReward = plasticBaseReward - plasticFee;
      const eWasteReward = eWasteBaseReward - eWasteFee;

      const tx = await afriCycle
        .connect(collector)
        .batchCreateCollection(
          wasteTypes,
          weights,
          locations,
          imageHashes,
          pickupTimes,
          recyclers
        );

      const receipt = await tx.wait();
      const events = receipt?.logs
        .filter((log): log is EventLog => log instanceof EventLog)
        .filter((log) => log.fragment.name === 'CollectionCreated');

      expect(events?.length).to.equal(2);
      expect(events?.[0].args.weight).to.equal(500);
      expect(events?.[1].args.weight).to.equal(300);

      // Verify collection details and platform fees
      const collection0 = await afriCycle.collections(0);
      const collection1 = await afriCycle.collections(1);
      expect(collection0.rewardAmount).to.equal(plasticReward);
      expect(collection1.rewardAmount).to.equal(eWasteReward);
      expect(await afriCycle.totalPlatformFees()).to.be.closeTo(
        plasticFee + eWasteFee,
        1e12
      );

      // Verify events for each collection
      await expect(tx)
        .to.emit(afriCycle, 'CollectionCreated')
        .withArgs(0, collector.address, 500, WasteStream.PLASTIC)
        .to.emit(afriCycle, 'RewardPaid')
        .withArgs(collector.address, plasticReward, WasteStream.PLASTIC, 0)
        .to.emit(afriCycle, 'CollectionCreated')
        .withArgs(1, collector.address, 300, WasteStream.EWASTE)
        .to.emit(afriCycle, 'RewardPaid')
        .withArgs(collector.address, eWasteReward, WasteStream.EWASTE, 1);
    });

    it('should revert batch create with mismatched arrays', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await expect(
        afriCycle
          .connect(collector)
          .batchCreateCollection(
            [WasteStream.PLASTIC],
            [500],
            ['Lagos'],
            ['QmHash1'],
            [(await time.latest()) + 3600],
            []
          )
      ).to.be.revertedWithCustomError(afriCycle, 'ArrayLengthMismatch');
    });

    it('should update collection details', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          500,
          'Lagos',
          'QmHash123',
          (await time.latest()) + 3600,
          recycler.address
        );
      await expect(
        afriCycle
          .connect(collector)
          .updateCollection(0, 600, 'Abuja', 'QmHash456') // Changed 1 to 0
      )
        .to.emit(afriCycle, 'CollectionUpdated')
        .withArgs(0, 600, 'Abuja');
      const collection = await afriCycle.collections(0);
      expect(collection.weight).to.equal(600);
      expect(collection.location).to.equal('Abuja');
      expect(collection.imageHash).to.equal('QmHash456');
    });

    it('should revert collection update by non-owner', async function () {
      const { afriCycle, collector, recycler, buyer } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          500,
          'Lagos',
          'QmHash123',
          (await time.latest()) + 3600,
          recycler.address
        );
      await expect(
        afriCycle.connect(buyer).updateCollection(1, 600, 'Abuja', 'QmHash456')
      ).to.be.revertedWith('Not collection owner');
    });

    it('should confirm and reject pickup', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address); // Ensure relationship
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          500,
          'Lagos',
          'QmHash123',
          (await time.latest()) + 3600,
          recycler.address
        );
      await expect(afriCycle.connect(recycler).confirmPickup(0)) // Changed 1 to 0
        .to.emit(afriCycle, 'PickupConfirmed')
        .withArgs(0, recycler.address);
      expect((await afriCycle.collections(0)).status).to.equal(Status.VERIFIED);
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          300,
          'Lagos',
          'QmHash124',
          (await time.latest()) + 3600,
          recycler.address
        );
      await expect(afriCycle.connect(recycler).rejectPickup(1, 'Invalid waste')) // Changed 2 to 1
        .to.emit(afriCycle, 'PickupRejected')
        .withArgs(1, recycler.address, 'Invalid waste');
      expect((await afriCycle.collections(1)).status).to.equal(Status.REJECTED);
    });

    it('should update pickup details', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);

      // Create collection
      const wasteType = WasteStream.PLASTIC;
      const weight = 500;
      const location = 'Lagos';
      const imageHash = 'QmHash';
      const pickupTime = (await time.latest()) + 3600;
      const recyclerAddress = recycler.address;

      const tx = await afriCycle
        .connect(collector)
        .createCollection(
          wasteType,
          weight,
          location,
          imageHash,
          pickupTime,
          recyclerAddress
        );

      const receipt = await tx.wait();
      const event = receipt?.logs
        .filter((log): log is EventLog => log instanceof EventLog)
        .find((log) => log.fragment.name === 'CollectionCreated');
      const collectionId = event?.args[0];

      // Update pickup details
      const newPickupTime = (await time.latest()) + 7200;
      const newRecycler = recycler.address;

      await expect(
        afriCycle
          .connect(collector)
          .updatePickupDetails(collectionId, newPickupTime, newRecycler)
      )
        .to.emit(afriCycle, 'PickupDetailsUpdated')
        .withArgs(collectionId, newPickupTime, newRecycler);

      // Verify updated details
      const collection = await afriCycle.collections(collectionId);
      expect(collection.pickupTime).to.equal(newPickupTime);
      expect(collection.selectedRecycler).to.equal(newRecycler);
    });

    it('should add e-waste details', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.EWASTE,
          300,
          'Lagos',
          'QmHash123',
          (await time.latest()) + 3600,
          recycler.address
        );
      const componentCounts = [2, 3, 1, 4];
      await expect(
        afriCycle
          .connect(collector)
          .addEWasteDetails(
            0,
            componentCounts,
            'SN123',
            'TechCorp',
            parseEther('50')
          ) // Changed 1 to 0
      )
        .to.emit(afriCycle, 'EWasteDetailsAdded')
        .withArgs(0, componentCounts, 'SN123', 'TechCorp', parseEther('50'));
      const [, counts, serial, manufacturer, value] =
        await afriCycle.getCollectionDetails(0);
      expect(counts).to.deep.equal(componentCounts);
      expect(serial).to.equal('SN123');
      expect(manufacturer).to.equal('TechCorp');
      expect(value).to.equal(parseEther('50'));
    });

    it('should update collection quality', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);

      // Create collection
      const wasteType = WasteStream.PLASTIC;
      const weight = 500;
      const location = 'Lagos';
      const imageHash = 'QmHash';
      const pickupTime = (await time.latest()) + 3600;
      const recyclerAddress = recycler.address;

      await afriCycle
        .connect(collector)
        .createCollection(
          wasteType,
          weight,
          location,
          imageHash,
          pickupTime,
          recyclerAddress
        );

      // Confirm pickup
      await afriCycle
        .connect(recycler)
        .confirmPickup(0);

      // Update quality
      const quality = QualityGrade.HIGH;

      await expect(
        afriCycle
          .connect(recycler)
          .updateCollectionQuality(0, quality)
      )
        .to.emit(afriCycle, 'QualityAssessmentUpdated')
        .withArgs(0, QualityGrade.MEDIUM, quality, recycler.address);

      // Verify updated quality
      const collection = await afriCycle.collections(0);
      expect(collection.quality).to.equal(quality);
    });

    it('should batch update collection qualities', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);

      // Create collections
      const wasteType = WasteStream.PLASTIC;
      const weight = 500;
      const location = 'Lagos';
      const imageHash = 'QmHash';
      const pickupTime = (await time.latest()) + 3600;
      const recyclerAddress = recycler.address;

      await afriCycle
        .connect(collector)
        .createCollection(
          wasteType,
          weight,
          location,
          imageHash,
          pickupTime,
          recyclerAddress
        );

      await afriCycle
        .connect(collector)
        .createCollection(
          wasteType,
          weight,
          location,
          imageHash,
          pickupTime,
          recyclerAddress
        );

      // Confirm pickups
      await afriCycle.connect(recycler).confirmPickup(0);
      await afriCycle.connect(recycler).confirmPickup(1);

      // Update qualities
      const collectionIds = [0, 1];
      const qualities = [QualityGrade.HIGH, QualityGrade.MEDIUM];

      await expect(
        afriCycle
          .connect(recycler)
          .batchUpdateCollectionQuality(collectionIds, qualities)
      )
        .to.emit(afriCycle, 'QualityAssessmentUpdated')
        .withArgs(0, QualityGrade.MEDIUM, QualityGrade.HIGH, recycler.address)
        .to.emit(afriCycle, 'QualityAssessmentUpdated')
        .withArgs(1, QualityGrade.MEDIUM, QualityGrade.MEDIUM, recycler.address);

      // Verify updated qualities
      const collection0 = await afriCycle.collections(0);
      const collection1 = await afriCycle.collections(1);
      expect(collection0.quality).to.equal(QualityGrade.HIGH);
      expect(collection1.quality).to.equal(QualityGrade.MEDIUM);
    });

    it('should revert invalid collection inputs', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      const pickupTime = (await time.latest()) + 3600;
      await expect(
        afriCycle
          .connect(collector)
          .createCollection(
            WasteStream.PLASTIC,
            1500,
            'Lagos',
            'QmHash123',
            pickupTime,
            recycler.address
          )
      ).to.be.revertedWith('Weight exceeds maximum');
      await expect(
        afriCycle
          .connect(collector)
          .createCollection(
            WasteStream.PLASTIC,
            500,
            '',
            'QmHash123',
            pickupTime,
            recycler.address
          )
      ).to.be.revertedWith('Location required');
      await expect(
        afriCycle
          .connect(collector)
          .createCollection(
            WasteStream.PLASTIC,
            500,
            'Lagos',
            '',
            pickupTime,
            recycler.address
          )
      ).to.be.revertedWith('Image hash required');
      await expect(
        afriCycle
          .connect(collector)
          .createCollection(
            WasteStream.PLASTIC,
            500,
            'Lagos',
            'QmHash123',
            pickupTime - 3600,
            recycler.address
          )
      ).to.be.revertedWith('Invalid pickup time');
    });
  });

  describe('Processing Management', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);
      // Create a collection for testing
      await afriCycle
        .connect(collector)
        .createCollection(
          WasteStream.PLASTIC,
          500,
          'Lagos',
          'QmHash123',
          (await time.latest()) + 3600,
          recycler.address
        );
      await afriCycle.connect(recycler).confirmPickup(0);
    });

    it('should create and complete processing batch', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(collector)
        .registerCollector('John Doe', 'Lagos', 'john@example.com');
      await afriCycle
        .connect(recycler)
        .registerRecycler('Recycle Inc', 'Abuja', 'recycle@example.com');
      await afriCycle
        .connect(recycler)
        .registerCollectorAtRecycler(collector.address);

      // Create collection
      const wasteType = WasteStream.PLASTIC;
      const weight = 500;
      const location = 'Lagos';
      const imageHash = 'QmHash';
      const pickupTime = (await time.latest()) + 3600;
      const recyclerAddress = recycler.address;

      await afriCycle
        .connect(collector)
        .createCollection(
          wasteType,
          weight,
          location,
          imageHash,
          pickupTime,
          recyclerAddress
        );

      // Confirm pickup
      await afriCycle.connect(recycler).confirmPickup(0);

      // Update quality
      await afriCycle
        .connect(recycler)
        .updateCollectionQuality(0, QualityGrade.HIGH);

      // Create processing batch
      const processDescription = 'Processing plastic waste';

      await expect(
        afriCycle
          .connect(recycler)
          .createProcessingBatch([0], processDescription)
      )
        .to.emit(afriCycle, 'ProcessingBatchCreated')
        .withArgs(0, recycler.address, [0], processDescription);

      // Complete processing batch
      const outputAmount = 450;
      const outputQuality = QualityGrade.HIGH;

      await expect(
        afriCycle
          .connect(recycler)
          .completeProcessing(0, outputAmount, outputQuality)
      )
        .to.emit(afriCycle, 'ProcessingBatchCompleted')
        .withArgs(0, outputAmount, outputQuality);

      // Verify batch state
      const batch = await afriCycle.processingBatches(0);
      expect(batch.status).to.equal(ProcessingStatus.COMPLETED);
      expect(batch.outputAmount).to.equal(outputAmount);
      expect(batch.outputQuality).to.equal(outputQuality);

      // Verify collection state
      const collection = await afriCycle.collections(0);
      expect(collection.status).to.equal(Status.COMPLETED);
    });

    it('should update processing batch', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle
        .connect(recycler)
        .createProcessingBatch([0], 'Process plastic');
      await expect(
        afriCycle
          .connect(recycler)
          .updateProcessingBatch(0, 450, QualityGrade.PREMIUM)
      )
        .to.emit(afriCycle, 'ProcessingBatchUpdated')
        .withArgs(0, 450, QualityGrade.PREMIUM);
      const batch = await afriCycle.processingBatches(0);
      expect(batch.outputAmount).to.equal(450);
      expect(batch.outputQuality).to.equal(QualityGrade.PREMIUM);
    });

    it('should revert processing with invalid inputs', async function () {
      const { afriCycle, collector, recycler } = fixture;
      await expect(
        afriCycle
          .connect(collector)
          .updatePickupDetails(0, newPickupTime, newRecycler)
      )
        .to.emit(afriCycle, 'PickupDetailsUpdated')
        .withArgs(0, newPickupTime, newRecycler);

      // Verify updated details
      const collection = await afriCycle.collections(0);
      expect(collection.pickupTime).to.equal(newPickupTime);
      expect(collection.selectedRecycler).to.equal(newRecycler);
    });
  });
});
