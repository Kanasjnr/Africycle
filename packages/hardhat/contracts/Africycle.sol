// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './libraries/AfricycleLibrary.sol';

/**
 * @title AfriCycle
 * @dev A comprehensive waste management ecosystem on the blockchain
 *
 * This contract implements a full waste management system including:
 * - Multi-stream waste collection (Plastic, E-Waste, Metal, General)
 * - E-waste component tracking
 * - Processing and recycling operations
 * - Marketplace for recycled materials
 * - Impact credit system
 * - Reputation and reward mechanisms
 *
 * Key Features:
 * - Role-based access control for different stakeholders
 * - Quality-based reward system
 * - Carbon offset tracking
 * - Transparent verification process
 * - Marketplace for trading processed materials
 * - Impact credit system for environmental contributions
 *
 * @notice This contract uses cUSD (Celo Dollar) as the primary token for transactions
 */
contract AfriCycle is AccessControl, ReentrancyGuard, Pausable {
  using AfricycleLibrary for *;

  // ============ Custom Errors ============
  error InsufficientBalance();
  error TransferFailed();
  error NotAuthorized();
  error InvalidAmount();
  error ZeroAddress();
  error ArrayLengthMismatch();
  error InvalidListingDescription();
  error TooManyActiveListings();

  // ============ Role Definitions ============
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
  bytes32 public constant COLLECTOR_ROLE = keccak256('COLLECTOR_ROLE');
  bytes32 public constant COLLECTION_POINT_ROLE =
    keccak256('COLLECTION_POINT_ROLE');
  bytes32 public constant RECYCLER_ROLE = keccak256('RECYCLER_ROLE');
  bytes32 public constant CORPORATE_ROLE = keccak256('CORPORATE_ROLE');
  bytes32 public constant VERIFIER_ROLE = keccak256('VERIFIER_ROLE');

  // ============ Enums ============
  enum Status {
    PENDING,
    VERIFIED,
    REJECTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
  }

  enum EWasteComponent {
    CPU,
    BATTERY,
    PCB,
    OTHER
  }

  // ============ Structs ============
  struct CollectorProfile {
    uint256 totalCollected;    // 32 bytes
    uint256 totalEarnings;     // 32 bytes
    uint256 reputationScore;   // 32 bytes
    uint256 lastUpdate;        // 32 bytes - add timestamp for optimization
    mapping(AfricycleLibrary.WasteStream => uint256) collectedByType;
    // Remove array, use mapping instead
    mapping(uint256 => bool) collectionHistory;
    uint256 collectionCount;   // 32 bytes - track count instead of array
  }

  struct CollectionPointProfile {
    uint256 totalInventory;    // 32 bytes
    uint256 scheduledPickups;  // 32 bytes
    uint256 activeCollectors;  // 32 bytes
    uint256 lastUpdate;        // 32 bytes
    mapping(AfricycleLibrary.WasteStream => uint256) inventoryByType;
    // Replace array with mapping for O(1) lookups
    mapping(address => bool) registeredCollectors;
    uint256 collectorCount;    // 32 bytes
  }

  struct RecyclerProfile {
    uint256 totalEarnings;
    uint256 activeListings;
    uint256 reputationScore;
    mapping(AfricycleLibrary.WasteStream => uint256) processedByType;
  }

  struct CorporateProfile {
    uint256 totalPurchases;
    uint256 totalImpactCredits;
    uint256 carbonOffset;
    mapping(AfricycleLibrary.WasteStream => uint256) purchasedByType;
    uint256[] purchaseHistory;
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
    CollectionPointProfile collectionPointProfile;
    RecyclerProfile recyclerProfile;
    CorporateProfile corporateProfile;
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
    uint256 carbonCredits;
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
    // Collector stats
    uint256 totalCollected;
    uint256 totalEarnings;
    uint256 collectorReputationScore;
    uint256[4] collectedByType;
    // Collection point stats
    uint256 totalInventory;
    uint256 scheduledPickups;
    uint256 activeCollectors;
    uint256[4] inventoryByType;
    // Recycler stats
    uint256 recyclerTotalEarnings;
    uint256 activeListings;
    uint256 recyclerReputationScore;
    uint256[4] processedByType;
    // Corporate stats
    uint256 totalPurchases;
    uint256 totalImpactCredits;
    uint256 carbonOffset;
    uint256[4] purchasedByType;
  }

  // ============ State Variables ============

  /// @notice Celo Dollar token contract
  IERC20 public cUSDToken;

  /// @notice Collection ID counter
  uint256 private _collectionIdCounter;

  /// @notice Processing ID counter
  uint256 private _processingIdCounter;

  /// @notice Listing ID counter
  uint256 private _listingIdCounter;

  /// @notice Impact credit ID counter
  uint256 private _impactCreditIdCounter;

  // ============ Mappings ============

  /// @notice User profiles mapping
  mapping(address => UserProfile) private userProfiles;

  /// @notice Waste collections mapping
  mapping(uint256 => WasteCollection) public collections;

  /// @notice E-waste details mapping
  mapping(uint256 => EWasteDetails) public eWasteDetails;

  /// @notice Processing batches mapping
  mapping(uint256 => ProcessingBatch) public processingBatches;

  /// @notice Marketplace listings mapping
  mapping(uint256 => MarketplaceListing) public listings;

  /// @notice Impact credits mapping
  mapping(uint256 => ImpactCredit) public impactCredits;

  /// @notice Reward rates by waste type
  mapping(AfricycleLibrary.WasteStream => uint256) public rewardRates;

  /// @notice Total processed waste by type
  mapping(AfricycleLibrary.WasteStream => uint256) public totalProcessed;

  /// @notice Quality multipliers by waste type and grade
  mapping(AfricycleLibrary.WasteStream => mapping(AfricycleLibrary.QualityGrade => uint256))
    public qualityMultipliers;

  // ============ Additional Security Features ============

  /**
   * @notice Minimum time between profile updates (in seconds)
   * @dev Prevents spam updates
   */
  uint256 public constant MIN_PROFILE_UPDATE_INTERVAL = 1 days;

  /**
   * @notice Maximum number of active listings per user
   * @dev Prevents market manipulation
   */
  uint256 public constant MAX_ACTIVE_LISTINGS = 20;

  /**
   * @notice Minimum reputation score required for certain operations
   * @dev Prevents abuse by new/low-reputation users
   */
  uint256 public constant MIN_REPUTATION_FOR_PROCESSING = 200;

  /**
   * @notice Maximum weight per collection (in kg)
   * @dev Prevents unrealistic collection amounts
   */
  uint256 public constant MAX_COLLECTION_WEIGHT = 1000;

  // ============ Additional State Variables ============

  /**
   * @notice Last profile update timestamp per user
   */
  mapping(address => uint256) public lastProfileUpdate;

  /**
   * @notice Number of active listings per user
   */
  mapping(address => uint256) public userActiveListings;

  /**
   * @notice Blacklisted addresses
   */
  mapping(address => bool) public isBlacklisted;

  /**
   * @notice Suspended users
   */
  mapping(address => bool) public isSuspended;

  // ============ Events ============

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
  event EWasteComponentUpdated(
    uint256 indexed collectionId,
    EWasteComponent component,
    uint256 count
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
  event ProcessingRejected(uint256 indexed id, string reason);

  event ListingCreated(
    uint256 indexed id,
    address indexed seller,
    AfricycleLibrary.WasteStream wasteType,
    uint256 amount,
    uint256 pricePerUnit,
    AfricycleLibrary.QualityGrade quality,
    uint256 carbonCredits
  );
  event ListingUpdated(
    uint256 indexed id,
    uint256 newAmount,
    uint256 newPrice,
    bool isActive
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

  event OperationFailed(
    bytes32 indexed operation,
    string reason,
    uint256 timestamp
  );
  event SecurityIncident(
    address indexed account,
    string description,
    uint256 timestamp
  );

  event UserSuspended(address indexed user, string reason);
  event UserUnsuspended(address indexed user);
  event UserBlacklisted(address indexed user, string reason);
  event UserRemovedFromBlacklist(address indexed user);

  event CollectionPointStatsUpdated(
    address indexed collectionPoint,
    uint256 totalInventory,
    uint256 scheduledPickups,
    uint256 activeCollectors
  );

  event RecyclerStatsUpdated(
    address indexed recycler,
    uint256 totalProcessed,
    uint256 totalEarnings,
    uint256 activeListings,
    uint256 reputationScore
  );

  event CorporateStatsUpdated(
    address indexed corporate,
    uint256 totalPurchases,
    uint256 totalImpactCredits,
    uint256 carbonOffset
  );

  // Add new events for global state tracking
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

  // Add new events
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

  event CollectorRegisteredAtPoint(
    address indexed collectionPoint,
    address indexed collector,
    uint256 timestamp
  );

  event CollectorRemovedFromPoint(
    address indexed collectionPoint,
    address indexed collector,
    uint256 timestamp
  );

  // ============ Additional State Variables ============

  // Add global state tracking
  mapping(AfricycleLibrary.WasteStream => uint256) public totalCollected;
  mapping(AfricycleLibrary.WasteStream => uint256)
    public totalMarketplaceVolume;
  uint256 public totalPlatformFees;
  uint256 public totalRewardsPaid;

  // Add carbon offset calculation constants
  uint256 private constant CARBON_OFFSET_BASE = 100; // Base carbon offset per kg
  mapping(AfricycleLibrary.WasteStream => uint256) public carbonOffsetMultipliers;
  mapping(AfricycleLibrary.QualityGrade => uint256) public qualityCarbonMultipliers;

  // ============ Constructor ============

  /**
   * @notice Initializes the AfriCycle contract
   * @param _cUSDToken Address of the cUSD token contract
   */
  constructor(address _cUSDToken) {
    require(_cUSDToken != address(0), "Invalid cUSD token address");
    cUSDToken = IERC20(_cUSDToken);

    // Set up role hierarchy
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(ADMIN_ROLE, msg.sender);
    _setupRole(VERIFIER_ROLE, msg.sender); // Admin is also a verifier

    // Set role admins
    _setRoleAdmin(COLLECTOR_ROLE, ADMIN_ROLE);
    _setRoleAdmin(COLLECTION_POINT_ROLE, ADMIN_ROLE);
    _setRoleAdmin(RECYCLER_ROLE, ADMIN_ROLE);
    _setRoleAdmin(CORPORATE_ROLE, ADMIN_ROLE);
    _setRoleAdmin(VERIFIER_ROLE, ADMIN_ROLE);

    // Initialize default reward rates (in cUSD, scaled by 1e18)
    rewardRates[AfricycleLibrary.WasteStream.PLASTIC] = 0.05 ether; // 0.05 cUSD per kg (reduced from 0.1)
    rewardRates[AfricycleLibrary.WasteStream.EWASTE] = 0.25 ether; // 0.25 cUSD per kg (reduced from 0.5)
    rewardRates[AfricycleLibrary.WasteStream.METAL] = 0.1 ether; // 0.1 cUSD per kg (reduced from 0.2)
    rewardRates[AfricycleLibrary.WasteStream.GENERAL] = 0.025 ether; // 0.025 cUSD per kg (reduced from 0.05)

    // Initialize quality multipliers (percentage, base 10000)
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.LOW
    ] = 8000; // 80%
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.MEDIUM
    ] = 10000; // 100%
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.HIGH
    ] = 12000; // 120%
    qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][
      AfricycleLibrary.QualityGrade.PREMIUM
    ] = 15000; // 150%

    // Initialize carbon offset multipliers (percentage, base 10000)
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.PLASTIC] = 15000;  // 150% - highest impact
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.EWASTE] = 12000;   // 120% - high impact
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.METAL] = 10000;    // 100% - base impact
    carbonOffsetMultipliers[AfricycleLibrary.WasteStream.GENERAL] = 8000;   // 80% - lower impact

    // Initialize quality carbon multipliers
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.LOW] = 8000;     // 80%
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.MEDIUM] = 10000; // 100%
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.HIGH] = 12000;   // 120%
    qualityCarbonMultipliers[AfricycleLibrary.QualityGrade.PREMIUM] = 15000; // 150%
  }

  // ============ Modifiers ============

  /// @notice Restricts function access to admin role
  modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), 'Caller is not an admin');
    _;
  }

  /// @notice Restricts function access to verifier role
  modifier onlyVerifier() {
    require(hasRole(VERIFIER_ROLE, msg.sender), 'Caller is not a verifier');
    _;
  }

  /// @notice Restricts function access to collector role
  modifier onlyCollector() {
    require(hasRole(COLLECTOR_ROLE, msg.sender), 'Caller is not a collector');
    _;
  }

  /// @notice Restricts function access to recycler role
  modifier onlyRecycler() {
    require(hasRole(RECYCLER_ROLE, msg.sender), 'Caller is not a recycler');
    _;
  }

  /// @notice Restricts function access to corporate role
  modifier onlyCorporate() {
    require(
      hasRole(CORPORATE_ROLE, msg.sender),
      'Caller is not a corporate partner'
    );
    _;
  }

  /// @notice Restricts function access to collection point role
  modifier onlyCollectionPoint() {
    require(
      hasRole(COLLECTION_POINT_ROLE, msg.sender),
      'Caller is not a collection point'
    );
    _;
  }

  /// @notice Ensures user is not blacklisted
  modifier notBlacklisted() {
    require(!isBlacklisted[msg.sender], 'User is blacklisted');
    _;
  }

  /// @notice Ensures user is not suspended
  modifier notSuspended() {
    require(!isSuspended[msg.sender], 'User is suspended');
    _;
  }

  /// @notice Ensures sufficient time has passed since last profile update
  modifier canUpdateProfile() {
    require(
      block.timestamp >=
        lastProfileUpdate[msg.sender] + MIN_PROFILE_UPDATE_INTERVAL,
      'Too soon to update profile'
    );
    _;
  }

  // Add safety checks for critical operations
  modifier validAmount(uint256 _amount) {
    require(_amount > 0, "Amount must be greater than 0");
    require(_amount <= type(uint256).max / 1e18, "Amount too large");
    _;
  }

  modifier validWasteType(AfricycleLibrary.WasteStream _wasteType) {
    require(uint256(_wasteType) <= uint256(AfricycleLibrary.WasteStream.GENERAL), "Invalid waste type");
    _;
  }

  modifier validQualityGrade(AfricycleLibrary.QualityGrade _quality) {
    require(uint256(_quality) <= uint256(AfricycleLibrary.QualityGrade.PREMIUM), "Invalid quality grade");
    _;
  }

  // ============ User Management Functions ============

  /**
   * @notice Registers a new collector with role-specific initialization
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

    CollectorProfile storage collectorProfile = profile.collectorProfile;
    collectorProfile.reputationScore = 100; // Initialize with base score

    _grantRole(COLLECTOR_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, COLLECTOR_ROLE);
  }

  /**
   * @notice Registers a new collection point with role-specific initialization
   */
  function registerCollectionPoint(
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
    profile.role = COLLECTION_POINT_ROLE;

    // Initialize collection point-specific profile
    CollectionPointProfile storage collectionPointProfile = profile
      .collectionPointProfile;
    collectionPointProfile.totalInventory = 0;
    collectionPointProfile.scheduledPickups = 0;
    collectionPointProfile.activeCollectors = 0;

    _grantRole(COLLECTION_POINT_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, COLLECTION_POINT_ROLE);
    emit CollectionPointStatsUpdated(
      msg.sender,
      0, // totalInventory
      0, // scheduledPickups
      0 // activeCollectors
    );
  }

  /**
   * @notice Registers a new recycler with role-specific initialization
   */
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

    // Initialize recycler-specific profile
    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;
    recyclerProfile.totalEarnings = 0;
    recyclerProfile.activeListings = 0;
    recyclerProfile.reputationScore = 100;

    _grantRole(RECYCLER_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, RECYCLER_ROLE);
    emit RecyclerStatsUpdated(
      msg.sender,
      0, // totalProcessed
      0, // totalEarnings
      0, // activeListings
      100 // reputationScore
    );
  }

  /**
   * @notice Registers a new corporate partner with role-specific initialization
   */
  function registerCorporate(
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
    profile.role = CORPORATE_ROLE;

    // Initialize corporate-specific profile
    CorporateProfile storage corporateProfile = profile.corporateProfile;
    corporateProfile.totalPurchases = 0;
    corporateProfile.totalImpactCredits = 0;
    corporateProfile.carbonOffset = 0;

    _grantRole(CORPORATE_ROLE, msg.sender);

    emit UserRegistered(msg.sender, _name, _location);
    emit UserRoleGranted(msg.sender, CORPORATE_ROLE);
    emit CorporateStatsUpdated(
      msg.sender,
      0, // totalPurchases
      0, // totalImpactCredits
      0 // carbonOffset
    );
  }

  // Add a function to get user's role
  function getUserRole(address _user) external view returns (bytes32) {
    return userProfiles[_user].role;
  }

  // ============ Collection Functions ============

  /**
   * @notice Creates a new waste collection
   * @param _wasteType Type of waste collected
   * @param _weight Weight of the collection in kg
   * @param _location Location of collection
   * @param _imageHash Hash of the verification image
   */
  function createCollection(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _weight,
    string memory _location,
    string memory _imageHash
  ) public onlyCollector whenNotPaused validAmount(_weight) validWasteType(_wasteType) returns (uint256 collectionId) {
    require(bytes(_location).length > 0, "Invalid location");
    require(bytes(_imageHash).length > 0, "Invalid image hash");

    // Cache storage variables
    uint256 rewardAmount = AfricycleLibrary.calculateReward(_weight, rewardRates[_wasteType]);
    _checkContractBalance(rewardAmount);
    
    collectionId = _collectionIdCounter++;
    
    // Update global stats
    totalCollected[_wasteType] += _weight;
    totalRewardsPaid += rewardAmount;

    // Update user profile
    UserProfile storage profile = userProfiles[msg.sender];
    CollectorProfile storage collectorProfile = profile.collectorProfile;
    
    // Update collection
    collections[collectionId] = WasteCollection({
        id: collectionId,
        collector: msg.sender,
        wasteType: _wasteType,
        weight: _weight,
        location: _location,
        imageHash: _imageHash,
        status: Status.VERIFIED,
        timestamp: block.timestamp,
        quality: AfricycleLibrary.QualityGrade.MEDIUM,
        rewardAmount: rewardAmount,
        isProcessed: false
    });

    // Update collector stats
    collectorProfile.totalCollected += _weight;
    collectorProfile.totalEarnings += rewardAmount;
    collectorProfile.collectedByType[_wasteType] += _weight;
    collectorProfile.collectionHistory[collectionId] = true;
    collectorProfile.collectionCount++;
    collectorProfile.lastUpdate = block.timestamp;

    // Transfer reward
    if (!cUSDToken.transfer(msg.sender, rewardAmount)) {
        revert TransferFailed();
    }

    // Emit events
    emit CollectionCreated(collectionId, msg.sender, _weight, _wasteType);
    emit RewardPaid(msg.sender, rewardAmount, _wasteType, collectionId);
    emit GlobalStatsUpdated(
        _wasteType,
        totalCollected[_wasteType],
        totalProcessed[_wasteType],
        totalMarketplaceVolume[_wasteType]
    );
    emit PlatformStatsUpdated(
        totalPlatformFees,
        totalRewardsPaid,
        block.timestamp
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
    require(_componentCounts.length == 4, 'Invalid component count'); // CPU, BATTERY, PCB, OTHER

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

  function updateCollection(
    uint256 _collectionId,
    uint256 _weight,
    string memory _location,
    string memory /* _qrCode */,
    string memory _imageHash
  ) external onlyCollector whenNotPaused {
    WasteCollection storage collection = collections[_collectionId];
    require(collection.collector == msg.sender, 'Not collection owner');
    require(
      collection.status == Status.PENDING,
      'Cannot update verified collection'
    );

    // Update validation call - QR code is optional
    AfricycleLibrary.validateCollection(_weight, _location, '', _imageHash);

    collection.weight = _weight;
    collection.location = _location;
    collection.imageHash = _imageHash;

    emit CollectionUpdated(_collectionId, _weight, _location);
  }

  // ============ Processing Functions ============

  function createProcessingBatch(
    uint256[] memory _collectionIds,
    string memory _processDescription
  ) external onlyRecycler whenNotPaused {
    require(_collectionIds.length > 0 && _collectionIds.length <= 100, "Invalid collection count");

    validateCollectionIds(_collectionIds);

    uint256 batchId = _processingIdCounter++;
    AfricycleLibrary.WasteStream wasteType = collections[_collectionIds[0]]
      .wasteType;
    uint256 totalInput = 0;

    // Modified to not require verification
    for (uint i = 0; i < _collectionIds.length; i++) {
      WasteCollection storage collection = collections[_collectionIds[i]];
      require(!collection.isProcessed, 'Already processed');
      require(collection.wasteType == wasteType, 'Mixed waste types');

      collection.isProcessed = true;
      totalInput += collection.weight;
    }

    ProcessingBatch storage batch = processingBatches[batchId];
    batch.id = batchId;
    batch.collectionIds = _collectionIds;
    batch.processor = msg.sender;
    batch.wasteType = wasteType;
    batch.inputAmount = totalInput;
    batch.timestamp = block.timestamp;
    batch.status = Status.IN_PROGRESS;
    batch.processDescription = _processDescription;

    emit ProcessingBatchCreated(
      batchId,
      msg.sender,
      wasteType,
      _collectionIds,
      totalInput
    );
  }

  /**
   * @notice Calculates carbon offset based on waste type, amount, and quality
   * @param _wasteType Type of waste being processed
   * @param _amount Amount of waste in kg
   * @param _quality Quality grade of the processed waste
   * @return carbonOffset The calculated carbon offset in kg of CO2
   */
  function calculateCarbonOffset(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _amount,
    AfricycleLibrary.QualityGrade _quality
  ) public view returns (uint256 carbonOffset) {
    require(_amount <= type(uint256).max / CARBON_OFFSET_BASE, "Amount too large");
    
    uint256 baseOffset = (_amount * CARBON_OFFSET_BASE);
    uint256 wasteMultiplier = carbonOffsetMultipliers[_wasteType];
    uint256 qualityMultiplier = qualityCarbonMultipliers[_quality];
    
    // Calculate in steps to prevent overflow
    uint256 intermediate = (baseOffset * wasteMultiplier) / 10000;
    require(intermediate <= type(uint256).max / qualityMultiplier, "Calculation overflow");
    carbonOffset = (intermediate * qualityMultiplier) / 10000;
    
    return carbonOffset;
  }

  function completeProcessing(
    uint256 _batchId,
    uint256 _outputAmount,
    AfricycleLibrary.QualityGrade _outputQuality
  ) external onlyRecycler whenNotPaused {
    ProcessingBatch storage batch = processingBatches[_batchId];
    require(batch.processor == msg.sender, "Not processor");
    require(batch.status == Status.IN_PROGRESS, "Not in progress");
    require(_outputAmount <= batch.inputAmount, "Invalid output amount");

    // Calculate carbon offset
    uint256 carbonOffset = calculateCarbonOffset(
      batch.wasteType,
      _outputAmount,
      _outputQuality
    );

    // Update batch state
    batch.outputAmount = _outputAmount;
    batch.outputQuality = _outputQuality;
    batch.carbonOffset = carbonOffset;
    batch.status = Status.COMPLETED;

    // Update processor stats
    UserProfile storage processor = userProfiles[msg.sender];
    processor.recyclerProfile.totalEarnings += _outputAmount;
    processor.recyclerProfile.reputationScore += AfricycleLibrary.calculateReputationIncrease(
      2, // base increase
      _outputQuality
    );

    // Update global stats
    totalProcessed[batch.wasteType] += _outputAmount;

    // Create impact credit
    uint256 creditId = _impactCreditIdCounter++;
    impactCredits[creditId] = ImpactCredit({
      id: creditId,
      owner: msg.sender,
      wasteType: batch.wasteType,
      amount: _outputAmount,
      carbonOffset: carbonOffset,
      timestamp: block.timestamp,
      verificationProof: ""
    });

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
    emit GlobalStatsUpdated(
      batch.wasteType,
      totalCollected[batch.wasteType],
      totalProcessed[batch.wasteType],
      totalMarketplaceVolume[batch.wasteType]
    );
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  // ============ Marketplace Functions ============

  function createListing(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _amount,
    uint256 _pricePerUnit,
    AfricycleLibrary.QualityGrade _quality,
    string memory _description,
    uint256 /* _carbonCredits */
  )
    external
    onlyRecycler
    whenNotPaused
    notSuspended
    notBlacklisted
    validAmount(_amount)
    validWasteType(_wasteType)
    validQualityGrade(_quality)
    returns (uint256 listingId)
  {
    if (bytes(_description).length == 0) revert InvalidListingDescription();
    if (userActiveListings[msg.sender] >= AfricycleLibrary.MAX_ACTIVE_LISTINGS)
      revert TooManyActiveListings();

    AfricycleLibrary.validateListingPrice(_pricePerUnit, _wasteType, _quality);

    listingId = _listingIdCounter++;

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
      carbonCredits: 0
    });

    userActiveListings[msg.sender]++;

    emit ListingCreated(
      listingId,
      msg.sender,
      _wasteType,
      _amount,
      _pricePerUnit,
      _quality,
      0
    );
  }

  function purchaseListing(
    uint256 _listingId,
    uint256 _amount
  ) external whenNotPaused nonReentrant {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.isActive, 'Listing not active');
    require(_amount <= listing.amount, 'Insufficient amount');
    require(_amount > 0, 'Invalid amount');

    uint256 totalPrice = _amount * listing.pricePerUnit;
    uint256 platformFee = AfricycleLibrary.calculateListingFee(
      totalPrice,
      listing.carbonCredits
    );
    uint256 sellerAmount = totalPrice - platformFee;

    // Update global marketplace stats
    totalMarketplaceVolume[listing.wasteType] += _amount;
    totalPlatformFees += platformFee;

    // Update state before external calls
    listing.amount -= _amount;
    if (listing.amount == 0) {
      listing.isActive = false;
      userActiveListings[listing.seller]--;
    }

    // External calls after state updates
    bool success1 = cUSDToken.transferFrom(
      msg.sender,
      address(this),
      platformFee
    );
    if (!success1) revert TransferFailed();

    bool success2 = cUSDToken.transferFrom(
      msg.sender,
      listing.seller,
      sellerAmount
    );
    if (!success2) revert TransferFailed();

    emit ListingPurchased(
      _listingId,
      msg.sender,
      _amount,
      totalPrice,
      platformFee
    );
    emit PlatformFeePaid(msg.sender, platformFee, _listingId);
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
    require(_multiplier <= 20000, 'Multiplier too high'); // Max 200%
    qualityMultipliers[_wasteType][_quality] = _multiplier;
    emit QualityMultiplierUpdated(_wasteType, _quality, _multiplier);
  }

  function withdrawPlatformFees() external onlyAdmin nonReentrant {
    uint256 balance = cUSDToken.balanceOf(address(this));
    require(balance > 0, 'No fees to withdraw');

    bool success = cUSDToken.transfer(msg.sender, balance);
    if (!success) revert TransferFailed();

    totalPlatformFees = 0; // Reset platform fees after withdrawal
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

  function getUserStats(
    address _user
  )
    external
    view
    returns (
      uint256[4] memory collected,
      uint256[4] memory processed,
      uint256 totalEarnings,
      uint256 reputationScore
    )
  {
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
  ) external onlyAdmin {
    require(_user != address(0), "Invalid user address");
    require(_newScore <= 1000, 'Score too high');
    UserProfile storage profile = userProfiles[_user];
    uint256 oldScore = profile.recyclerProfile.reputationScore;
    profile.recyclerProfile.reputationScore = _newScore;

    emit ReputationChange(_user, oldScore, _newScore, _reason);
    emit UserReputationUpdated(_user, _newScore);
  }

  // ============ Impact Credit Management ============

  function transferImpactCredit(
    uint256 _creditId,
    address _to
  ) external whenNotPaused {
    require(_to != address(0), "Invalid recipient address");
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

  function updateListing(
    uint256 _listingId,
    uint256 _newAmount,
    uint256 _newPrice
  ) public onlyRecycler whenNotPaused {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.seller == msg.sender, 'Not seller');
    require(listing.isActive, 'Not active');
    require(_newAmount > 0, 'Invalid amount');
    require(_newPrice > 0, 'Invalid price');

    listing.amount = _newAmount;
    listing.pricePerUnit = _newPrice;

    emit ListingUpdated(_listingId, _newAmount, _newPrice, listing.isActive);
  }

  function cancelListing(uint256 _listingId) external whenNotPaused {
    MarketplaceListing storage listing = listings[_listingId];
    require(listing.seller == msg.sender, 'Not seller');
    require(listing.isActive, 'Not active');

    listing.isActive = false;
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

  // ============ Withdrawal Functions ============

  /**
   * @notice Allows collectors to withdraw their earnings
   * @param _amount Amount to withdraw
   */
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

    // Check contract balance before proceeding
    _checkContractBalance(_amount);

    // Update state before transfer
    profile.collectorProfile.totalEarnings -= _amount;

    // Transfer after state update
    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RewardPaid(
      msg.sender,
      _amount,
      AfricycleLibrary.WasteStream.GENERAL,
      0
    );
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  /**
   * @notice Allows recyclers to withdraw their earnings
   * @param _amount Amount to withdraw
   */
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

    // Check contract balance before proceeding
    _checkContractBalance(_amount);

    // Update state before transfer
    profile.recyclerProfile.totalEarnings -= _amount;

    // Transfer after state update
    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RewardPaid(
      msg.sender,
      _amount,
      AfricycleLibrary.WasteStream.GENERAL,
      0
    );
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  /**
   * @notice Allows corporate partners to withdraw their earnings
   * @param _amount Amount to withdraw
   */
  function withdrawCorporateEarnings(
    uint256 _amount
  )
    external
    onlyCorporate
    whenNotPaused
    notSuspended
    notBlacklisted
    nonReentrant
  {
    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.corporateProfile.totalPurchases >= _amount,
      'Insufficient balance'
    );
    require(_amount > 0, 'Invalid amount');

    // Check contract balance before proceeding
    _checkContractBalance(_amount);

    // Update state before transfer
    profile.corporateProfile.totalPurchases -= _amount;

    // Transfer after state update
    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RewardPaid(
      msg.sender,
      _amount,
      AfricycleLibrary.WasteStream.GENERAL,
      0
    );
    emit PlatformStatsUpdated(
      totalPlatformFees,
      totalRewardsPaid,
      block.timestamp
    );
  }

  /**
   * @notice Allows collection points to withdraw their earnings
   * @param _amount Amount to withdraw
   */
  function withdrawCollectionPointEarnings(
    uint256 _amount
  )
    external
    onlyCollectionPoint
    whenNotPaused
    notSuspended
    notBlacklisted
    nonReentrant
  {
    UserProfile storage profile = userProfiles[msg.sender];
    require(
      profile.collectionPointProfile.totalInventory >= _amount,
      'Insufficient balance'
    );
    require(_amount > 0, 'Invalid amount');

    // Check contract balance before proceeding
    _checkContractBalance(_amount);

    // Update state before transfer
    profile.collectionPointProfile.totalInventory -= _amount;

    // Transfer after state update
    if (!cUSDToken.transfer(msg.sender, _amount)) {
      revert TransferFailed();
    }

    emit RewardPaid(
      msg.sender,
      _amount,
      AfricycleLibrary.WasteStream.GENERAL,
      0
    );
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
    uint256 count = 0;
    for (uint256 i = 0; i < _listingIdCounter; i++) {
      if (
        listings[i].wasteType == _wasteType &&
        (!_activeOnly || listings[i].isActive)
      ) {
        count++;
      }
    }

    uint256[] memory result = new uint256[](count);
    uint256 index = 0;
    for (uint256 i = 0; i < _listingIdCounter; i++) {
      if (
        listings[i].wasteType == _wasteType &&
        (!_activeOnly || listings[i].isActive)
      ) {
        result[index++] = i;
      }
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

  /**
   * @notice Suspends a user from the platform
   * @param _user Address of user to suspend
   * @param _reason Reason for suspension
   */
  function suspendUser(
    address _user,
    string memory _reason
  ) external onlyAdmin {
    require(!isSuspended[_user], 'Already suspended');
    isSuspended[_user] = true;
    emit UserSuspended(_user, _reason);
  }

  /**
   * @notice Unsuspends a user
   * @param _user Address of user to unsuspend
   */
  function unsuspendUser(address _user) external onlyAdmin {
    require(isSuspended[_user], 'Not suspended');
    isSuspended[_user] = false;
    emit UserUnsuspended(_user);
  }

  /**
   * @notice Blacklists a user
   * @param _user Address of user to blacklist
   * @param _reason Reason for blacklisting
   */
  function blacklistUser(
    address _user,
    string memory _reason
  ) external onlyAdmin {
    require(!isBlacklisted[_user], 'Already blacklisted');
    isBlacklisted[_user] = true;
    emit UserBlacklisted(_user, _reason);
  }

  /**
   * @notice Removes a user from blacklist
   * @param _user Address of user to remove
   */
  function removeFromBlacklist(address _user) external onlyAdmin {
    require(isBlacklisted[_user], 'Not blacklisted');
    isBlacklisted[_user] = false;
    emit UserRemovedFromBlacklist(_user);
  }

  function _validateWasteStream(
    AfricycleLibrary.WasteStream /* _stream */
  ) internal pure returns (bool) {
    return true;
  }

  function _getRewardAmount(
    AfricycleLibrary.WasteStream wasteType,
    uint256 weight,
    AfricycleLibrary.QualityGrade quality
  ) internal pure returns (uint256) {
    uint256 basePrice = wasteType == AfricycleLibrary.WasteStream.PLASTIC
      ? 100
      : 50;
    uint256 qualityMultiplier = uint256(quality) + 1;
    return (basePrice * weight * qualityMultiplier) / 10;
  }

  // ============ Role-Specific View Functions ============

  /**
   * @notice Gets collector-specific statistics
   */
  function getCollectorStats(
    address _collector
  )
    external
    view
    returns (
      uint256 totalCollected,
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

  /**
   * @notice Gets collection point-specific statistics
   */
  function getCollectionPointStats(
    address _collectionPoint
  )
    external
    view
    returns (
      uint256 totalInventory,
      uint256 scheduledPickups,
      uint256 activeCollectors,
      uint256[4] memory inventoryByType
    )
  {
    UserProfile storage profile = userProfiles[_collectionPoint];
    require(profile.role == COLLECTION_POINT_ROLE, 'Not a collection point');

    CollectionPointProfile storage collectionPointProfile = profile
      .collectionPointProfile;

    for (uint i = 0; i < 4; i++) {
      inventoryByType[i] = collectionPointProfile.inventoryByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      collectionPointProfile.totalInventory,
      collectionPointProfile.scheduledPickups,
      collectionPointProfile.activeCollectors,
      inventoryByType
    );
  }

  /**
   * @notice Gets recycler-specific statistics
   */
  function getRecyclerStats(
    address _recycler
  )
    external
    view
    returns (
      uint256 totalEarnings,
      uint256 activeListings,
      uint256 reputationScore,
      uint256[4] memory processedByType
    )
  {
    UserProfile storage profile = userProfiles[_recycler];
    require(profile.role == RECYCLER_ROLE, 'Not a recycler');

    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;

    for (uint i = 0; i < 4; i++) {
      processedByType[i] = recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      recyclerProfile.totalEarnings,
      recyclerProfile.activeListings,
      recyclerProfile.reputationScore,
      processedByType
    );
  }

  /**
   * @notice Gets corporate partner-specific statistics
   */
  function getCorporateStats(
    address _corporate
  )
    external
    view
    returns (
      uint256 totalPurchases,
      uint256 totalImpactCredits,
      uint256 carbonOffset,
      uint256[4] memory purchasedByType
    )
  {
    UserProfile storage profile = userProfiles[_corporate];
    require(profile.role == CORPORATE_ROLE, 'Not a corporate partner');

    CorporateProfile storage corporateProfile = profile.corporateProfile;

    for (uint i = 0; i < 4; i++) {
      purchasedByType[i] = corporateProfile.purchasedByType[
        AfricycleLibrary.WasteStream(i)
      ];
    }

    return (
      corporateProfile.totalPurchases,
      corporateProfile.totalImpactCredits,
      corporateProfile.carbonOffset,
      purchasedByType
    );
  }

  /// @notice Get user profile
  function getUserProfile(
    address user
  ) external view returns (UserProfileView memory viewProfile) {
    if (user == address(0)) revert ZeroAddress();

    UserProfile storage profile = userProfiles[user];

    // Basic profile info
    viewProfile.name = profile.name;
    viewProfile.location = profile.location;
    viewProfile.contactInfo = profile.contactInfo;
    viewProfile.status = profile.status;
    viewProfile.registrationDate = profile.registrationDate;
    viewProfile.verificationDate = profile.verificationDate;
    viewProfile.isVerified = profile.isVerified;
    viewProfile.role = profile.role;

    // Collector stats
    CollectorProfile storage collectorProfile = profile.collectorProfile;
    viewProfile.totalCollected = collectorProfile.totalCollected;
    viewProfile.totalEarnings = collectorProfile.totalEarnings;
    viewProfile.collectorReputationScore = collectorProfile.reputationScore;

    // Collection point stats
    CollectionPointProfile storage collectionPointProfile = profile
      .collectionPointProfile;
    viewProfile.totalInventory = collectionPointProfile.totalInventory;
    viewProfile.scheduledPickups = collectionPointProfile.scheduledPickups;
    viewProfile.activeCollectors = collectionPointProfile.activeCollectors;

    // Recycler stats
    RecyclerProfile storage recyclerProfile = profile.recyclerProfile;
    viewProfile.recyclerTotalEarnings = recyclerProfile.totalEarnings;
    viewProfile.activeListings = recyclerProfile.activeListings;
    viewProfile.recyclerReputationScore = recyclerProfile.reputationScore;

    // Corporate stats
    CorporateProfile storage corporateProfile = profile.corporateProfile;
    viewProfile.totalPurchases = corporateProfile.totalPurchases;
    viewProfile.totalImpactCredits = corporateProfile.totalImpactCredits;
    viewProfile.carbonOffset = corporateProfile.carbonOffset;

    // Fill arrays
    for (uint i = 0; i < 4; ) {
      viewProfile.collectedByType[i] = collectorProfile.collectedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      viewProfile.inventoryByType[i] = collectionPointProfile.inventoryByType[
        AfricycleLibrary.WasteStream(i)
      ];
      viewProfile.processedByType[i] = recyclerProfile.processedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      viewProfile.purchasedByType[i] = corporateProfile.purchasedByType[
        AfricycleLibrary.WasteStream(i)
      ];
      unchecked {
        ++i;
      }
    }
  }

  // Add this function to check contract balance
  function _checkContractBalance(uint256 _amount) internal view {
    require(
      cUSDToken.balanceOf(address(this)) >= _amount,
      'Insufficient contract balance'
    );
  }

  // Add getter for global stats
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
  ) external onlyVerifier whenNotPaused {
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

  

  function registerCollectorAtPoint(
    address _collector
  ) external onlyCollectionPoint whenNotPaused {
    UserProfile storage profile = userProfiles[msg.sender];
    require(profile.role == COLLECTION_POINT_ROLE, 'Not a collection point');
    require(hasRole(COLLECTOR_ROLE, _collector), 'Not a collector');

    CollectionPointProfile storage pointProfile = profile
      .collectionPointProfile;
    pointProfile.registeredCollectors[_collector] = true;
    pointProfile.activeCollectors++;
    pointProfile.collectorCount++;

    emit CollectorRegisteredAtPoint(msg.sender, _collector, block.timestamp);
    emit CollectionPointStatsUpdated(
      msg.sender,
      pointProfile.totalInventory,
      pointProfile.scheduledPickups,
      pointProfile.activeCollectors
    );
  }

  function removeCollectorFromPoint(
    address _collector
  ) external onlyCollectionPoint whenNotPaused {
    UserProfile storage profile = userProfiles[msg.sender];
    require(profile.role == COLLECTION_POINT_ROLE, "Not a collection point");
    
    CollectionPointProfile storage pointProfile = profile.collectionPointProfile;
    require(pointProfile.registeredCollectors[_collector], "Collector not registered");
    
    // Update state
    pointProfile.registeredCollectors[_collector] = false;
    pointProfile.activeCollectors--;
    pointProfile.collectorCount--;
    pointProfile.lastUpdate = block.timestamp;
    
    emit CollectorRemovedFromPoint(msg.sender, _collector, block.timestamp);
    emit CollectionPointStatsUpdated(
        msg.sender,
        pointProfile.totalInventory,
        pointProfile.scheduledPickups,
        pointProfile.activeCollectors
    );
  }

  // Add batch operations for gas efficiency
  function batchUpdateCollectionQuality(
    uint256[] calldata _collectionIds,
    AfricycleLibrary.QualityGrade[] calldata _newGrades
  ) external onlyVerifier whenNotPaused {
    require(_collectionIds.length == _newGrades.length, "Length mismatch");
    
    for (uint i = 0; i < _collectionIds.length;) {
      WasteCollection storage collection = collections[_collectionIds[i]];
      require(collection.id != 0, "Collection does not exist");
      
      AfricycleLibrary.QualityGrade oldGrade = collection.quality;
      collection.quality = _newGrades[i];
      
      emit QualityAssessmentUpdated(
        _collectionIds[i],
        oldGrade,
        _newGrades[i],
        msg.sender
      );
      
      unchecked { ++i; }
    }
  }

  // Optimize reputation updates
  function batchUpdateReputation(
    address[] calldata _users,
    uint256[] calldata _newScores,
    string calldata _reason
  ) external onlyAdmin {
    require(_users.length == _newScores.length, "Length mismatch");
    
    for (uint i = 0; i < _users.length;) {
      address user = _users[i];
      uint256 newScore = _newScores[i];
      require(newScore <= 1000, "Score too high");
      
      UserProfile storage profile = userProfiles[user];
      uint256 oldScore = profile.recyclerProfile.reputationScore;
      profile.recyclerProfile.reputationScore = newScore;
      
      emit ReputationChange(user, oldScore, newScore, _reason);
      emit UserReputationUpdated(user, newScore);
      
      unchecked { ++i; }
    }
  }

  // Add function to update carbon offset multipliers
  function updateCarbonOffsetMultiplier(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _multiplier
  ) external onlyAdmin {
    require(_multiplier <= 20000, "Multiplier too high"); // Max 200%
    carbonOffsetMultipliers[_wasteType] = _multiplier;
    emit CarbonOffsetMultiplierUpdated(_wasteType, _multiplier);
  }

  // Add function to update quality carbon multipliers
  function updateQualityCarbonMultiplier(
    AfricycleLibrary.QualityGrade _quality,
    uint256 _multiplier
  ) external onlyAdmin {
    require(_multiplier <= 20000, "Multiplier too high"); // Max 200%
    qualityCarbonMultipliers[_quality] = _multiplier;
    emit QualityCarbonMultiplierUpdated(_quality, _multiplier);
  }

  // Add events for multiplier updates
  event CarbonOffsetMultiplierUpdated(
    AfricycleLibrary.WasteStream indexed wasteType,
    uint256 newMultiplier
  );
  event QualityCarbonMultiplierUpdated(
    AfricycleLibrary.QualityGrade indexed quality,
    uint256 newMultiplier
  );

  // Add new events
  event CollectionPointInventoryUpdated(
    address indexed collectionPoint,
    AfricycleLibrary.WasteStream indexed wasteType,
    uint256 oldAmount,
    uint256 newAmount
  );

  event UserProfileStatusChanged(
    address indexed user,
    Status oldStatus,
    Status newStatus,
    address indexed updatedBy
  );

  // Update functions to emit new events
  function updateCollectionPointInventory(
    AfricycleLibrary.WasteStream _wasteType,
    uint256 _newAmount
  ) external onlyCollectionPoint whenNotPaused {
    CollectionPointProfile storage profile = userProfiles[msg.sender].collectionPointProfile;
    uint256 oldAmount = profile.inventoryByType[_wasteType];
    profile.inventoryByType[_wasteType] = _newAmount;
    profile.totalInventory = profile.totalInventory - oldAmount + _newAmount;
    
    emit CollectionPointInventoryUpdated(
      msg.sender,
      _wasteType,
      oldAmount,
      _newAmount
    );
  }

  function updateUserStatus(
    address _user,
    Status _newStatus
  ) external onlyAdmin {
    require(_user != address(0), "Invalid user address");
    UserProfile storage profile = userProfiles[_user];
    Status oldStatus = profile.status;
    profile.status = _newStatus;
    
    emit UserProfileStatusChanged(
      _user,
      oldStatus,
      _newStatus,
      msg.sender
    );
  }

  // Add function to validate collection IDs
  function validateCollectionIds(uint256[] memory _collectionIds) internal view {
    require(_collectionIds.length > 0 && _collectionIds.length <= 100, "Invalid collection count");
    for (uint i = 0; i < _collectionIds.length; i++) {
      require(collections[_collectionIds[i]].id != 0, "Invalid collection ID");
      require(!collections[_collectionIds[i]].isProcessed, "Collection already processed");
    }
  }
}