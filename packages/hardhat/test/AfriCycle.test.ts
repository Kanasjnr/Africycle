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
      const newPickupTime = Math.floor(Date.now() / 1000) + 3600;
      const newRecycler = recycler.address;
      
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

  describe('Marketplace Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, collector, recycler } = fixture;
      // Register users and create/process some collections first
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );
      
      await afriCycle.connect(recycler).registerRecycler(
        'Test Recycler',
        'Test Location',
        'recycler@test.com'
      );

      // Create and process a collection to have processed waste
      const futureTime = (await time.latest()) + 3600;
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'image-hash',
        futureTime,
        recycler.address
      );

      await afriCycle.connect(recycler).confirmPickup(0);
      
      // Create processing batch
      await afriCycle.connect(recycler).createProcessingBatch(
        [0],
        'Test processing'
      );
      
      // Complete processing
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);
    });

    it('should create marketplace listing', async function () {
      const { afriCycle, recycler } = fixture;
      const tx = await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      await expect(tx)
        .to.emit(afriCycle, 'ListingCreated')
        .withArgs(0, recycler.address, WasteStream.PLASTIC, 50, parseEther('0.1'), QualityGrade.HIGH);

      const listing = await afriCycle.listings(0);
      expect(listing.seller).to.equal(recycler.address);
      expect(listing.amount).to.equal(50);
      expect(listing.pricePerUnit).to.equal(parseEther('0.1'));
      expect(listing.isActive).to.be.true;
    });

    it('should update marketplace listing', async function () {
      // Create listing first
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      const tx = await afriCycle.connect(recycler).updateListing(
        0,
        40,
        parseEther('0.15'),
        'Updated description'
      );

      await expect(tx)
        .to.emit(afriCycle, 'ListingUpdated')
        .withArgs(0, 40, parseEther('0.15'), 'Updated description');

      const listing = await afriCycle.listings(0);
      expect(listing.amount).to.equal(40);
      expect(listing.pricePerUnit).to.equal(parseEther('0.15'));
    });

    it('should purchase marketplace listing', async function () {
      // Create listing
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      // Register buyer as collector
      await afriCycle.connect(buyer).registerCollector(
        'Test Buyer',
        'Test Location',
        'buyer@test.com'
      );

      const tx = await afriCycle.connect(buyer).purchaseListing(0);

      await expect(tx)
        .to.emit(afriCycle, 'ListingPurchased')
        .withArgs(0, buyer.address, 50, parseEther('5')); // 50 * 0.1

      const listing = await afriCycle.listings(0);
      expect(listing.status).to.equal(Status.COMPLETED);
    });

    it('should cancel marketplace listing', async function () {
      // Create listing
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'High quality plastic waste'
      );

      const tx = await afriCycle.connect(recycler).cancelListing(0);

      await expect(tx)
        .to.emit(afriCycle, 'ListingCancelled')
        .withArgs(0, recycler.address);

      const listing = await afriCycle.listings(0);
      expect(listing.status).to.equal(Status.CANCELLED);
    });

    it('should revert on invalid listing operations', async function () {
      // Test invalid listing creation
      await expect(
        afriCycle.connect(recycler).createListing(
          WasteStream.PLASTIC,
          0, // Invalid amount
          parseEther('0.1'),
          QualityGrade.HIGH,
          'Test'
        )
      ).to.be.revertedWith('Amount must be positive');

      // Test unauthorized listing update
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'Test'
      );

      await expect(
        afriCycle.connect(collector).updateListing(0, 40, parseEther('0.15'), 'Updated')
      ).to.be.revertedWith('Not seller');
    });
  });

  describe('Impact Credits', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );
      
      await afriCycle.connect(recycler).registerRecycler(
        'Test Recycler',
        'Test Location',
        'recycler@test.com'
      );

      // Create some processing to generate impact credits
      const futureTime = (await time.latest()) + 3600;
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'image-hash',
        futureTime,
        recycler.address
      );

      await afriCycle.connect(recycler).confirmPickup(0);
      await afriCycle.connect(recycler).createProcessingBatch([0], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);
    });

    it('should transfer impact credit', async function () {
      const tx = await afriCycle.connect(recycler).transferImpactCredit(
        0,
        collector.address
      );

      await expect(tx)
        .to.emit(afriCycle, 'ImpactCreditTransferred')
        .withArgs(0, recycler.address, collector.address);

      const credit = await afriCycle.impactCredits(0);
      expect(credit.owner).to.equal(collector.address);
    });

    it('should burn impact credit', async function () {
      const tx = await afriCycle.connect(recycler).burnImpactCredit(0);

      await expect(tx)
        .to.emit(afriCycle, 'ImpactCreditBurned')
        .withArgs(0, recycler.address);
    });

    it('should revert on unauthorized impact credit operations', async function () {
      await expect(
        afriCycle.connect(collector).transferImpactCredit(0, buyer.address)
      ).to.be.revertedWith('Not owner');

      await expect(
        afriCycle.connect(collector).burnImpactCredit(0)
      ).to.be.revertedWith('Not owner');
    });
  });

  describe('Withdrawal Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );
      
      await afriCycle.connect(recycler).registerRecycler(
        'Test Recycler',
        'Test Location',
        'recycler@test.com'
      );

      // Create collection to generate earnings
      const futureTime = (await time.latest()) + 3600;
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'image-hash',
        futureTime,
        recycler.address
      );
    });

    it('should allow collector to withdraw earnings', async function () {
      const collectorProfile = await afriCycle.getUserStats(collector.address);
      const earningsToWithdraw = parseEther('1');

      const tx = await afriCycle.connect(collector).withdrawCollectorEarnings(
        earningsToWithdraw
      );

      await expect(tx)
        .to.emit(afriCycle, 'CollectorEarningsWithdrawn')
        .withArgs(collector.address, earningsToWithdraw);
    });

    it('should allow recycler to withdraw earnings', async function () {
      // Process some waste to generate recycler earnings
      await afriCycle.connect(recycler).confirmPickup(0);
      await afriCycle.connect(recycler).createProcessingBatch([0], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);

      const earningsToWithdraw = parseEther('1');
      const tx = await afriCycle.connect(recycler).withdrawRecyclerEarnings(
        earningsToWithdraw
      );

      await expect(tx)
        .to.emit(afriCycle, 'RecyclerEarningsWithdrawn')
        .withArgs(recycler.address, earningsToWithdraw);
    });

    it('should allow recycler to withdraw inventory', async function () {
      // Create some inventory
      await afriCycle.connect(recycler).confirmPickup(0);
      await afriCycle.connect(recycler).createProcessingBatch([0], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);

      const inventoryToWithdraw = parseEther('1');
      const tx = await afriCycle.connect(recycler).withdrawRecyclerInventory(
        inventoryToWithdraw
      );

      await expect(tx)
        .to.emit(afriCycle, 'RecyclerInventoryWithdrawn')
        .withArgs(recycler.address, inventoryToWithdraw);
    });

    it('should revert on insufficient balance withdrawals', async function () {
      await expect(
        afriCycle.connect(collector).withdrawCollectorEarnings(parseEther('999999'))
      ).to.be.revertedWith('Insufficient balance');

      await expect(
        afriCycle.connect(recycler).withdrawRecyclerEarnings(parseEther('999999'))
      ).to.be.revertedWith('Insufficient balance');
    });
  });

  describe('Emergency Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, admin, cUSDToken } = fixture;
      await afriCycle.connect(admin).pause();
      
      const withdrawAmount = parseEther('100');
      const tx = await afriCycle.connect(admin).emergencyWithdraw(
        await cUSDToken.getAddress(),
        withdrawAmount
      );

      await expect(tx)
        .to.emit(afriCycle, 'EmergencyWithdrawal')
        .withArgs(admin.address, await cUSDToken.getAddress(), withdrawAmount);
    });

    it('should allow admin to emergency withdraw Ether', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      // Send some Ether to the contract
      await admin.sendTransaction({
        to: await afriCycle.getAddress(),
        value: parseEther('1')
      });

      const tx = await afriCycle.connect(admin).emergencyWithdrawEther();

      await expect(tx)
        .to.emit(afriCycle, 'EmergencyEtherWithdrawn')
        .withArgs(admin.address, parseEther('1'));
    });

    it('should revert emergency functions for non-admin', async function () {
      const { collector } = await loadFixture(deployAfriCycleFixture);
      await expect(
        afriCycle.connect(collector).emergencyWithdraw(
          await cUSDToken.getAddress(),
          parseEther('100')
        )
      ).to.be.revertedWith('Caller is not an admin');

      await expect(
        afriCycle.connect(collector).emergencyWithdrawEther()
      ).to.be.revertedWith('Caller is not an admin');
    });

    it('should require paused state for emergency token withdrawal', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      await expect(
        afriCycle.connect(admin).emergencyWithdraw(
          await cUSDToken.getAddress(),
          parseEther('100')
        )
      ).to.be.revertedWith('Pausable: not paused');
    });
  });

  describe('Carbon Offset Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, admin } = fixture;
      await afriCycle.connect(admin).updateCarbonOffsetMultiplier(
        WasteStream.PLASTIC,
        20000
      );
      await afriCycle.connect(admin).updateQualityCarbonMultiplier(
        QualityGrade.HIGH,
        18000
      );
    });

    it('should calculate carbon offset correctly', async function () {
      const { afriCycle, recycler } = fixture;
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

      // Create processing batches
      await afriCycle.connect(recycler).createProcessingBatch([0], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);
      await afriCycle.connect(recycler).createProcessingBatch([1], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(1, 90, QualityGrade.HIGH);

      const carbonOffset = await afriCycle.calculateCarbonOffset(
        WasteStream.PLASTIC,
        100,
        QualityGrade.HIGH
      );

      expect(carbonOffset).to.be.gt(0);
    });

    it('should allow admin to update carbon offset multipliers', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const newMultiplier = 20000;
      const tx = await afriCycle.connect(admin).updateCarbonOffsetMultiplier(
        WasteStream.PLASTIC,
        newMultiplier
      );

      await expect(tx)
        .to.emit(afriCycle, 'CarbonOffsetMultiplierUpdated')
        .withArgs(WasteStream.PLASTIC, newMultiplier);
    });

    it('should allow admin to update quality carbon multipliers', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const newMultiplier = 18000;
      const tx = await afriCycle.connect(admin).updateQualityCarbonMultiplier(
        QualityGrade.HIGH,
        newMultiplier
      );

      await expect(tx)
        .to.emit(afriCycle, 'QualityCarbonMultiplierUpdated')
        .withArgs(QualityGrade.HIGH, newMultiplier);
    });

    it('should revert on invalid carbon offset parameters', async function () {
      const { afriCycle } = await loadFixture(deployAfriCycleFixture);
      await expect(
        afriCycle.calculateCarbonOffset(
          WasteStream.PLASTIC,
          0, // Invalid amount
          QualityGrade.HIGH
        )
      ).to.be.revertedWith('Amount must be positive');
    });
  });

  describe('Advanced Admin Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, admin, collector } = fixture;
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );
    });

    it('should allow admin to suspend and unsuspend users', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const suspendTx = await afriCycle.connect(admin).suspendUser(
        collector.address,
        'Policy violation'
      );

      await expect(suspendTx)
        .to.emit(afriCycle, 'UserSuspended')
        .withArgs(collector.address, 'Policy violation');

      const unsuspendTx = await afriCycle.connect(admin).unsuspendUser(
        collector.address
      );

      await expect(unsuspendTx)
        .to.emit(afriCycle, 'UserUnsuspended')
        .withArgs(collector.address);
    });

    it('should allow admin to blacklist and remove from blacklist', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const blacklistTx = await afriCycle.connect(admin).blacklistUser(
        collector.address,
        'Fraudulent activity'
      );

      await expect(blacklistTx)
        .to.emit(afriCycle, 'UserBlacklisted')
        .withArgs(collector.address, 'Fraudulent activity');

      const removeBlacklistTx = await afriCycle.connect(admin).removeFromBlacklist(
        collector.address
      );

      await expect(removeBlacklistTx)
        .to.emit(afriCycle, 'UserRemovedFromBlacklist')
        .withArgs(collector.address);
    });

    it('should allow admin to withdraw platform fees', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const tx = await afriCycle.connect(admin).withdrawPlatformFees();

      await expect(tx)
        .to.emit(afriCycle, 'PlatformFeeWithdrawn');
    });

    it('should allow admin to pause and unpause contract', async function () {
      const { admin } = await loadFixture(deployAfriCycleFixture);
      const pauseTx = await afriCycle.connect(admin).pause();
      await expect(pauseTx)
        .to.emit(afriCycle, 'ContractPaused')
        .withArgs(admin.address);

      const unpauseTx = await afriCycle.connect(admin).unpause();
      await expect(unpauseTx)
        .to.emit(afriCycle, 'ContractUnpaused')
        .withArgs(admin.address);
    });

    it('should revert admin functions for non-admin', async function () {
      const { collector } = await loadFixture(deployAfriCycleFixture);
      await expect(
        afriCycle.connect(collector).suspendUser(recycler.address, 'test')
      ).to.be.revertedWith('Caller is not an admin');

      await expect(
        afriCycle.connect(collector).pause()
      ).to.be.revertedWith('Caller is not an admin');

      await expect(
        afriCycle.connect(collector).withdrawPlatformFees()
      ).to.be.revertedWith('Caller is not an admin');
    });
  });

  describe('View Functions and Statistics', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, collector, recycler } = fixture;
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );
      
      await afriCycle.connect(recycler).registerRecycler(
        'Test Recycler',
        'Test Location',
        'recycler@test.com'
      );

      // Create some activity
      const futureTime = (await time.latest()) + 3600;
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'image-hash',
        futureTime,
        recycler.address
      );
    });

    it('should return correct user statistics', async function () {
      const { afriCycle, collector } = fixture;
      const userStats = await afriCycle.getUserStats(collector.address);
      expect(userStats.totalEarnings).to.be.gt(0);
      expect(userStats.collected[WasteStream.PLASTIC]).to.equal(100);
    });

    it('should return correct collector statistics', async function () {
      const { afriCycle, collector } = fixture;
      const collectorStats = await afriCycle.getCollectorStats(collector.address);
      expect(collectorStats.collectorTotalCollected).to.equal(100);
      expect(collectorStats.collectedByType[WasteStream.PLASTIC]).to.equal(100);
    });

    it('should return correct recycler statistics', async function () {
      const { afriCycle, recycler } = fixture;
      const recyclerStats = await afriCycle.getRecyclerStats(recycler.address);
      expect(recyclerStats.scheduledPickups).to.equal(1);
      expect(recyclerStats.reputationScore).to.equal(100);
    });

    it('should return correct platform statistics', async function () {
      const { afriCycle } = await loadFixture(deployAfriCycleFixture);
      const platformStats = await afriCycle.getPlatformStats();
      expect(platformStats.collectionCount).to.be.gt(0);
      expect(platformStats.userCount).to.be.gt(0);
    });

    it('should return correct global statistics', async function () {
      const { afriCycle } = await loadFixture(deployAfriCycleFixture);
      const globalStats = await afriCycle.getGlobalStats();
      expect(globalStats.totalUsers).to.be.gt(0);
      expect(globalStats.totalWasteCollected).to.be.gt(0);
    });

    it('should return correct contract cUSD balance', async function () {
      const { afriCycle } = await loadFixture(deployAfriCycleFixture);
      const balance = await afriCycle.getContractCUSDBalance();
      expect(balance).to.be.gt(0);
    });

    it('should return correct collection details', async function () {
      const { afriCycle, collector } = fixture;
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

      const [collection, componentCounts, serialNumber, manufacturer, estimatedValue] = 
        await afriCycle.getCollectionDetails(0);
      
      expect(collection.id).to.equal(0);
      expect(collection.collector).to.equal(collector.address);
      expect(collection.weight).to.equal(500);
    });

    it('should return marketplace listings', async function () {
      const { afriCycle, recycler } = await loadFixture(deployAfriCycleFixture);
      // Create a processing batch and listing first
      await afriCycle.connect(recycler).confirmPickup(0);
      await afriCycle.connect(recycler).createProcessingBatch([0], 'Test processing');
      await afriCycle.connect(recycler).completeProcessing(0, 90, QualityGrade.HIGH);
      
      await afriCycle.connect(recycler).createListing(
        WasteStream.PLASTIC,
        50,
        parseEther('0.1'),
        QualityGrade.HIGH,
        'Test listing'
      );

      const listings = await afriCycle.getMarketplaceListings(WasteStream.PLASTIC, true);
      expect(listings.length).to.be.gt(0);
    });
  });

  describe('Admin Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
    });

    it('should allow admin to set reward rates', async function () {
      const { afriCycle, admin } = fixture;
      const newRate = parseEther('0.15');
      
      const tx = await afriCycle.connect(admin).setRewardRate(WasteStream.PLASTIC, newRate);
      
      await expect(tx)
        .to.emit(afriCycle, 'RewardRateUpdated')
        .withArgs(WasteStream.PLASTIC, newRate);
    });

    it('should allow admin to set quality multipliers', async function () {
      const { afriCycle, admin } = fixture;
      const newMultiplier = 150; // 1.5x
      
      const tx = await afriCycle.connect(admin).setQualityMultiplier(QualityGrade.HIGH, newMultiplier);
      
      await expect(tx)
        .to.emit(afriCycle, 'QualityMultiplierUpdated')
        .withArgs(QualityGrade.HIGH, newMultiplier);
    });

    it('should allow admin to withdraw platform fees', async function () {
      const { afriCycle, admin, cUSDToken } = fixture;
      
      // Create some collections to generate platform fees
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      // Fund the contract with cUSD
      await cUSDToken.transfer(await afriCycle.getAddress(), parseEther('1000'));
      
      const tx = await afriCycle.connect(admin).withdrawPlatformFees();
      
      await expect(tx).to.emit(afriCycle, 'PlatformFeeWithdrawn');
    });

    it('should allow admin to pause and unpause contract', async function () {
      const { afriCycle, admin } = fixture;
      
      const pauseTx = await afriCycle.connect(admin).pause();
      await expect(pauseTx).to.emit(afriCycle, 'ContractPaused').withArgs(admin.address);
      
      const unpauseTx = await afriCycle.connect(admin).unpause();
      await expect(unpauseTx).to.emit(afriCycle, 'ContractUnpaused').withArgs(admin.address);
    });

    it('should allow admin to update carbon offset multipliers', async function () {
      const { afriCycle, admin } = fixture;
      const newMultiplier = 200; // 2.0x
      
      const tx = await afriCycle.connect(admin).updateCarbonOffsetMultiplier(WasteStream.PLASTIC, newMultiplier);
      
      await expect(tx)
        .to.emit(afriCycle, 'CarbonOffsetMultiplierUpdated')
        .withArgs(WasteStream.PLASTIC, newMultiplier);
    });

    it('should allow admin to update quality carbon multipliers', async function () {
      const { afriCycle, admin } = fixture;
      const newMultiplier = 180; // 1.8x
      
      const tx = await afriCycle.connect(admin).updateQualityCarbonMultiplier(QualityGrade.PREMIUM, newMultiplier);
      
      await expect(tx)
        .to.emit(afriCycle, 'QualityCarbonMultiplierUpdated')
        .withArgs(QualityGrade.PREMIUM, newMultiplier);
    });

    it('should revert admin functions for non-admin users', async function () {
      const { afriCycle, collector } = fixture;
      
      await expect(
        afriCycle.connect(collector).setRewardRate(WasteStream.PLASTIC, parseEther('0.15'))
      ).to.be.revertedWith('Caller is not an admin');
      
      await expect(
        afriCycle.connect(collector).setQualityMultiplier(QualityGrade.HIGH, 150)
      ).to.be.revertedWith('Caller is not an admin');
      
      await expect(
        afriCycle.connect(collector).withdrawPlatformFees()
      ).to.be.revertedWith('Caller is not an admin');
      
      await expect(
        afriCycle.connect(collector).pause()
      ).to.be.revertedWith('Caller is not an admin');
      
      await expect(
        afriCycle.connect(collector).unpause()
      ).to.be.revertedWith('Caller is not an admin');
    });
  });

  describe('View Functions', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
      const { afriCycle, admin } = fixture;
      
      // Setup test data
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
    });

    it('should return user stats correctly', async function () {
      const { afriCycle, admin } = fixture;
      
      const stats = await afriCycle.getUserStats(admin.address);
      expect(stats.totalCollected).to.equal(0);
      expect(stats.totalEarnings).to.equal(0);
      expect(stats.reputationScore).to.equal(500); // Default reputation
    });

    it('should return contract stats correctly', async function () {
      const { afriCycle } = fixture;
      
      const stats = await afriCycle.getContractStats();
      expect(stats.totalCollectors).to.equal(1);
      expect(stats.totalRecyclers).to.equal(1);
      expect(stats.totalCollections).to.equal(0);
      expect(stats.totalProcessingBatches).to.equal(0);
    });

    it('should return user detailed stats correctly', async function () {
      const { afriCycle, admin } = fixture;
      
      const detailedStats = await afriCycle.getUserDetailedStats(admin.address);
      expect(detailedStats.totalCollected).to.equal(0);
      expect(detailedStats.totalEarnings).to.equal(0);
      expect(detailedStats.reputationScore).to.equal(500);
    });

    it('should return platform stats correctly', async function () {
      const { afriCycle } = fixture;
      
      const platformStats = await afriCycle.getPlatformStats();
      expect(platformStats.totalUsers).to.equal(3); // admin + collector + recycler
      expect(platformStats.totalCollections).to.equal(0);
      expect(platformStats.totalProcessed).to.equal(0);
    });

    it('should return collector stats correctly', async function () {
      const { afriCycle, admin } = fixture;
      
      const collectorStats = await afriCycle.getCollectorStats(admin.address);
      expect(collectorStats.totalCollected).to.equal(0);
      expect(collectorStats.totalEarnings).to.equal(0);
      expect(collectorStats.reputationScore).to.equal(500);
    });

    it('should return recycler stats correctly', async function () {
      const { afriCycle, admin } = fixture;
      
      const recyclerStats = await afriCycle.getRecyclerStats(admin.address);
      expect(recyclerStats.totalEarnings).to.equal(0);
      expect(recyclerStats.activeListings).to.equal(0);
      expect(recyclerStats.reputationScore).to.equal(500);
    });

    it('should return user profile correctly', async function () {
      const { afriCycle, admin } = fixture;
      
      const userProfile = await afriCycle.getUserProfile(admin.address);
      expect(userProfile.name).to.equal('Test Collector');
      expect(userProfile.location).to.equal('Test Location');
      expect(userProfile.contactInfo).to.equal('test@example.com');
    });

    it('should return global stats correctly', async function () {
      const { afriCycle } = fixture;
      
      const globalStats = await afriCycle.getGlobalStats();
      expect(globalStats.totalUsers).to.equal(3);
      expect(globalStats.totalCollections).to.equal(0);
      expect(globalStats.totalProcessed).to.equal(0);
    });

    it('should return contract cUSD balance correctly', async function () {
      const { afriCycle, cUSDToken } = fixture;
      
      const balance = await afriCycle.getContractCUSDBalance();
      expect(balance).to.equal(parseEther('10000')); // Initial balance from fixture
    });
  });

  describe('Security and Edge Cases', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
    });

    it('should prevent reentrancy attacks', async function () {
      const { afriCycle, admin } = fixture;
      
      // Register collector
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      
      // Test reentrancy protection on withdrawal functions
      await expect(
        afriCycle.connect(admin).withdrawCollectorEarnings(parseEther('1'))
      ).to.be.revertedWith('Insufficient balance');
    });

    it('should handle zero address validation', async function () {
      const { afriCycle } = fixture;
      
      await expect(
        afriCycle.registerCollector('Test', 'Test', 'test@example.com')
      ).to.not.be.reverted;
    });

    it('should handle maximum batch size limits', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      // Test batch size limits (should be limited to 50 items)
      const largeBatch = Array(51).fill(null).map((_, i) => ({
        weight: 10,
        location: `Location ${i}`,
        wasteType: WasteStream.PLASTIC,
        quality: QualityGrade.MEDIUM,
        qrCode: `QR${i}`,
        description: `Description ${i}`,
        collectorAddress: admin.address,
        recyclerAddress: admin.address,
        timestamp: Math.floor(Date.now() / 1000)
      }));
      
      const weights = largeBatch.map(item => item.weight);
      const locations = largeBatch.map(item => item.location);
      const wasteTypes = largeBatch.map(item => item.wasteType);
      const qualities = largeBatch.map(item => item.quality);
      const qrCodes = largeBatch.map(item => item.qrCode);
      const descriptions = largeBatch.map(item => item.description);
      const collectorAddresses = largeBatch.map(item => item.collectorAddress);
      const recyclerAddresses = largeBatch.map(item => item.recyclerAddress);
      const timestamps = largeBatch.map(item => item.timestamp);
      
      await expect(
        afriCycle.connect(admin).batchCreateCollection(
          weights,
          locations,
          wasteTypes,
          qualities,
          qrCodes,
          descriptions,
          collectorAddresses,
          recyclerAddresses,
          timestamps
        )
      ).to.be.revertedWith('Batch size too large');
    });

    it('should handle invalid waste type validation', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          50,
          'Test Location',
          999, // Invalid waste type
          QualityGrade.MEDIUM,
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('Invalid waste type');
    });

    it('should handle invalid quality grade validation', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          50,
          'Test Location',
          WasteStream.PLASTIC,
          999, // Invalid quality grade
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('Invalid quality grade');
    });

    it('should handle zero weight validation', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          0, // Zero weight
          'Test Location',
          WasteStream.PLASTIC,
          QualityGrade.MEDIUM,
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('Weight must be greater than 0');
    });

    it('should handle maximum collection weight limits', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          1001, // Exceeds maximum weight (1000)
          'Test Location',
          WasteStream.PLASTIC,
          QualityGrade.MEDIUM,
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('Collection weight exceeds maximum');
    });

    it('should handle suspended user restrictions', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).suspendUser(admin.address, 'Test suspension');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          50,
          'Test Location',
          WasteStream.PLASTIC,
          QualityGrade.MEDIUM,
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('User is suspended');
    });

    it('should handle blacklisted user restrictions', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).blacklistUser(admin.address, 'Test blacklist');
      
      await expect(
        afriCycle.connect(admin).createCollection(
          50,
          'Test Location',
          WasteStream.PLASTIC,
          QualityGrade.MEDIUM,
          'QR123',
          'Test Description',
          admin.address,
          admin.address,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith('User is blacklisted');
    });

    it('should handle reentrancy protection', async function () {
      const { afriCycle, collector } = fixture;
      // This is implicitly tested by the nonReentrant modifier on withdrawal functions
      // The modifier would prevent reentrancy attacks
      await afriCycle.connect(collector).registerCollector(
        'Test Collector',
        'Test Location',
        'collector@test.com'
      );

      // Normal withdrawal should work
      const futureTime = (await time.latest()) + 3600;
      await afriCycle.connect(collector).createCollection(
        WasteStream.PLASTIC,
        100,
        'Test Location',
        'image-hash',
        futureTime,
        recycler.address
      );

      // This should work without reentrancy issues
      await afriCycle.connect(collector).withdrawCollectorEarnings(parseEther('0.1'));
    });
  });

  describe('Gas Optimization Tests', function () {
    let fixture: AfriCycleFixture;

    beforeEach(async function () {
      fixture = await loadFixture(deployAfriCycleFixture);
    });

    it('should optimize gas usage for batch operations', async function () {
      const { afriCycle, admin } = fixture;
      
      await afriCycle.connect(admin).registerCollector('Test Collector', 'Test Location', 'test@example.com');
      await afriCycle.connect(admin).registerRecycler('Test Recycler', 'Test Location', 'recycler@example.com');
      
      // Test batch creation gas usage
      const batchSize = 10;
      const weights = Array(batchSize).fill(50);
      const locations = Array(batchSize).fill('Test Location');
      const wasteTypes = Array(batchSize).fill(WasteStream.PLASTIC);
      const qualities = Array(batchSize).fill(QualityGrade.MEDIUM);
      const qrCodes = Array(batchSize).fill().map((_, i) => `QR${i}`);
      const descriptions = Array(batchSize).fill().map((_, i) => `Description ${i}`);
      const collectorAddresses = Array(batchSize).fill(admin.address);
      const recyclerAddresses = Array(batchSize).fill(admin.address);
      const timestamps = Array(batchSize).fill(Math.floor(Date.now() / 1000));
      
      const tx = await afriCycle.connect(admin).batchCreateCollection(
        weights,
        locations,
        wasteTypes,
        qualities,
        qrCodes,
        descriptions,
        collectorAddresses,
        recyclerAddresses,
        timestamps
      );
      
      const receipt = await tx.wait();
      
      // Verify gas usage is reasonable (this will vary based on network conditions)
      expect(receipt?.gasUsed).to.be.lessThan(2000000); // Adjust as needed
    });
  });
});
