// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AfricycleLibrary
 * @dev Internal library for Africycle contract functions
 */
library AfricycleLibrary {
    // Constants
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 150; // 1.5%
    uint256 public constant SCALE = 10000;
    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public constant MIN_PROFILE_UPDATE_INTERVAL = 1 days;
    uint256 public constant MAX_ACTIVE_LISTINGS = 20;
    uint256 public constant MIN_REPUTATION_FOR_PROCESSING = 200;
    uint256 public constant MAX_COLLECTION_WEIGHT = 1000;
    uint256 public constant MAX_REPUTATION_SCORE = 1000;

    // Enums
    enum WasteStream {
        PLASTIC,
        EWASTE,
        METAL,
        GENERAL
    }

    enum QualityGrade {
        LOW,
        MEDIUM,
        HIGH,
        PREMIUM
    }

    // Structs
    struct CollectionData {
        uint256 id;
        address collector;
        uint256 weight;
        string location;
        string qrCode;
        string imageHash;
        uint256 timestamp;
        uint256 rewardAmount;
    }

    struct ProcessingData {
        uint256 id;
        address processor;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 timestamp;
        string processDescription;
        uint256 carbonOffset;
    }

    struct ListingData {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerUnit;
        uint256 timestamp;
        string description;
        uint256 carbonCredits;
    }

    // Internal functions
    function calculateReward(uint256 weight, uint256 rate) internal pure returns (uint256) {
        return (weight * rate) / 1e18;
    }

    function calculatePlatformFee(uint256 amount) internal pure returns (uint256) {
        return (amount * PLATFORM_FEE_PERCENTAGE) / SCALE;
    }

    function validateCollection(
        uint256 weight,
        string memory location,
        string memory qrCode,
        string memory imageHash
    ) internal pure {
        require(weight > 0, 'Weight must be positive');
        require(weight <= MAX_COLLECTION_WEIGHT, 'Weight exceeds maximum');
        require(bytes(location).length > 0, 'Location required');
        require(bytes(qrCode).length > 0, 'QR code required');
        require(bytes(imageHash).length > 0, 'Image hash required');
    }

    function validateBatchSize(uint256 size) internal pure {
        require(size <= MAX_BATCH_SIZE, 'Batch too large');
    }

    function validateListing(
        uint256 amount,
        uint256 price,
        uint256 activeListings
    ) internal pure {
        require(amount > 0, 'Invalid amount');
        require(price > 0, 'Invalid price');
        require(activeListings < MAX_ACTIVE_LISTINGS, 'Too many active listings');
    }

    function calculateQualityMultiplier(
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure returns (uint256) {
        if (wasteType == WasteStream.PLASTIC) {
            if (quality == QualityGrade.PREMIUM) return 15000;
            if (quality == QualityGrade.HIGH) return 12000;
            if (quality == QualityGrade.MEDIUM) return 10000;
            return 8000;
        } else if (wasteType == WasteStream.EWASTE) {
            if (quality == QualityGrade.PREMIUM) return 18000;
            if (quality == QualityGrade.HIGH) return 15000;
            if (quality == QualityGrade.MEDIUM) return 12000;
            return 9000;
        } else if (wasteType == WasteStream.METAL) {
            if (quality == QualityGrade.PREMIUM) return 16000;
            if (quality == QualityGrade.HIGH) return 13000;
            if (quality == QualityGrade.MEDIUM) return 11000;
            return 8500;
        } else {
            if (quality == QualityGrade.PREMIUM) return 14000;
            if (quality == QualityGrade.HIGH) return 11000;
            if (quality == QualityGrade.MEDIUM) return 9000;
            return 7500;
        }
    }

    function calculateReputationIncrease(
        uint256 baseIncrease,
        QualityGrade quality
    ) internal pure returns (uint256) {
        if (quality == QualityGrade.PREMIUM) return baseIncrease * 2;
        if (quality == QualityGrade.HIGH) return baseIncrease * 3/2;
        if (quality == QualityGrade.MEDIUM) return baseIncrease;
        return baseIncrease / 2;
    }

    function calculateCarbonOffset(
        WasteStream wasteType,
        uint256 amount,
        QualityGrade quality
    ) internal pure returns (uint256) {
        uint256 baseOffset;
        if (wasteType == WasteStream.PLASTIC) baseOffset = 2;
        else if (wasteType == WasteStream.EWASTE) baseOffset = 5;
        else if (wasteType == WasteStream.METAL) baseOffset = 3;
        else baseOffset = 1;

        uint256 qualityMultiplier;
        if (quality == QualityGrade.PREMIUM) qualityMultiplier = 15000;
        else if (quality == QualityGrade.HIGH) qualityMultiplier = 12000;
        else if (quality == QualityGrade.MEDIUM) qualityMultiplier = 10000;
        else qualityMultiplier = 8000;

        return (amount * baseOffset * qualityMultiplier) / 10000;
    }

    function validateListingPrice(
        uint256 price,
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure {
        require(price > 0, "Price must be positive");
        
        uint256 minPrice;
        if (wasteType == WasteStream.PLASTIC) minPrice = 0.1 ether;
        else if (wasteType == WasteStream.EWASTE) minPrice = 0.5 ether;
        else if (wasteType == WasteStream.METAL) minPrice = 0.3 ether;
        else minPrice = 0.05 ether;

        if (quality == QualityGrade.PREMIUM) minPrice = minPrice * 2;
        else if (quality == QualityGrade.HIGH) minPrice = minPrice * 3/2;
        
        require(price >= minPrice, "Price too low");
    }

    function calculateListingFee(
        uint256 totalPrice,
        uint256 carbonCredits
    ) internal pure returns (uint256) {
        uint256 baseFee = (totalPrice * PLATFORM_FEE_PERCENTAGE) / SCALE;
        if (carbonCredits > 0) {
            baseFee = (baseFee * 90) / 100;
        }
        return baseFee;
    }

    // Batch Processing Functions
    function validateBatchCollections(
        uint256[] memory collectionIds,
        WasteStream expectedType
    ) internal pure {
        require(collectionIds.length > 0, "No collections");
        require(collectionIds.length <= MAX_BATCH_SIZE, "Batch too large");
    }

    function calculateBatchOutput(
        uint256 totalInput,
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure returns (uint256) {
        uint256 efficiency;
        if (wasteType == WasteStream.PLASTIC) efficiency = 90;
        else if (wasteType == WasteStream.EWASTE) efficiency = 85;
        else if (wasteType == WasteStream.METAL) efficiency = 95;
        else efficiency = 80; // GENERAL

        uint256 qualityMultiplier;
        if (quality == QualityGrade.PREMIUM) qualityMultiplier = 11000;
        else if (quality == QualityGrade.HIGH) qualityMultiplier = 10500;
        else if (quality == QualityGrade.MEDIUM) qualityMultiplier = 10000;
        else qualityMultiplier = 9500;

        return (totalInput * efficiency * qualityMultiplier) / (100 * 10000);
    }

    // Verification Functions
    function validateVerificationThreshold(
        uint256 amount,
        WasteStream wasteType,
        uint256 threshold
    ) internal pure {
        require(amount >= threshold, "Amount below threshold");
        if (wasteType == WasteStream.EWASTE) {
            require(amount >= threshold * 2, "E-waste requires higher threshold");
        }
    }

    function calculateVerificationScore(
        QualityGrade quality,
        uint256 amount,
        string memory proof
    ) internal pure returns (uint256) {
        uint256 baseScore = 100;
        
        if (quality == QualityGrade.PREMIUM) baseScore *= 2;
        else if (quality == QualityGrade.HIGH) baseScore = (baseScore * 3) / 2;
        
        uint256 amountMultiplier = amount / 100;
        if (amountMultiplier > 2) amountMultiplier = 2;
        
        uint256 proofBonus = bytes(proof).length > 0 ? 50 : 0;
        
        return baseScore + (baseScore * amountMultiplier) + proofBonus;
    }
} 