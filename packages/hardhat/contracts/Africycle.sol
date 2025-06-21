// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import OpenZeppelin contracts for standard functionality
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "./AfricycleLibrary.sol";

/**
 * @title AfriCycle
 * @dev A comprehensive waste management ecosystem on the blockchain that enables:
 * - Waste collection and recycling tracking
 * - Marketplace for waste trading
 * - Impact credits for environmental contributions
 * - Reputation system for collectors and recyclers
 * - Carbon offset tracking
 * 
 * Key Features:
 * - Role-based access control (Admin, Collector, Recycler)
 * - Waste collection and processing workflow
 * - Quality assessment system
 * - Marketplace for waste trading
 * - Impact credits for environmental contributions
 * - Reputation and reward system
 */
contract AfriCycle is AccessControl, ReentrancyGuard, Pausable {
  using AfricycleLibrary for *;

  // ============ Custom Errors ============
  // Custom errors for gas optimization and better error handling
  error InsufficientBalance();
  error TransferFailed();
  error ZeroAddress();
  error ArrayLengthMismatch();
  error InvalidListingDescription();
  error TooManyActiveListings();
  error ProfileUpdateTooSoon();

  // ============ Role Definitions ============
  // Role-based access control for different user types
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
  bytes32 public constant COLLECTOR_ROLE = keccak256('COLLECTOR_ROLE');
  bytes32 public constant RECYCLER_ROLE = keccak256('RECYCLER_ROLE');

  // ============ Enums ============
  // Status tracking for various operations
  enum Status {
    PENDING,      // Initial state for new operations
    VERIFIED,     // Verified by recycler/admin
    REJECTED,     // Rejected by recycler/admin
    IN_PROGRESS,  // Processing is ongoing
    COMPLETED,    // Operation completed successfully
    CANCELLED,    // Operation cancelled
    ACTIVE        // Active state (used for listings)
  }

  // Components of electronic waste
  enum EWasteComponent {
    CPU,      // Central Processing Units
    BATTERY,  // Batteries
    PCB,      // Printed Circuit Boards
    OTHER     // Other electronic components
  }

  // ============ Structs ============
  // Profile tracking for waste collectors
  struct CollectorProfile {
    uint256 totalCollected;    // Total waste collected in kg
    uint256 totalEarnings;     // Total earnings from collections
    uint256 reputationScore;   // Reputation score (0-1000)
    uint256 lastUpdate;        // Last profile update timestamp
    mapping(AfricycleLibrary.WasteStream => uint256) collectedByType;  // Collection by waste type
    mapping(uint256 => bool) collectionHistory;  // History of collections
    uint256 collectionCount;   // Total number of collections
    uint256 totalPurchased;    // Total waste purchased from marketplace
  }

  // Profile tracking for recyclers
  struct RecyclerProfile {
    uint256 totalEarnings;     // Total earnings from processing
    uint256 activeListings;    // Number of active marketplace listings
    uint256 reputationScore;   // Reputation score (0-1000)
    uint256 totalInventory;    // Total waste in inventory
    uint256 scheduledPickups;  // Number of scheduled pickups
    uint256 activeCollectors;  // Number of active collectors
    uint256 lastUpdate;        // Last profile update timestamp
    mapping(AfricycleLibrary.WasteStream => uint256) processedByType;  // Processing by waste type
    mapping(AfricycleLibrary.WasteStream => uint256) inventoryByType;  // Inventory by waste type
    mapping(address => bool) registeredCollectors;  // Registered collectors
    uint256 collectorCount;    // Total number of registered collectors
    uint256 totalProcessed;    // Total waste processed
    uint256 totalSales;        // Total sales in marketplace
  }

  struct UserProfile {
    string name;
    string location;
    string contactInfo;
    Status status;
    uint256 registrationDate;
    uint256 verificationDate;
    bool isVerified;
    bytes32 role;
    CollectorProfile collectorProfile;
    RecyclerProfile recyclerProfile;
  }

  struct WasteCollection {
    uint256 id;
    address collector;
    AfricycleLibrary.WasteStream wasteType;
    uint256 weight;
    string location;
    string imageHash;
    Status status;
    uint256 timestamp;
    AfricycleLibrary.QualityGrade quality;
    uint256 rewardAmount;
    bool isProcessed;
    uint256 pickupTime;
    address selectedRecycler;
  }

  struct EWasteDetails {
    uint256 collectionId;
    mapping(EWasteComponent => uint256) components;
    string serialNumber;
    string manufacturer;
    uint256 estimatedValue;
  }

  struct ProcessingBatch {
    uint256 id;
    uint256[] collectionIds;
    address processor;
    AfricycleLibrary.WasteStream wasteType;
    uint256 inputAmount;
    uint256 outputAmount;
    uint256 timestamp;
    Status status;
    string processDescription;
    AfricycleLibrary.QualityGrade outputQuality;
    uint256 carbonOffset;
  }

  struct MarketplaceListing {
    uint256 id;
    address seller;
    AfricycleLibrary.WasteStream wasteType;
    uint256 amount;
    uint256 pricePerUnit;
    AfricycleLibrary.QualityGrade quality;
    bool isActive;
    uint256 timestamp;
    string description;
    Status status;
  }

  struct ImpactCredit {
    uint256 id;
    address owner;
    AfricycleLibrary.WasteStream wasteType;
    uint256 amount;
    uint256 carbonOffset;
    uint256 timestamp;
    string verificationProof;
  }

  struct UserStats {
    uint256[4] collected;
    uint256[4] processed;
    uint256 totalEarnings;
    uint256 reputationScore;
    uint256 activeListings;
    bool verifiedStatus;
    bool suspendedStatus;
    bool blacklistedStatus;
  }

  struct UserProfileView {
    string name;
    string location;
    string contactInfo;
    Status status;
    uint256 registrationDate;
    uint256 verificationDate;
    bool isVerified;
    bytes32 role;
    uint256 totalCollected;
    uint256 totalEarnings;
    uint256 collectorReputationScore;
    uint256[4] collectedByType;
    uint256 recyclerTotalEarnings;
    uint256 activeListings;
    uint256 recyclerReputationScore;
    uint256 totalInventory;
    uint256 scheduledPickups;
    uint256 activeCollectors;
    uint256[4] processedByType;
    uint256[4] inventoryByType;
  }

  // ============ State Variables ============
  // Core contract variables
  IERC20 public cUSDToken;  // cUSD token for payments
  uint256 private _collectionIdCounter;  // Counter for collection IDs
  uint256 private _processingIdCounter;  // Counter for processing batch IDs
  uint256 private _listingIdCounter;     // Counter for marketplace listing IDs
  uint256 private _impactCreditIdCounter;  // Counter for impact credit IDs

  // Storage mappings
  mapping(address => UserProfile) private userProfiles;  // User profiles
  mapping(uint256 => WasteCollection) public collections;  // Waste collections
  mapping(uint256 => EWasteDetails) public eWasteDetails;  // E-waste details
  mapping(uint256 => ProcessingBatch) public processingBatches;  // Processing batches
  mapping(uint256 => MarketplaceListing) public listings;  // Marketplace listings
  mapping(uint256 => ImpactCredit) public impactCredits;  // Impact credits

  // Reward and multiplier settings
  mapping(AfricycleLibrary.WasteStream => uint256) public rewardRates;  // Reward rates per waste type
  mapping(AfricycleLibrary.WasteStream => uint256) public totalProcessed;  // Total processed by type
  mapping(AfricycleLibrary.WasteStream => mapping(AfricycleLibrary.QualityGrade => uint256))
    public qualityMultipliers;  // Quality multipliers for rewards

  // Constants
  uint256 public constant MIN_PROFILE_UPDATE_INTERVAL = 1 days;  // Minimum time between profile updates
  uint256 public constant MAX_ACTIVE_LISTINGS = 20;  // Maximum active listings per user
  uint256 public constant MIN_REPUTATION_FOR_PROCESSING = 200;  // Minimum reputation for processing
  uint256 public constant MAX_COLLECTION_WEIGHT = 1000;  // Maximum collection weight in kg
  uint256 public constant MAX_PICKUP_TIME_WINDOW = 30 days;  // Maximum pickup scheduling window
  mapping(address => uint256) public lastProfileUpdate;
  mapping(address => uint256) public userActiveListings;
  mapping(address => bool) public isBlacklisted;
  mapping(address => bool) public isSuspended;
  mapping(AfricycleLibrary.WasteStream => uint256) public totalCollected;
  mapping(AfricycleLibrary.WasteStream => uint256)
    public totalMarketplaceVolume;
  mapping(AfricycleLibrary.WasteStream => uint256) public totalListings;
  uint256 public totalPlatformFees;
  uint256 public totalRewardsPaid;
  uint256 private constant CARBON_OFFSET_BASE = 100;
  uint256 private constant MAX_REPUTATION_SCORE = 1000;
  mapping(AfricycleLibrary.WasteStream => uint256)
    public carbonOffsetMultipliers;
  mapping(AfricycleLibrary.QualityGrade => uint256)
    public qualityCarbonMultipliers;
  mapping(AfricycleLibrary.WasteStream => uint256[]) private wasteTypeListings;

  // ============ Events ============
  // Events for tracking important state changes and operations
  event UserRegistered(address indexed user, string name, string location);
  event UserVerified(address indexed user);
  event UserRoleGranted(address indexed user, bytes32 indexed role);
  event UserRoleRevoked(address indexed user, bytes32 indexed role);
  event UserProfileUpdated(address indexed user, string name, string location);
  event UserReputationUpdated(address indexed user, uint256 newScore);
  event CollectionCreated(
    uint256 indexed collectionId,
    address indexed collector,
    uint256 weight,
    AfricycleLibrary.WasteStream wasteType
  );
  event CollectionUpdated(uint256 indexed id, uint256 weight, string location);
  event EWasteDetailsAdded(
    uint256 indexed collectionId,
    uint256[] componentCounts,
    string serialNumber,
    string manufacturer,
    uint256 estimatedValue
  );
  event ProcessingBatchCreated(
    uint256 indexed id,
    address indexed processor,
    AfricycleLibrary.WasteStream wasteType,
    uint256[] collectionIds,
    uint256 totalInput
  );
  event ProcessingBatchUpdated(
    uint256 indexed id,
    uint256 outputAmount,
    AfricycleLibrary.QualityGrade quality
  );
  event ProcessingCompleted(
    uint256 indexed id,
    uint256 outputAmount,
    uint256 carbonOffset,
    AfricycleLibrary.QualityGrade quality
  );
  event ListingCreated(
    uint256 indexed id,
    address indexed seller,
    AfricycleLibrary.WasteStream wasteType,
    uint256 amount,
    uint256 pricePerUnit,
    AfricycleLibrary.QualityGrade quality
  );
  event ListingUpdated(
    uint256 indexed id,
    uint256 newAmount,
    uint256 newPrice,
    string newDescription
  );
  event ListingPurchased(
    uint256 indexed id,
    address indexed buyer,
    uint256 amount,
    uint256 totalPrice,
    uint256 platformFee
  );
  event ListingCancelled(uint256 indexed id, address indexed seller);
  event ImpactCreditMinted(
    uint256 indexed id,
    address indexed owner,
    AfricycleLibrary.WasteStream wasteType,
    uint256 amount,
    uint256 carbonOffset
  );
  event ImpactCreditTransferred(
    uint256 indexed id,
    address indexed from,
    address indexed to
  );
  event ImpactCreditBurned(uint256 indexed id, address indexed owner);
  event RewardPaid(
    address indexed recipient,
    uint256 amount,
    AfricycleLibrary.WasteStream wasteType,
    uint256 collectionId
  );
  event PlatformFeePaid(
    address indexed from,
    uint256 amount,
    uint256 indexed listingId
  );
  event PlatformFeeWithdrawn(address indexed admin, uint256 amount);
  event RewardRateUpdated(
    AfricycleLibrary.WasteStream wasteType,
    uint256 newRate
  );
  event QualityMultiplierUpdated(
    AfricycleLibrary.WasteStream wasteType,
    AfricycleLibrary.QualityGrade quality,
    uint256 multiplier
  );
  event ContractPaused(address indexed admin);
  event ContractUnpaused(address indexed admin);
  event EmergencyWithdrawal(
    address indexed admin,
    address token,
    uint256 amount
  );
  event UserSuspended(address indexed user, string reason);
  event UserUnsuspended(address indexed user);
  event UserBlacklisted(address indexed user, string reason);
  event UserRemovedFromBlacklist(address indexed user);
  event RecyclerStatsUpdated(
    address indexed recycler,
    uint256 totalProcessed,
    uint256 totalEarnings,
    uint256 activeListings,
    uint256 reputationScore
  );
  event GlobalStatsUpdated(
    AfricycleLibrary.WasteStream indexed wasteType,
    uint256 totalCollected,
    uint256 totalProcessed,
    uint256 totalMarketplaceVolume
  );
  event PlatformStatsUpdated(
    uint256 totalPlatformFees,
    uint256 totalRewardsPaid,
    uint256 timestamp
  );
  event QualityAssessmentUpdated(
    uint256 indexed collectionId,
    AfricycleLibrary.QualityGrade oldGrade,
    AfricycleLibrary.QualityGrade newGrade,
    address indexed assessor
  );
  event BatchProcessingStatusChanged(
    uint256 indexed batchId,
    Status oldStatus,
    Status newStatus,
    address indexed processor
  );
  event ReputationChange(
    address indexed user,
    uint256 oldScore,
    uint256 newScore,
    string reason
  );
  event CollectorRegisteredAtRecycler(
    address indexed recycler,
    address indexed collector,
    uint256 timestamp
  );
  event CollectorRemovedFromRecycler(
    address indexed recycler,
    address indexed collector,
    uint256 timestamp
  );
  event CarbonOffsetMultiplierUpdated(
    AfricycleLibrary.WasteStream indexed wasteType,
    uint256 newMultiplier
  );
  event QualityCarbonMultiplierUpdated(
    AfricycleLibrary.QualityGrade indexed quality,
    uint256 newMultiplier
  );
  event RecyclerInventoryUpdated(
    address indexed recycler,
    AfricycleLibrary.WasteStream indexed wasteType,
    uint256 oldAmount,
    uint256 newAmount
  );
  event PickupScheduled(
    uint256 indexed collectionId,
    address indexed collector,
    address indexed recycler,
    uint256 pickupTime
  );
  event PickupConfirmed(uint256 indexed collectionId, address indexed recycler);
  event PickupRejected(
    uint256 indexed collectionId,
    address indexed recycler,
    string reason
  );
  event CollectorEarningsWithdrawn(address indexed collector, uint256 amount);
  event RecyclerEarningsWithdrawn(address indexed recycler, uint256 amount);
  event RecyclerInventoryWithdrawn(address indexed recycler, uint256 amount);
  event EmergencyEtherWithdrawn(address indexed admin, uint256 amount);

  // ============ Constructor ============
  /**
   * @dev Initializes the contract with cUSD token address and sets up initial roles and rates
   * @param _cUSDToken Address of the cUSD token contract
   */
  constructor(address _cUSDToken) {
    require(_cUSDToken != address(0), 'Invalid cUSD token address');
    cUSDToken = IERC20(_cUSDToken);

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(ADMIN_ROLE, msg.sender);
    _setRoleAdmin(COLLECTOR_ROLE, ADMIN_ROLE);
    _setRoleAdmin(RECYCLER_ROLE, ADMIN_ROLE);

    rewardRates[AfricycleLibrary.WasteStream.PLASTIC] = 0.05 ether;
    rewardRates[AfricycleLibrary.WasteStream.EWASTE] = 0.25 ether;
    rewardRates[AfricycleLibrary.WasteStream.METAL] = 0.1 ether;
    rewardRates[AfricycleLibrary.WasteStream.GENERAL] = 0.025 ether;

    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.LOW
    ] = 8000;
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.MEDIUM
    ] = 10000;
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.HIGH
    ] = 12000;
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.PREMIUM
    ] = 15000;

    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.PLASTIC] = 15000;
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.EWASTE] = 12000;
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.METAL] = 10000;
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.GENERAL] = 8000;

    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.LOW] = 8000;
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.MEDIUM] = 10000;
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.HIGH] = 12000;
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.PREMIUM] = 15000;
  }

  // ============ Modifiers ============
  // Access control and validation modifiers
  modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), 'Caller is not an admin');
    _;
  }

  modifier onlyCollector() {
    require(hasRole(COLLECTOR_ROLE, msg.sender), 'Caller is not a collector');
    _;
  }

  modifier onlyRecycler() {
    require(hasRole(RECYCLER_ROLE, msg.sender), 'Caller is not a recycler');
    _;
  }

  modifier notBlacklisted() {
    require(!isBlacklisted[msg.sender], 'User is blacklisted');
    _;
  }

  modifier notSuspended() {
    require(!isSuspended[msg.sender], 'User is suspended');
    _;
  }

  modifier canUpdateProfile() {
    if (block.timestamp < lastProfileUpdate[msg.sender] + MIN_PROFILE_UPDATE_INTERVAL) {
      revert ProfileUpdateTooSoon();
    }
    _;
  }

  modifier validAmount(uint256 _amount) {
    require(_amount > 0, 'Amount must be greater than 0');
    _;
  }

  modifier validWasteType(AfricycleLibrary.WasteStream _wasteType) {
    require(
      uint256(_wasteType) <= uint256(AfricycleLibrary.WasteStream.GENERAL),
      'Invalid waste type'
    );
    _;
  }

  modifier validQualityGrade(AfricycleLibrary.QualityGrade _quality) {
    require(
      uint256(_quality) <= uint256(AfricycleLibrary.QualityGrade.PREMIUM),
      'Invalid quality grade'
    );
    _;
  }

  // ============ User Management Functions ============
  /**
   * @dev Registers a new waste collector
   * @param _name Collector's name
   * @param _location Collector's location
   * @param _contactInfo Collector's contact information
   */
  function registerCollector(
    string memory _name,
    string memory _location,
    string memory _contactInfo
  ) external whenNotPaused {
    require(bytes(_name).length > 0, 'Name required');
    require(bytes(_location).length > 0, 'Location required');
    require(
      userProfiles[msg.sender].registrationDate == 0,
      'Already registered'
    );

    UserProfile storage profile = userProfiles[msg.sender];
    profile.name = _name;
    profile.location = _location;
    profile.contactInfo = _contactInfo;
    profile.status = Status.VERIFIED;
    profile.registrationDate = block.timestamp;
    profile.isVerified = true;
    profile.verificationDate = block.timestamp;
    profile.role = COLLECTOR_ROLE;

    profile.collectorProfile.reputationScore = 100;

    _grantRole(COLLECTOR_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, COLLECTOR_ROLE);
  }

  function registerRecycler(
    string memory _name,
    string memory _location,
    string memory _contactInfo
  ) external whenNotPaused {
    require(bytes(_name).length > 0, 'Name required');
    require(bytes(_location).length > 0, 'Location required');
    require(
      userProfiles[msg.sender].registrationDate == 0,
      'Already registered'
    );

    UserProfile storage profile = userProfiles[msg.sender];
    profile.name = _name;
    profile.location = _location;
    profile.contactInfo = _contactInfo;
    profile.status = Status.VERIFIED;
    profile.registrationDate = block.timestamp;
    profile.isVerified = true;
    profile.verificationDate = block.timestamp;
    profile.role = RECYCLER_ROLE;

    profile.recyclerProfile.reputationScore = 100;

    _grantRole(RECYCLER_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, RECYCLER_ROLE);
    emit RecyclerStatsUpdated(msg.sender, 0, 0, 0, 100);
  }

  function getUserRole(address _user) external view returns (bytes32) {
    return userProfiles[_user].role;
  }

  // ============ Collection Functions ============
  /**
   * @dev Creates a new waste collection request
   * @param _wasteType Type of waste being collected
   * @param _weight Weight of the waste in kg
   * @param _location Collection location
   * @param _imageHash Hash of the waste image for verification
   * @param _pickupTime Scheduled pickup time
   * @param _recycler Selected recycler for pickup
   * @return collectionId ID of the created collection
   */
  function createCollection(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _weight,
    string memory _location,
    string memory _imageHash,
    uint256 _pickupTime,
    address _recycler
  )
    external
    onlyCollector
    whenNotPaused
    notSuspended
    notBlacklisted
    returns (uint256)
  {
    require(_weight <= MAX_COLLECTION_WEIGHT, 'Weight exceeds maximum');
    require(_weight > 0, 'Weight must be positive');
    require(bytes(_location).length > 0, 'Location required');
    require(bytes(_imageHash).length > 0, 'Image hash required');
    require(_pickupTime > block.timestamp, 'Invalid pickup time');
    require(
      _pickupTime <= block.timestamp + MAX_PICKUP_TIME_WINDOW,
      'Pickup time too far'
    );
    require(hasRole(RECYCLER_ROLE, _recycler), 'Invalid recycler');

    uint256 collectionId = _collectionIdCounter++;
    uint256 baseReward = AfricycleLibrary.calculateReward(
      _weight,
      rewardRates[_wasteType]
    );
    uint256 collectionFee = AfricycleLibrary.calculatePlatformFee(baseReward, AfricycleLibrary.FeeType.COLLECTION);
    uint256 rewardAmount = baseReward - collectionFee;

    collections[collectionId] = WasteCollection({
      id: collectionId,
      collector: msg.sender,
      wasteType: _wasteType,
      weight: _weight,
      location: _location,
      imageHash: _imageHash,
      status: Status.PENDING,
      timestamp: block.timestamp,
      quality: AfricycleLibrary.QualityGrade.MEDIUM,
      rewardAmount: rewardAmount,
      isProcessed: false,
      pickupTime: _pickupTime,
      selectedRecycler: _recycler
    });

    _updateCollectionStats(
      userProfiles[msg.sender].collectorProfile,
      _wasteType,
      _weight,
      rewardAmount,
      collectionId,
      _recycler
    );

    totalPlatformFees += collectionFee;

    emit CollectionCreated(collectionId, msg.sender, _weight, _wasteType);
    emit RewardPaid(msg.sender, rewardAmount, _wasteType, collectionId);
    emit PickupScheduled(collectionId, msg.sender, _recycler, _pickupTime);

    return collectionId;
  }

  function updateCollection(
    uint256 _collectionId,
    uint256 _newWeight,
    string memory _location,
    string memory _imageHash
  ) external whenNotPaused notSuspended notBlacklisted {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.collector == msg.sender, 'Not collection owner');
    require(
      collection.status == Status.PENDING,
      'Cannot update non-pending collection'
    );
    require(_newWeight <= MAX_COLLECTION_WEIGHT, 'Weight exceeds maximum');
    require(_newWeight > 0, 'Weight must be positive');
    require(bytes(_location).length > 0, 'Location required');
    require(bytes(_imageHash).length > 0, 'Image hash required');

    collection.weight = _newWeight;
    collection.location = _location;
    collection.imageHash = _imageHash;

    emit CollectionUpdated(_collectionId, _newWeight, _location);
  }

  // ============ Helper Functions ============
  function _calculateTotalReward(
    AfricycleLibrary.WasteStream[] memory _wasteTypes,
    uint256[] memory _weights,
    uint256[] memory _pickupTimes,
    address[] memory _recyclers
  ) internal view returns (uint256) {
    uint256 totalReward = 0;

    for (uint256 i = 0; i < _wasteTypes.length; i++) {
      if (_weights[i] == 0 || _weights[i] > MAX_COLLECTION_WEIGHT) {
        revert('Invalid weight');
      }
      if (
        uint256(_wasteTypes[i]) > uint256(AfricycleLibrary.WasteStream.GENERAL)
      ) {
        revert('Invalid waste type');
      }
      if (
        _pickupTimes[i] <= block.timestamp ||
        _pickupTimes[i] > block.timestamp + MAX_PICKUP_TIME_WINDOW
      ) {
        revert('Invalid pickup time');
      }
      if (!hasRole(RECYCLER_ROLE, _recyclers[i])) {
        revert('Not a recycler');
      }

      uint256 reward = AfricycleLibrary.calculateReward(
        _weights[i],
        rewardRates[_wasteTypes[i]]
      );
      totalReward += reward;
    }

    return totalReward;
  }

  function _processCollections(
    AfricycleLibrary.WasteStream[] memory _wasteTypes,
    uint256[] memory _weights,
    string[] memory _locations,
    string[] memory _imageHashes,
    uint256[] memory _pickupTimes,
    address[] memory _recyclers,
    uint256[] memory collectionIds,
    uint256 totalReward
  ) internal {
    UserProfile storage profile = userProfiles[msg.sender];
    CollectorProfile storage collectorProfile = profile.collectorProfile;

    for (uint256 i = 0; i < _wasteTypes.length; i++) {
      uint256 collectionId = _collectionIdCounter++;
      collectionIds[i] = collectionId;

      uint256 rewardAmount = AfricycleLibrary.calculateReward(
        _weights[i],
        rewardRates[_wasteTypes[i]]
      );

      collections[collectionId] = WasteCollection({
        id: collectionId,
        collector: msg.sender,
        wasteType: _wasteTypes[i],
        weight: _weights[i],
        location: _locations[i],
        imageHash: _imageHashes[i],
        status: Status.PENDING,
        timestamp: block.timestamp,
        quality: AfricycleLibrary.QualityGrade.MEDIUM,
        rewardAmount: rewardAmount,
        isProcessed: false,
        pickupTime: _pickupTimes[i],
        selectedRecycler: _recyclers[i]
      });

      _updateCollectionStats(
        collectorProfile,
        _wasteTypes[i],
        _weights[i],
        rewardAmount,
        collectionId,
        _recyclers[i]
      );

      emit CollectionCreated(
        collectionId,
        msg.sender,
        _weights[i],
        _wasteTypes[i]
      );
      emit RewardPaid(msg.sender, rewardAmount, _wasteTypes[i], collectionId);
      emit PickupScheduled(
        collectionId,
        msg.sender,
        _recyclers[i],
        _pickupTimes[i]
      );
      emit GlobalStatsUpdated(
        _wasteTypes[i],
        totalCollected[_wasteTypes[i]],
        totalProcessed[_wasteTypes[i]],
        totalMarketplaceVolume[_wasteTypes[i]]
      );
    }

    if (!cUSDToken.transfer(msg.sender, totalReward)) {
      revert TransferFailed();
    }

    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  function _updateCollectionStats(
    CollectorProfile storage collectorProfile,
    AfricycleLibrary.WasteStream wasteType,
    uint256 weight,
    uint256 rewardAmount,
    uint256 collectionId,
    address recycler
  ) internal {
    collectorProfile.totalCollected += weight;
    collectorProfile.totalEarnings += rewardAmount;
    collectorProfile.collectedByType[wasteType] += weight;
    collectorProfile.collectionHistory[collectionId] = true;
    collectorProfile.collectionCount++;
    collectorProfile.lastUpdate = block.timestamp;

    userProfiles[recycler].recyclerProfile.scheduledPickups++;
    totalCollected[wasteType] += weight;
    totalRewardsPaid += rewardAmount;
  }

  function batchCreateCollection(
    AfricycleLibrary.WasteStream[] memory _wasteTypes,
    uint256[] memory _weights,
    string[] memory _locations,
    string[] memory _imageHashes,
    uint256[] memory _pickupTimes,
    address[] memory _recyclers
  )
    external
    onlyCollector
    whenNotPaused
    notSuspended
    notBlacklisted
    returns (uint256[] memory)
  {
    if (
      _wasteTypes.length != _weights.length ||
      _weights.length != _locations.length ||
      _locations.length != _imageHashes.length ||
      _imageHashes.length != _pickupTimes.length ||
      _pickupTimes.length != _recyclers.length
    ) {
      revert ArrayLengthMismatch();
    }

    if (_wasteTypes.length == 0 || _wasteTypes.length > 100) {
      revert('Invalid collection count');
    }

    uint256 totalReward = _calculateTotalReward(
      _wasteTypes,
      _weights,
      _pickupTimes,
      _recyclers
    );
    _checkContractBalance(totalReward);

    uint256[] memory collectionIds = new uint256[](_wasteTypes.length);
    _processCollections(
      _wasteTypes,
      _weights,
      _locations,
      _imageHashes,
      _pickupTimes,
      _recyclers,
      collectionIds,
      totalReward
    );

    return collectionIds;
  }

  function confirmPickup(
    uint256 _collectionId
  ) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.selectedRecycler == msg.sender, 'Not selected recycler');
    require(collection.status == Status.PENDING, 'Not pending');

    collection.status = Status.VERIFIED;

    emit PickupConfirmed(_collectionId, msg.sender);
  }

  function rejectPickup(
    uint256 _collectionId,
    string memory _reason
  ) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.selectedRecycler == msg.sender, 'Not selected recycler');
    require(collection.status == Status.PENDING, 'Not pending');

    collection.status = Status.REJECTED;
    userProfiles[msg.sender].recyclerProfile.scheduledPickups--;

    emit PickupRejected(_collectionId, msg.sender, _reason);
  }

  function updatePickupDetails(
    uint256 _collectionId,
    uint256 _newPickupTime,
    address _newRecycler
  ) external onlyAdmin whenNotPaused {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.id != 0, 'Collection does not exist');
    require(_newPickupTime > block.timestamp, 'Pickup time must be in future');
    require(
      _newPickupTime <= block.timestamp + MAX_PICKUP_TIME_WINDOW,
      'Pickup time too far'
    );
    require(hasRole(RECYCLER_ROLE, _newRecycler), 'Not a recycler');

    address oldRecycler = collection.selectedRecycler;
    if (oldRecycler != _newRecycler) {
      userProfiles[oldRecycler].recyclerProfile.scheduledPickups--;
      userProfiles[_newRecycler].recyclerProfile.scheduledPickups++;
    }

    collection.pickupTime = _newPickupTime;
    collection.selectedRecycler = _newRecycler;

    emit PickupScheduled(
      _collectionId,
      collection.collector,
      _newRecycler,
      _newPickupTime
    );
  }

  function addEWasteDetails(
    uint256 _collectionId,
    uint256[] memory _componentCounts,
    string memory _serialNumber,
    string memory _manufacturer,
    uint256 _estimatedValue
  ) external onlyCollector whenNotPaused {
    require(
      collections[_collectionId].wasteType ==
        AfricycleLibrary.WasteStream.EWASTE,
      'Not e-waste'
    );
    require(
      collections[_collectionId].collector == msg.sender,
      'Not collector'
    );
    require(_componentCounts.length == 4, 'Invalid component count');

    EWasteDetails storage details = eWasteDetails[_collectionId];
    details.collectionId = _collectionId;
    details.serialNumber = _serialNumber;
    details.manufacturer = _manufacturer;
    details.estimatedValue = _estimatedValue;

    for (uint i = 0; i < _componentCounts.length; i++) {
      details.components[EWasteComponent(i)] = _componentCounts[i];
    }

    emit EWasteDetailsAdded(
      _collectionId,
      _componentCounts,
      _serialNumber,
      _manufacturer,
      _estimatedValue
    );
  }

  // ============ Processing Functions ============
  /**
   * @dev Creates a new processing batch for waste recycling
   * @param _collectionIds Array of collection IDs to process
   * @param _processDescription Description of the processing method
   * @return batchId ID of the created processing batch
   */
  function createProcessingBatch(
    uint256[] memory _collectionIds,
    string memory _processDescription
  )
    external
    onlyRecycler
    whenNotPaused
    notSuspended
    notBlacklisted
    returns (uint256)
  {
    require(_collectionIds.length > 0, 'No collections provided');
    require(
      _collectionIds.length <= AfricycleLibrary.MAX_BATCH_SIZE,
      'Too many collections'
    );
    require(
      bytes(_processDescription).length > 0,
      'Process description required'
    );

    validateCollectionIds(_collectionIds);

    uint256 batchId = _processingIdCounter++;
    uint256 totalInput = 0;
    AfricycleLibrary.WasteStream wasteType = collections[_collectionIds[0]]
      .wasteType;

    for (uint256 i = 0; i < _collectionIds.length; i++) {
      WasteCollection storage collection = collections[_collectionIds[i]];
      require(
        collection.selectedRecycler == msg.sender,
        'Not selected recycler'
      );
      require(collection.status == Status.VERIFIED, 'Collection not verified');
      require(collection.wasteType == wasteType, 'Mixed waste types');
      require(!collection.isProcessed, 'Collection already processed');

      totalInput += collection.weight;
      collection.isProcessed = true;
    }

    processingBatches[batchId] = ProcessingBatch({
      id: batchId,
      collectionIds: _collectionIds,
      processor: msg.sender,
      wasteType: wasteType,
      inputAmount: totalInput,
      outputAmount: 0,
      timestamp: block.timestamp,
      status: Status.IN_PROGRESS,
      processDescription: _processDescription,
      outputQuality: AfricycleLibrary.QualityGrade.MEDIUM,
      carbonOffset: 0
    });

    emit ProcessingBatchCreated(
      batchId,
      msg.sender,
      wasteType,
      _collectionIds,
      totalInput
    );
    return batchId;
  }

  function calculateCarbonOffset(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _amount,
    AfricycleLibrary.QualityGrade _quality
  ) public view returns (uint256) {
    require(
      _amount <= type(uint256).max / CARBON_OFFSET_BASE,
      'Amount too large'
    );

    uint256 baseOffset = (_amount * CARBON_OFFSET_BASE);
    uint256 wasteMultiplier = carbonOffsetMultipliers[_wasteType];
    uint256 qualityMultiplier = qualityCarbonMultipliers[_quality];

    uint256 intermediate = (baseOffset * wasteMultiplier) / 10000;
    require(
      intermediate <= type(uint256).max / qualityMultiplier,
      'Calculation overflow'
    );
    return (intermediate * qualityMultiplier) / 10000;
  }

  function completeProcessing(
    uint256 _batchId,
    uint256 _outputAmount,
    AfricycleLibrary.QualityGrade _outputQuality
  ) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
    ProcessingBatch storage batch = processingBatches[_batchId];
    require(batch.processor == msg.sender, 'Not processor');
    require(batch.status == Status.IN_PROGRESS, 'Not in progress');
    require(_outputAmount <= batch.inputAmount, 'Invalid output amount');
    require(_outputAmount > 0, 'Output amount must be positive');
    require(
      uint256(_outputQuality) <= uint256(AfricycleLibrary.QualityGrade.PREMIUM),
      'Invalid quality'
    );

    batch.status = Status.COMPLETED;
    batch.outputAmount = _outputAmount;
    batch.outputQuality = _outputQuality;

    uint256 carbonOffset = calculateCarbonOffset(
      batch.wasteType,
      _outputAmount,
      _outputQuality
    );
    batch.carbonOffset = carbonOffset;

    // Calculate processing rewards for recycler
    uint256 processingValue = _outputAmount * rewardRates[batch.wasteType];
    uint256 processingFee = AfricycleLibrary.calculatePlatformFee(processingValue, AfricycleLibrary.FeeType.PROCESSING);
    uint256 recyclerProcessingReward = processingValue - processingFee;
    
    // Credit recycler with processing earnings immediately
    UserProfile storage recyclerProfile = userProfiles[msg.sender];
    recyclerProfile.recyclerProfile.totalEarnings += recyclerProcessingReward;
    recyclerProfile.recyclerProfile.totalProcessed += _outputAmount;
    recyclerProfile.recyclerProfile.processedByType[batch.wasteType] += _outputAmount;
    
    // Check contract balance and transfer processing reward
    _checkContractBalance(recyclerProcessingReward);
    if (!cUSDToken.transfer(msg.sender, recyclerProcessingReward)) {
      revert TransferFailed();
    }

    totalPlatformFees += processingFee;

    uint256 creditId = _impactCreditIdCounter++;
    uint256 impactCreditFee = AfricycleLibrary.calculatePlatformFee(carbonOffset, AfricycleLibrary.FeeType.IMPACT_CREDIT);
    totalPlatformFees += impactCreditFee;

    impactCredits[creditId] = ImpactCredit({
      id: creditId,
      owner: msg.sender,
      wasteType: batch.wasteType,
      amount: _outputAmount,
      carbonOffset: carbonOffset,
      timestamp: block.timestamp,
      verificationProof: ''
    });

    totalProcessed[batch.wasteType] += _outputAmount;

    emit ProcessingCompleted(
      _batchId,
      _outputAmount,
      carbonOffset,
      _outputQuality
    );
    emit ImpactCreditMinted(
      creditId,
      msg.sender,
      batch.wasteType,
      _outputAmount,
      carbonOffset
    );
    emit RewardPaid(msg.sender, recyclerProcessingReward, batch.wasteType, _batchId);
    emit RecyclerStatsUpdated(
      msg.sender,
      recyclerProfile.recyclerProfile.totalInventory,
      recyclerProfile.recyclerProfile.totalEarnings,
      recyclerProfile.recyclerProfile.activeListings,
      recyclerProfile.recyclerProfile.reputationScore
    );
  }

  // ============ Marketplace Functions ============
  /**
   * @dev Creates a new marketplace listing for waste trading
   * @param _wasteType Type of waste being listed
   * @param _amount Amount of waste available
   * @param _pricePerUnit Price per unit of waste
   * @param _quality Quality grade of the waste
   * @param _description Description of the listing
   * @return listingId ID of the created listing
   */
  function createListing(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _amount,
    uint256 _pricePerUnit,
    AfricycleLibrary.QualityGrade _quality,
    string memory _description
  )
    external
    onlyRecycler
    whenNotPaused
    notSuspended
    notBlacklisted
    returns (uint256)
  {
    require(_amount > 0, 'Amount must be positive');
    require(_pricePerUnit > 0, 'Price must be positive');
    require(bytes(_description).length > 0, 'Description required');
    require(
      uint256(_quality) <= uint256(AfricycleLibrary.QualityGrade.PREMIUM),
      'Invalid quality'
    );

    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.recyclerProfile.totalProcessed >= _amount,
      'Insufficient processed waste'
    );

    uint256 listingId = _listingIdCounter++;
    listings[listingId] = MarketplaceListing({
      id: listingId,
      seller: msg.sender,
      wasteType: _wasteType,
      amount: _amount,
      pricePerUnit: _pricePerUnit,
      quality: _quality,
      isActive: true,
      timestamp: block.timestamp,
      description: _description,
      status: Status.ACTIVE
    });

    profile.recyclerProfile.totalProcessed -= _amount;
    totalListings[_wasteType]++;
    wasteTypeListings[_wasteType].push(listingId);

    emit ListingCreated(
      listingId,
      msg.sender,
      _wasteType,
      _amount,
      _pricePerUnit,
      _quality
    );
    return listingId;
  }

  function updateListing(
    uint256 _listingId,
    uint256 _newAmount,
    uint256 _newPricePerUnit,
    string memory _newDescription
  ) external whenNotPaused notSuspended notBlacklisted {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.seller == msg.sender, 'Not seller');
    require(listing.status == Status.ACTIVE, 'Not active');
    require(_newAmount > 0, 'Amount must be positive');
    require(_newPricePerUnit > 0, 'Price must be positive');
    require(bytes(_newDescription).length > 0, 'Description required');

    UserProfile storage profile = userProfiles[msg.sender];
    uint256 amountDifference = _newAmount > listing.amount
      ? _newAmount - listing.amount
      : 0;

    if (amountDifference > 0) {
      require(
        profile.recyclerProfile.totalProcessed >= amountDifference,
        'Insufficient processed waste'
      );
      profile.recyclerProfile.totalProcessed -= amountDifference;
    } else if (_newAmount < listing.amount) {
      profile.recyclerProfile.totalProcessed += (listing.amount - _newAmount);
    }

    listing.amount = _newAmount;
    listing.pricePerUnit = _newPricePerUnit;
    listing.description = _newDescription;
    listing.timestamp = block.timestamp;

    emit ListingUpdated(
      _listingId,
      _newAmount,
      _newPricePerUnit,
      _newDescription
    );
  }

  function purchaseListing(
    uint256 _listingId
  ) external whenNotPaused notSuspended notBlacklisted {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.status == Status.ACTIVE, 'Not active');
    require(listing.seller != msg.sender, 'Cannot buy own listing');

    UserProfile storage buyerProfile = userProfiles[msg.sender];
    require(hasRole(COLLECTOR_ROLE, msg.sender), 'Must be collector');

    uint256 totalPrice = listing.amount * listing.pricePerUnit;
    uint256 platformFee = AfricycleLibrary.calculatePlatformFee(totalPrice, AfricycleLibrary.FeeType.MARKETPLACE);
    uint256 sellerAmount = totalPrice - platformFee;

    require(
      cUSDToken.transferFrom(msg.sender, address(this), totalPrice),
      'Transfer failed'
    );
    require(
      cUSDToken.transfer(listing.seller, sellerAmount),
      'Transfer to seller failed'
    );

    // Credit seller (recycler) with marketplace earnings
    UserProfile storage sellerProfile = userProfiles[listing.seller];
    sellerProfile.recyclerProfile.totalEarnings += sellerAmount;
    sellerProfile.recyclerProfile.totalSales += listing.amount;
    sellerProfile.recyclerProfile.reputationScore += AfricycleLibrary
      .calculateReputationIncrease(2, listing.quality);

    listing.status = Status.COMPLETED;
    listing.isActive = false;
    totalMarketplaceVolume[listing.wasteType] += totalPrice;
    totalPlatformFees += platformFee;

    buyerProfile.collectorProfile.totalPurchased += listing.amount;
    buyerProfile.collectorProfile.reputationScore += AfricycleLibrary
      .calculateReputationIncrease(1, listing.quality);

    emit ListingPurchased(
      _listingId,
      msg.sender,
      listing.amount,
      totalPrice,
      platformFee
    );
    emit RewardPaid(listing.seller, sellerAmount, listing.wasteType, _listingId);
    emit RecyclerStatsUpdated(
      listing.seller,
      sellerProfile.recyclerProfile.totalInventory,
      sellerProfile.recyclerProfile.totalEarnings,
      sellerProfile.recyclerProfile.activeListings,
      sellerProfile.recyclerProfile.reputationScore
    );
    emit GlobalStatsUpdated(
      listing.wasteType,
      totalCollected[listing.wasteType],
      totalProcessed[listing.wasteType],
      totalMarketplaceVolume[listing.wasteType]
    );
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  // ============ Admin Functions ============
  /**
   * @dev Updates the reward rate for a specific waste type
   * @param _wasteType Type of waste
   * @param _rate New reward rate
   */
  function setRewardRate(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _rate
  ) external onlyAdmin {
    rewardRates[_wasteType] = _rate;
    emit RewardRateUpdated(_wasteType, _rate);
  }

  function setQualityMultiplier(
    AfricycleLibrary.WasteStream _wasteType,
    AfricycleLibrary.QualityGrade _quality,
    uint256 _multiplier
  ) external onlyAdmin {
    require(_multiplier <= 20000, 'Multiplier too high');
    qualityMultipliers[_wasteType][_quality] = _multiplier;
    emit QualityMultiplierUpdated(_wasteType, _quality, _multiplier);
  }

  function withdrawPlatformFees() external onlyAdmin nonReentrant {
    uint256 balance = cUSDToken.balanceOf(address(this));
    require(balance > 0, 'No fees to withdraw');

    bool success = cUSDToken.transfer(msg.sender, balance);
    if (!success) revert TransferFailed();

    totalPlatformFees = 0;
    emit PlatformFeeWithdrawn(msg.sender, balance);
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  function pause() external onlyAdmin {
    _pause();
    emit ContractPaused(msg.sender);
  }

  function unpause() external onlyAdmin {
    _unpause();
    emit ContractUnpaused(msg.sender);
  }

  // ============ View Functions ============
  function getProcessingBatchCollections(
    uint256 _batchId
  ) external view returns (uint256[] memory) {
    return processingBatches[_batchId].collectionIds;
  }

  /**
   * @dev Returns detailed statistics for a user
   * @param _user Address of the user
   * @return collected Array of collected waste by type
   * @return processed Array of processed waste by type
   * @return totalEarnings Total earnings
   * @return reputationScore User's reputation score
   */
  function getUserStats(
    address _user
  ) external view returns (
    uint256[4] memory collected,
    uint256[4] memory processed,
    uint256 totalEarnings,
    uint256 reputationScore
  ) {
    UserProfile storage profile = userProfiles[_user];

    for (uint i = 0; i < 4; i++) {
      collected[i] = profile.collectorProfile.collectedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      processed[i] = profile.recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      collected,
      processed,
      profile.collectorProfile.totalEarnings +
        profile.recyclerProfile.totalEarnings,
      profile.recyclerProfile.reputationScore
    );
  }

  // ============ Additional User Management Functions ============
  function updateUserProfile(
    string memory _name,
    string memory _location,
    string memory _contactInfo
  ) external whenNotPaused notSuspended notBlacklisted canUpdateProfile {
    require(userProfiles[msg.sender].registrationDate > 0, 'Not registered');
    require(bytes(_name).length > 0, 'Name required');
    require(bytes(_location).length > 0, 'Location required');

    UserProfile storage profile = userProfiles[msg.sender];
    profile.name = _name;
    profile.location = _location;
    profile.contactInfo = _contactInfo;
    lastProfileUpdate[msg.sender] = block.timestamp;

    emit UserProfileUpdated(msg.sender, _name, _location);
  }

  function updateUserReputation(
    address _user,
    uint256 _newScore,
    string memory _reason
  ) external onlyAdmin whenNotPaused {
    require(_user != address(0), 'Invalid user address');
    require(_newScore <= MAX_REPUTATION_SCORE, 'Score too high');
    require(bytes(_reason).length > 0, 'Reason required');

    UserProfile storage profile = userProfiles[_user];
    uint256 oldScore = profile.collectorProfile.reputationScore;
    profile.collectorProfile.reputationScore = _newScore;

    emit ReputationChange(_user, oldScore, _newScore, _reason);
    emit UserReputationUpdated(_user, _newScore);
  }

  function batchUpdateReputation(
    address[] memory _users,
    uint256[] memory _scores,
    string memory _reason
  ) external onlyAdmin whenNotPaused {
    require(_users.length == _scores.length, 'Array length mismatch');
    require(bytes(_reason).length > 0, 'Reason required');

    for (uint256 i = 0; i < _users.length; i++) {
      require(_users[i] != address(0), 'Invalid user address');
      require(_scores[i] <= MAX_REPUTATION_SCORE, 'Score too high');

      UserProfile storage profile = userProfiles[_users[i]];
      uint256 oldScore = profile.collectorProfile.reputationScore;
      profile.collectorProfile.reputationScore = _scores[i];

      emit ReputationChange(_users[i], oldScore, _scores[i], _reason);
      emit UserReputationUpdated(_users[i], _scores[i]);
    }
  }

  // ============ Impact Credit Management ============
  function transferImpactCredit(
    uint256 _creditId,
    address _to
  ) external whenNotPaused {
    require(_to != address(0), 'Invalid recipient address');
    ImpactCredit storage credit = impactCredits[_creditId];
    require(credit.owner == msg.sender, 'Not owner');

    credit.owner = _to;
    emit ImpactCreditTransferred(_creditId, msg.sender, _to);
  }

  function burnImpactCredit(uint256 _creditId) external whenNotPaused {
    ImpactCredit storage credit = impactCredits[_creditId];
    require(credit.owner == msg.sender, 'Not owner');
    delete impactCredits[_creditId];
    emit ImpactCreditBurned(_creditId, msg.sender);
  }

  // ============ Processing Management ============
  function updateProcessingBatch(
    uint256 _batchId,
    uint256 _newOutputAmount,
    AfricycleLibrary.QualityGrade _newQuality
  ) external onlyRecycler whenNotPaused {
    ProcessingBatch storage batch = processingBatches[_batchId];
    require(batch.processor == msg.sender, 'Not processor');
    require(batch.status == Status.IN_PROGRESS, 'Not in progress');
    require(_newOutputAmount <= batch.inputAmount, 'Invalid amount');

    batch.outputAmount = _newOutputAmount;
    batch.outputQuality = _newQuality;

    emit ProcessingBatchUpdated(_batchId, _newOutputAmount, _newQuality);
  }

  // ============ Marketplace Management ============
  function cancelListing(uint256 _listingId) external whenNotPaused {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.seller == msg.sender, 'Not seller');
    require(listing.status == Status.ACTIVE, 'Not active');

    listing.status = Status.CANCELLED;
    userActiveListings[listing.seller]--;

    emit ListingCancelled(_listingId, listing.seller);
  }

  // ============ Emergency Functions ============
  function emergencyWithdraw(
    address _token,
    uint256 _amount
  ) external onlyAdmin whenPaused {
    require(_token != address(0), 'Invalid token');
    require(_amount > 0, 'Amount must be positive');
    require(
      IERC20(_token).balanceOf(address(this)) >= _amount,
      'Insufficient balance'
    );

    require(IERC20(_token).transfer(msg.sender, _amount), 'Transfer failed');

    emit EmergencyWithdrawal(msg.sender, _token, _amount);
  }

  function emergencyWithdrawEther() external onlyAdmin {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No Ether to withdraw');
    (bool success, ) = msg.sender.call{ value: balance }('');
    require(success, 'Ether withdrawal failed');
    emit EmergencyEtherWithdrawn(msg.sender, balance);
  }

  // ============ Withdrawal Functions ============
  function withdrawCollectorEarnings(
    uint256 _amount
  )
    external
    onlyCollector
    whenNotPaused
    notSuspended
    notBlacklisted
    nonReentrant
  {
    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.collectorProfile.totalEarnings >= _amount,
      'Insufficient balance'
    );
    require(_amount > 0, 'Invalid amount');

    _checkContractBalance(_amount);

    profile.collectorProfile.totalEarnings -= _amount;

    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit CollectorEarningsWithdrawn(msg.sender, _amount);
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  function withdrawRecyclerEarnings(
    uint256 _amount
  )
    external
    onlyRecycler
    whenNotPaused
    notSuspended
    notBlacklisted
    nonReentrant
  {
    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.recyclerProfile.totalEarnings >= _amount,
      'Insufficient balance'
    );
    require(_amount > 0, 'Invalid amount');

    _checkContractBalance(_amount);

    profile.recyclerProfile.totalEarnings -= _amount;

    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RecyclerEarningsWithdrawn(msg.sender, _amount);
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  function withdrawRecyclerInventory(
    uint256 _amount
  )
    external
    onlyRecycler
    whenNotPaused
    notSuspended
    notBlacklisted
    nonReentrant
  {
    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.recyclerProfile.totalInventory >= _amount,
      'Insufficient balance'
    );
    require(_amount > 0, 'Invalid amount');

    _checkContractBalance(_amount);

    profile.recyclerProfile.totalInventory -= _amount;

    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RecyclerInventoryWithdrawn(msg.sender, _amount);
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  // ============ Additional View Functions ============
  function getCollectionDetails(
    uint256 _collectionId
  )
    external
    view
    returns (
      WasteCollection memory collection,
      uint256[] memory componentCounts,
      string memory serialNumber,
      string memory manufacturer,
      uint256 estimatedValue
    )
  {
    collection = collections[_collectionId];
    if (collection.wasteType == AfricycleLibrary.WasteStream.EWASTE) {
      EWasteDetails storage details = eWasteDetails[_collectionId];
      componentCounts = new uint256[](4);
      for (uint i = 0; i < 4; i++) {
        componentCounts[i] = details.components[EWasteComponent(i)];
      }
      serialNumber = details.serialNumber;
      manufacturer = details.manufacturer;
      estimatedValue = details.estimatedValue;
    }
  }

  function getProcessingBatchDetails(
    uint256 _batchId
  )
    external
    view
    returns (
      ProcessingBatch memory batch,
      address processor,
      uint256[] memory collectionIds
    )
  {
    batch = processingBatches[_batchId];
    processor = batch.processor;
    collectionIds = batch.collectionIds;
  }

  function getMarketplaceListings(
    AfricycleLibrary.WasteStream _wasteType,
    bool _activeOnly
  ) external view returns (uint256[] memory) {
    uint256[] memory listingIds = wasteTypeListings[_wasteType];
    if (!_activeOnly) return listingIds;

    uint256 count = 0;
    for (uint256 i = 0; i < listingIds.length; i++) {
      if (listings[listingIds[i]].isActive) count++;
    }

    uint256[] memory result = new uint256[](count);
    uint256 index = 0;
    for (uint256 i = 0; i < listingIds.length; i++) {
      if (listings[listingIds[i]].isActive) result[index++] = listingIds[i];
    }
    return result;
  }

  function getUserImpactCredits(
    address _user
  ) external view returns (uint256[] memory) {
    uint256 count = 0;
    for (uint256 i = 0; i < _impactCreditIdCounter; i++) {
      if (impactCredits[i].owner == _user) {
        count++;
      }
    }

    uint256[] memory result = new uint256[](count);
    uint256 index = 0;
    for (uint256 i = 0; i < _impactCreditIdCounter; i++) {
      if (impactCredits[i].owner == _user) {
        result[index++] = i;
      }
    }
    return result;
  }

  function getContractStats()
    external
    view
    returns (
      uint256[4] memory collectedStats,
      uint256[4] memory processedStats,
      uint256 userCount,
      uint256 listingCount,
      uint256 creditCount
    )
  {
    listingCount = _listingIdCounter;
    creditCount = _impactCreditIdCounter;

    for (uint i = 0; i < 4; i++) {
      collectedStats[i] = totalCollected[AfricycleLibrary.WasteStream(i)];
      processedStats[i] = totalProcessed[AfricycleLibrary.WasteStream(i)];
    }

    return (
      collectedStats,
      processedStats,
      userCount,
      listingCount,
      creditCount
    );
  }

  function getUserDetailedStats(
    address _user
  ) external view returns (UserStats memory) {
    UserProfile storage profile = userProfiles[_user];
    UserStats memory stats;

    for (uint i = 0; i < 4; i++) {
      stats.collected[i] = profile.collectorProfile.collectedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      stats.processed[i] = profile.recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    stats.totalEarnings =
      profile.collectorProfile.totalEarnings +
      profile.recyclerProfile.totalEarnings;
    stats.reputationScore = profile.recyclerProfile.reputationScore;
    stats.activeListings = userActiveListings[_user];
    stats.verifiedStatus = profile.isVerified;
    stats.suspendedStatus = isSuspended[_user];
    stats.blacklistedStatus = isBlacklisted[_user];

    return stats;
  }

  function getPlatformStats()
    external
    view
    returns (
      uint256 userCount,
      uint256 collectionCount,
      uint256 processedCount,
      uint256 listingCount,
      uint256 creditCount,
      uint256 revenue,
      uint256[4] memory wasteStats
    )
  {
    userCount = _collectionIdCounter;
    collectionCount = _collectionIdCounter;
    processedCount = _processingIdCounter;
    listingCount = _listingIdCounter;
    creditCount = _impactCreditIdCounter;
    revenue = cUSDToken.balanceOf(address(this));

    for (uint i = 0; i < 4; i++) {
      wasteStats[i] = totalProcessed[AfricycleLibrary.WasteStream(i)];
    }

    return (
      userCount,
      collectionCount,
      processedCount,
      listingCount,
      creditCount,
      revenue,
      wasteStats
    );
  }

  // ============ Additional Functions ============
  function suspendUser(
    address _user,
    string memory _reason
  ) external onlyAdmin {
    require(!isSuspended[_user], 'Already suspended');
    isSuspended[_user] = true;
    emit UserSuspended(_user, _reason);
  }

  function unsuspendUser(address _user) external onlyAdmin {
    require(isSuspended[_user], 'Not suspended');
    isSuspended[_user] = false;
    emit UserUnsuspended(_user);
  }

  function blacklistUser(
    address _user,
    string memory _reason
  ) external onlyAdmin {
    require(!isBlacklisted[_user], 'Already blacklisted');
    isBlacklisted[_user] = true;
    emit UserBlacklisted(_user, _reason);
  }

  function removeFromBlacklist(address _user) external onlyAdmin {
    require(isBlacklisted[_user], 'Not blacklisted');
    isBlacklisted[_user] = false;
    emit UserRemovedFromBlacklist(_user);
  }

  // ============ Role-Specific View Functions ============
  function getCollectorStats(
    address _collector
  )
    external
    view
    returns (
      uint256 collectorTotalCollected,
      uint256 totalEarnings,
      uint256 reputationScore,
      uint256[4] memory collectedByType
    )
  {
    UserProfile storage profile = userProfiles[_collector];
    require(profile.role == COLLECTOR_ROLE, 'Not a collector');

    CollectorProfile storage collectorProfile = profile.collectorProfile;

    for (uint i = 0; i < 4; i++) {
      collectedByType[i] = collectorProfile.collectedByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      collectorProfile.totalCollected,
      collectorProfile.totalEarnings,
      collectorProfile.reputationScore,
      collectedByType
    );
  }

  function getRecyclerStats(
    address _recycler
  )
    external
    view
    returns (
      uint256 totalEarnings,
      uint256 activeListings,
      uint256 reputationScore,
      uint256 totalInventory,
      uint256 scheduledPickups,
      uint256 activeCollectors,
      uint256[4] memory processedByType,
      uint256[4] memory inventoryByType
    )
  {
    UserProfile storage profile = userProfiles[_recycler];
    require(profile.role == RECYCLER_ROLE, 'Not a recycler');

    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;

    for (uint i = 0; i < 4; i++) {
      processedByType[i] = recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      inventoryByType[i] = recyclerProfile.inventoryByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      recyclerProfile.totalEarnings,
      recyclerProfile.activeListings,
      recyclerProfile.reputationScore,
      recyclerProfile.totalInventory,
      recyclerProfile.scheduledPickups,
      recyclerProfile.activeCollectors,
      processedByType,
      inventoryByType
    );
  }

  function getUserProfile(
    address user
  ) external view returns (UserProfileView memory viewProfile) {
    if (user == address(0)) revert ZeroAddress();

    UserProfile storage profile = userProfiles[user];

    viewProfile.name = profile.name;
    viewProfile.location = profile.location;
    viewProfile.contactInfo = profile.contactInfo;
    viewProfile.status = profile.status;
    viewProfile.registrationDate = profile.registrationDate;
    viewProfile.verificationDate = profile.verificationDate;
    viewProfile.isVerified = profile.isVerified;
    viewProfile.role = profile.role;

    CollectorProfile storage collectorProfile = profile.collectorProfile;
    viewProfile.totalCollected = collectorProfile.totalCollected;
    viewProfile.totalEarnings = collectorProfile.totalEarnings;
    viewProfile.collectorReputationScore = collectorProfile.reputationScore;

    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;
    viewProfile.recyclerTotalEarnings = recyclerProfile.totalEarnings;
    viewProfile.activeListings = recyclerProfile.activeListings;
    viewProfile.recyclerReputationScore = recyclerProfile.reputationScore;
    viewProfile.totalInventory = recyclerProfile.totalInventory;
    viewProfile.scheduledPickups = recyclerProfile.scheduledPickups;
    viewProfile.activeCollectors = recyclerProfile.activeCollectors;

    for (uint i = 0; i < 4; ) {
      viewProfile.collectedByType[i] = collectorProfile.collectedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      viewProfile.inventoryByType[i] = recyclerProfile.inventoryByType[
        AfricycleLibrary.WasteStream(i)
      ];
      viewProfile.processedByType[i] = recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      unchecked {
        ++i;
      }
    }
  }

  function _checkContractBalance(uint256 _amount) internal view {
    require(
      cUSDToken.balanceOf(address(this)) >= _amount,
      'Insufficient contract balance'
    );
  }

  function getGlobalStats()
    external
    view
    returns (
      uint256[4] memory collectedStats,
      uint256[4] memory processedStats,
      uint256[4] memory marketplaceStats,
      uint256 platformFees,
      uint256 rewardsPaid
    )
  {
    for (uint i = 0; i < 4; i++) {
      collectedStats[i] = totalCollected[AfricycleLibrary.WasteStream(i)];
      processedStats[i] = totalProcessed[AfricycleLibrary.WasteStream(i)];
      marketplaceStats[i] = totalMarketplaceVolume[
        AfricycleLibrary.WasteStream(i)
      ];
    }
    return (
      collectedStats,
      processedStats,
      marketplaceStats,
      totalPlatformFees,
      totalRewardsPaid
    );
  }

  function updateCollectionQuality(
    uint256 _collectionId,
    AfricycleLibrary.QualityGrade _newGrade
  ) external onlyAdmin whenNotPaused {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.id != 0, 'Collection does not exist');

    AfricycleLibrary.QualityGrade oldGrade = collection.quality;
    collection.quality = _newGrade;

    emit QualityAssessmentUpdated(
      _collectionId,
      oldGrade,
      _newGrade,
      msg.sender
    );
  }

  function registerCollectorAtRecycler(
    address _collector
  ) external onlyRecycler whenNotPaused {
    UserProfile storage profile = userProfiles[msg.sender];
    require(profile.role == RECYCLER_ROLE, 'Not a recycler');
    require(hasRole(COLLECTOR_ROLE, _collector), 'Not a collector');

    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;
    recyclerProfile.registeredCollectors[_collector] = true;
    recyclerProfile.activeCollectors++;
    recyclerProfile.collectorCount++;

    emit CollectorRegisteredAtRecycler(msg.sender, _collector, block.timestamp);
    emit RecyclerStatsUpdated(
      msg.sender,
      recyclerProfile.totalInventory,
      recyclerProfile.totalEarnings,
      recyclerProfile.activeListings,
      recyclerProfile.reputationScore
    );
  }

  function removeCollectorFromRecycler(
    address _collector
  ) external onlyRecycler whenNotPaused {
    UserProfile storage profile = userProfiles[msg.sender];
    require(profile.role == RECYCLER_ROLE, 'Not a recycler');

    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;
    require(
      recyclerProfile.registeredCollectors[_collector],
      'Collector not registered'
    );

    recyclerProfile.registeredCollectors[_collector] = false;
    recyclerProfile.activeCollectors--;
    recyclerProfile.collectorCount--;
    recyclerProfile.lastUpdate = block.timestamp;

    emit CollectorRemovedFromRecycler(msg.sender, _collector, block.timestamp);
    emit RecyclerStatsUpdated(
      msg.sender,
      recyclerProfile.totalInventory,
      recyclerProfile.totalEarnings,
      recyclerProfile.activeListings,
      recyclerProfile.reputationScore
    );
  }

  function batchUpdateCollectionQuality(
    uint256[] calldata _collectionIds,
    AfricycleLibrary.QualityGrade[] calldata _newGrades
  ) external onlyAdmin whenNotPaused {
    require(_collectionIds.length == _newGrades.length, 'Length mismatch');

    for (uint i = 0; i < _collectionIds.length; ) {
      WasteCollection storage collection = collections[_collectionIds[i]];
      require(collection.id != 0, 'Collection does not exist');

      AfricycleLibrary.QualityGrade oldGrade = collection.quality;
      collection.quality = _newGrades[i];

      emit QualityAssessmentUpdated(
        _collectionIds[i],
        oldGrade,
        _newGrades[i],
        msg.sender
      );

      unchecked {
        ++i;
      }
    }
  }

  function updateCarbonOffsetMultiplier(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _multiplier
  ) external onlyAdmin {
    require(_multiplier <= 20000, 'Multiplier too high');
    carbonOffsetMultipliers[_wasteType] = _multiplier;
    emit CarbonOffsetMultiplierUpdated(_wasteType, _multiplier);
  }

  function updateQualityCarbonMultiplier(
    AfricycleLibrary.QualityGrade _quality,
    uint256 _multiplier
  ) external onlyAdmin {
    require(_multiplier <= 20000, 'Multiplier too high');
    qualityCarbonMultipliers[_quality] = _multiplier;
    emit QualityCarbonMultiplierUpdated(_quality, _multiplier);
  }

  function updateRecyclerInventory(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _newAmount
  ) external onlyRecycler whenNotPaused {
    RecyclerProfile storage profile = userProfiles[msg.sender].recyclerProfile;
    uint256 oldAmount = profile.inventoryByType[_wasteType];
    profile.inventoryByType[_wasteType] = _newAmount;
    profile.totalInventory = profile.totalInventory - oldAmount + _newAmount;

    emit RecyclerInventoryUpdated(
      msg.sender,
      _wasteType,
      oldAmount,
      _newAmount
    );
  }

  /**
   * @dev Validates collection IDs for processing
   * @param _collectionIds Array of collection IDs to validate
   */
  function validateCollectionIds(uint256[] memory _collectionIds) internal view {
    require(_collectionIds.length > 0 && _collectionIds.length <= AfricycleLibrary.MAX_BATCH_SIZE, 'Invalid collection count');
    for (uint i = 0; i < _collectionIds.length; i++) {
      WasteCollection storage collection = collections[_collectionIds[i]];
      require(collection.collector != address(0), 'Collection does not exist');
      require(!collection.isProcessed, 'Collection already processed');
    }
  }

  function getContractCUSDBalance() external view returns (uint256) {
    return cUSDToken.balanceOf(address(this));
  }
}
