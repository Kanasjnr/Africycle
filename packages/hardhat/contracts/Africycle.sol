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
    error InvalidWasteStream();

    // ============ Role Definitions ============
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    bytes32 public constant COLLECTOR_ROLE = keccak256('COLLECTOR_ROLE');
    bytes32 public constant COLLECTION_POINT_ROLE = keccak256('COLLECTION_POINT_ROLE');
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
    struct UserProfile {
        string name;
        string location;
        string contactInfo;
        Status status;
        uint256 registrationDate;
        uint256 verificationDate;
        uint256 reputationScore;
        bool isVerified;
        mapping(AfricycleLibrary.WasteStream => uint256) totalCollected;
        mapping(AfricycleLibrary.WasteStream => uint256) totalProcessed;
        uint256 totalEarnings;
    }

    struct WasteCollection {
        uint256 id;
        address collector;
        AfricycleLibrary.WasteStream wasteType;
        uint256 weight;
        string location;
        string qrCode;
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
    mapping(address => UserProfile) public userProfiles;

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

    /**
     * @notice Collection verification thresholds
     */
    mapping(AfricycleLibrary.WasteStream => uint256) public verificationThresholds;

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
    event CollectionVerified(
        uint256 indexed id,
        address indexed verifier,
        AfricycleLibrary.QualityGrade quality,
        uint256 rewardAmount
    );
    event CollectionRejected(
        uint256 indexed id,
        address indexed verifier,
        string reason
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
    event ImpactCreditVerified(
        uint256 indexed id,
        address indexed verifier,
        string verificationProof
    );

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

    event RewardRateUpdated(AfricycleLibrary.WasteStream wasteType, uint256 newRate);
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
    event VerificationThresholdUpdated(
        AfricycleLibrary.WasteStream wasteType,
        uint256 newThreshold
    );
    event BatchOperationCompleted(
        bytes32 indexed operation,
        uint256 itemsProcessed
    );

    // ============ Constructor ============

    /**
     * @notice Initializes the AfriCycle contract
     * @param _cUSDToken Address of the cUSD token contract
     */
    constructor(address _cUSDToken) {
        cUSDToken = IERC20(_cUSDToken);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);

        // Initialize default reward rates (in cUSD, scaled by 1e18)
        rewardRates[AfricycleLibrary.WasteStream.PLASTIC] = 0.5 ether; // 0.5 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.EWASTE] = 2 ether; // 2 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.METAL] = 1 ether; // 1 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.GENERAL] = 0.2 ether; // 0.2 cUSD per kg

        // Initialize quality multipliers (percentage, base 10000)
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.LOW] = 8000; // 80%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.MEDIUM] = 10000; // 100%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.HIGH] = 12000; // 120%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.PREMIUM] = 15000; // 150%
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
        require(hasRole(CORPORATE_ROLE, msg.sender), 'Caller is not a corporate partner');
        _;
    }

    /// @notice Restricts function access to collection point role
    modifier onlyCollectionPoint() {
        require(hasRole(COLLECTION_POINT_ROLE, msg.sender), 'Caller is not a collection point');
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

    // ============ User Management Functions ============

    /**
     * @notice Registers a new user in the system
     * @param _name User's name
     * @param _location User's location
     * @param _contactInfo User's contact information
     * @dev Initializes user profile with default values
     */
    function registerUser(
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
        profile.status = Status.PENDING;
        profile.registrationDate = block.timestamp;
        profile.reputationScore = 100; // Initial reputation score

        emit UserRegistered(msg.sender, _name, _location);
    }

    function verifyUser(address _user) external onlyVerifier whenNotPaused {
        UserProfile storage profile = userProfiles[_user];
        require(profile.registrationDate > 0, 'User not registered');
        require(!profile.isVerified, 'Already verified');

        profile.isVerified = true;
        profile.status = Status.VERIFIED;
        profile.verificationDate = block.timestamp;

        emit UserVerified(_user);
    }

    // ============ Collection Functions ============

    function createCollection(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _weight,
        string memory _location,
        string memory _qrCode,
        string memory _imageHash
    ) public onlyCollector whenNotPaused returns (uint256) {
        AfricycleLibrary.validateCollection(_weight, _location, _qrCode, _imageHash);

        uint256 collectionId = _collectionIdCounter++;
        uint256 rewardAmount = AfricycleLibrary.calculateReward(_weight, rewardRates[_wasteType]);

        collections[collectionId] = WasteCollection({
            id: collectionId,
            collector: msg.sender,
            wasteType: _wasteType,
            weight: _weight,
            location: _location,
            qrCode: _qrCode,
            imageHash: _imageHash,
            status: Status.PENDING,
            timestamp: block.timestamp,
            quality: AfricycleLibrary.QualityGrade.LOW,
            rewardAmount: rewardAmount,
            isProcessed: false
        });

        UserProfile storage profile = userProfiles[msg.sender];
        profile.totalCollected[_wasteType] += _weight;

        emit CollectionCreated(collectionId, msg.sender, _weight, _wasteType);
        return collectionId;
    }

    function batchCreateCollections(
        AfricycleLibrary.WasteStream[] memory _wasteTypes,
        uint256[] memory _weights,
        string[] memory _locations,
        string[] memory _qrCodes,
        string[] memory _imageHashes
    ) external onlyCollector whenNotPaused returns (uint256[] memory) {
        require(
            _wasteTypes.length == _weights.length &&
            _weights.length == _locations.length &&
            _locations.length == _qrCodes.length &&
            _qrCodes.length == _imageHashes.length,
            'Length mismatch'
        );
        require(_wasteTypes.length <= AfricycleLibrary.MAX_BATCH_SIZE, 'Batch too large');

        uint256[] memory collectionIds = new uint256[](_wasteTypes.length);

        for (uint256 i = 0; i < _wasteTypes.length; i++) {
            collectionIds[i] = createCollection(
                _wasteTypes[i],
                _weights[i],
                _locations[i],
                _qrCodes[i],
                _imageHashes[i]
            );
        }

        emit BatchOperationCompleted(keccak256('CREATE_COLLECTIONS'), _wasteTypes.length);
        return collectionIds;
    }

    function addEWasteDetails(
        uint256 _collectionId,
        uint256[] memory _componentCounts,
        string memory _serialNumber,
        string memory _manufacturer,
        uint256 _estimatedValue
    ) external onlyCollector whenNotPaused {
        require(
            collections[_collectionId].wasteType == AfricycleLibrary.WasteStream.EWASTE,
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

    function verifyCollection(
        uint256 _collectionId,
        AfricycleLibrary.QualityGrade _quality
    ) external onlyVerifier whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.status == Status.PENDING, 'Not pending');

        collection.status = Status.VERIFIED;
        collection.quality = _quality;

        // Use library calculation for quality multiplier
        uint256 qualityMultiplier = AfricycleLibrary.calculateQualityMultiplier(
            collection.wasteType,
            _quality
        );
        collection.rewardAmount = (collection.rewardAmount * qualityMultiplier) / AfricycleLibrary.SCALE;

        // Pay reward
        require(
            cUSDToken.transfer(collection.collector, collection.rewardAmount),
            'Reward transfer failed'
        );

        // Update collector stats
        UserProfile storage collector = userProfiles[collection.collector];
        collector.totalCollected[collection.wasteType] += collection.weight;
        collector.totalEarnings += collection.rewardAmount;
        collector.reputationScore += AfricycleLibrary.calculateReputationIncrease(
            1, // base increase
            _quality
        );

        emit CollectionVerified(_collectionId, msg.sender, _quality, collection.rewardAmount);
        emit RewardPaid(collection.collector, collection.rewardAmount, collection.wasteType, _collectionId);
    }

    function updateCollection(
        uint256 _collectionId,
        uint256 _newWeight,
        string memory _newLocation
    ) external onlyCollector whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.collector == msg.sender, 'Not collector');
        require(collection.status == Status.PENDING, 'Not pending');
        require(_newWeight > 0, 'Invalid weight');
        require(bytes(_newLocation).length > 0, 'Location required');

        collection.weight = _newWeight;
        collection.location = _newLocation;
        collection.rewardAmount =
            (collection.weight * rewardRates[collection.wasteType]) /
            1e18;

        emit CollectionUpdated(_collectionId, _newWeight, _newLocation);
    }

    function rejectCollection(
        uint256 _collectionId,
        string memory _reason
    ) external onlyVerifier whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.id == _collectionId, 'Collection does not exist');
        require(collection.status == Status.PENDING, 'Not pending');

        collection.status = Status.REJECTED;
        emit CollectionRejected(_collectionId, msg.sender, _reason);
    }

    // ============ Processing Functions ============

    function createProcessingBatch(
        uint256[] memory _collectionIds,
        string memory _processDescription
    ) external onlyRecycler whenNotPaused {
        require(_collectionIds.length > 0, 'No collections');

        uint256 batchId = _processingIdCounter++;
        AfricycleLibrary.WasteStream wasteType = collections[_collectionIds[0]].wasteType;
        uint256 totalInput = 0;

        // Verify all collections are of same type and verified
        for (uint i = 0; i < _collectionIds.length; i++) {
            WasteCollection storage collection = collections[_collectionIds[i]];
            require(collection.status == Status.VERIFIED, 'Collection not verified');
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

    function completeProcessing(
        uint256 _batchId,
        uint256 _outputAmount,
        AfricycleLibrary.QualityGrade _outputQuality,
        uint256 _carbonOffset
    ) external onlyRecycler whenNotPaused {
        ProcessingBatch storage batch = processingBatches[_batchId];
        require(batch.processor == msg.sender, 'Not processor');
        require(batch.status == Status.IN_PROGRESS, 'Not in progress');
        require(_outputAmount <= batch.inputAmount, 'Invalid output amount');

        batch.outputAmount = _outputAmount;
        batch.outputQuality = _outputQuality;
        batch.carbonOffset = AfricycleLibrary.calculateCarbonOffset(
            batch.wasteType,
            _outputAmount,
            _outputQuality
        );
        batch.status = Status.COMPLETED;

        // Update processor stats
        UserProfile storage processor = userProfiles[msg.sender];
        processor.totalProcessed[batch.wasteType] += _outputAmount;
        processor.reputationScore += AfricycleLibrary.calculateReputationIncrease(
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
            carbonOffset: batch.carbonOffset,
            timestamp: block.timestamp,
            verificationProof: ''
        });

        emit ProcessingCompleted(_batchId, _outputAmount, batch.carbonOffset, _outputQuality);
        emit ImpactCreditMinted(
            creditId,
            msg.sender,
            batch.wasteType,
            _outputAmount,
            batch.carbonOffset
        );
    }

    // ============ Marketplace Functions ============

    function createListing(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _amount,
        uint256 _pricePerUnit,
        AfricycleLibrary.QualityGrade _quality,
        string memory _description,
        uint256 _carbonCredits
    ) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
        require(_amount > 0, 'Amount required');
        AfricycleLibrary.validateListingPrice(_pricePerUnit, _wasteType, _quality);
        require(
            userActiveListings[msg.sender] < AfricycleLibrary.MAX_ACTIVE_LISTINGS,
            'Too many active listings'
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
            carbonCredits: _carbonCredits
        });

        userActiveListings[msg.sender]++;

        emit ListingCreated(
            listingId,
            msg.sender,
            _wasteType,
            _amount,
            _pricePerUnit,
            _quality,
            _carbonCredits
        );
    }

    function purchaseListing(
        uint256 _listingId,
        uint256 _amount
    ) external whenNotPaused nonReentrant {
        MarketplaceListing storage listing = listings[_listingId];
        require(listing.isActive, 'Listing not active');
        require(_amount <= listing.amount, 'Insufficient amount');

        uint256 totalPrice = _amount * listing.pricePerUnit;
        uint256 platformFee = AfricycleLibrary.calculateListingFee(totalPrice, listing.carbonCredits);
        uint256 sellerAmount = totalPrice - platformFee;

        // Transfer payment
        require(
            cUSDToken.transferFrom(msg.sender, address(this), platformFee),
            'Platform fee transfer failed'
        );
        require(
            cUSDToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            'Payment transfer failed'
        );

        // Update listing
        listing.amount -= _amount;
        if (listing.amount == 0) {
            listing.isActive = false;
            userActiveListings[listing.seller]--;
        }

        emit ListingPurchased(_listingId, msg.sender, _amount, totalPrice, platformFee);
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

    function withdrawPlatformFees() external onlyAdmin {
        uint256 balance = cUSDToken.balanceOf(address(this));
        require(balance > 0, 'No fees to withdraw');
        require(cUSDToken.transfer(msg.sender, balance), 'Fee withdrawal failed');
        emit PlatformFeeWithdrawn(msg.sender, balance);
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
            collected[i] = profile.totalCollected[AfricycleLibrary.WasteStream(i)];
            processed[i] = profile.totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        return (
            collected,
            processed,
            profile.totalEarnings,
            profile.reputationScore
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
        uint256 _newScore
    ) external onlyAdmin {
        require(_newScore <= 1000, 'Score too high'); // Max 1000 points
        userProfiles[_user].reputationScore = _newScore;
        emit UserReputationUpdated(_user, _newScore);
    }

    // ============ Impact Credit Management ============

    function transferImpactCredit(
        uint256 _creditId,
        address _to
    ) external whenNotPaused {
        require(_to != address(0), 'Invalid address');
        ImpactCredit storage credit = impactCredits[_creditId];
        require(credit.owner == msg.sender, 'Not owner');

        credit.owner = _to;
        emit ImpactCreditTransferred(_creditId, msg.sender, _to);
    }

    function verifyImpactCredit(
        uint256 _creditId,
        string memory _verificationProof
    ) external onlyVerifier whenNotPaused {
        require(bytes(_verificationProof).length > 0, 'Proof required');
        ImpactCredit storage credit = impactCredits[_creditId];
        credit.verificationProof = _verificationProof;
        emit ImpactCreditVerified(_creditId, msg.sender, _verificationProof);
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

    function rejectProcessingBatch(
        uint256 _batchId,
        string memory _reason
    ) external onlyVerifier whenNotPaused {
        ProcessingBatch storage batch = processingBatches[_batchId];
        require(batch.status == Status.IN_PROGRESS, 'Not in progress');

        batch.status = Status.REJECTED;
        emit ProcessingRejected(_batchId, _reason);
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
        userActiveListings[msg.sender]--;

        emit ListingCancelled(_listingId, msg.sender);
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
    function withdrawCollectorEarnings(uint256 _amount) external onlyCollector whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows recyclers to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawRecyclerEarnings(uint256 _amount) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows corporate partners to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawCorporateEarnings(uint256 _amount) external onlyCorporate whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows collection points to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawCollectionPointEarnings(uint256 _amount) external onlyCollectionPoint whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
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
    )
        external
        view
        returns (UserStats memory)
    {
        UserProfile storage profile = userProfiles[_user];
        UserStats memory stats;
        
        for (uint i = 0; i < 4; i++) {
            stats.collected[i] = profile.totalCollected[AfricycleLibrary.WasteStream(i)];
            stats.processed[i] = profile.totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        stats.totalEarnings = profile.totalEarnings;
        stats.reputationScore = profile.reputationScore;
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

    /**
     * @notice Sets verification threshold for a waste type
     * @param _wasteType Type of waste
     * @param _threshold New threshold value
     */
    function setVerificationThreshold(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _threshold
    ) external onlyAdmin {
        verificationThresholds[_wasteType] = _threshold;
        emit VerificationThresholdUpdated(_wasteType, _threshold);
    }

    function _validateWasteStream(AfricycleLibrary.WasteStream _stream) internal pure returns (bool) {
        return true;
    }

    function _calculateCarbonOffset(uint256 _amount) internal pure returns (uint256) {
        return 0;
    }

    function _getRewardAmount(
        AfricycleLibrary.WasteStream wasteType,
        uint256 weight,
        AfricycleLibrary.QualityGrade quality
    ) internal view returns (uint256) {
        uint256 basePrice = wasteType == AfricycleLibrary.WasteStream.PLASTIC ? 100 : 50;
        uint256 qualityMultiplier = uint256(quality) + 1;
        return (basePrice * weight * qualityMultiplier) / 10;
    }
}
