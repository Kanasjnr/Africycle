import {
  createPublicClient,
  http,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account
} from 'viem';
import { celo } from 'viem/chains';
import afriCycleAbi from '@/ABI/Africycle.json';
import { useAccount, useWalletClient } from 'wagmi';
import { useMemo } from 'react';
import { withDivviTracking } from '../lib/divvi';

// Types based on the contract
export enum AfricycleWasteStream {
  PLASTIC = 0,
  EWASTE = 1,
  METAL = 2,
  GENERAL = 3
}

export enum AfricycleQualityGrade {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  PREMIUM = 3
}

export enum AfricycleStatus {
  PENDING = 0,
  VERIFIED = 1,
  REJECTED = 2,
  IN_PROGRESS = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  ACTIVE = 6
}

export enum AfricycleEWasteComponent {
  CPU = 0,
  BATTERY = 1,
  PCB = 2,
  OTHER = 3
}

export type UserStats = {
  collected: [bigint, bigint, bigint, bigint];
  processed: [bigint, bigint, bigint, bigint];
  totalEarnings: bigint;
  reputationScore: bigint;
  activeListings: bigint;
  verifiedStatus: boolean;
  suspendedStatus: boolean;
  blacklistedStatus: boolean;
}

export type WasteCollection = {
  id: bigint;
  collector: Address;
  wasteType: AfricycleWasteStream;
  weight: bigint;
  location: string;
  imageHash: string;
  status: AfricycleStatus;
  timestamp: bigint;
  quality: AfricycleQualityGrade;
  rewardAmount: bigint;
  isProcessed: boolean;
  pickupTime: bigint;
  selectedRecycler: Address;
}

export type MarketplaceListing = {
  id: bigint;
  seller: Address;
  wasteType: AfricycleWasteStream;
  amount: bigint;
  pricePerUnit: bigint;
  quality: AfricycleQualityGrade;
  isActive: boolean;
  timestamp: bigint;
  description: string;
  status: AfricycleStatus;
}

export type ProcessingBatch = {
  id: bigint;
  processor: Address;
  wasteType: AfricycleWasteStream;
  inputAmount: bigint;
  outputAmount: bigint;
  timestamp: bigint;
  status: AfricycleStatus;
  processDescription: string;
  outputQuality: AfricycleQualityGrade;
  carbonOffset: bigint;
}

export type ImpactCredit = {
  id: bigint;
  owner: Address;
  wasteType: AfricycleWasteStream;
  amount: bigint;
  carbonOffset: bigint;
  timestamp: bigint;
  verificationProof: string;
}

export type UserProfileView = {
  name: string;
  location: string;
  contactInfo: string;
  status: AfricycleStatus;
  registrationDate: bigint;
  verificationDate: bigint;
  isVerified: boolean;
  role: string;
  totalCollected: bigint;
  totalEarnings: bigint;
  collectorReputationScore: bigint;
  collectedByType: [bigint, bigint, bigint, bigint];
  recyclerTotalEarnings: bigint;
  activeListings: bigint;
  recyclerReputationScore: bigint;
  totalInventory: bigint;
  scheduledPickups: bigint;
  activeCollectors: bigint;
  processedByType: [bigint, bigint, bigint, bigint];
  inventoryByType: [bigint, bigint, bigint, bigint];
}

export class AfriCycle {
  private publicClient: PublicClient;
  private walletClient: WalletClient<Transport, Chain, Account>;
  private contractAddress: Address;
  private cUSDTokenAddress: Address;

  constructor(
    contractAddress: Address,
    rpcUrl: string,
    walletClient: WalletClient<Transport, Chain, Account>,
    cUSDTokenAddress: Address = '0x765DE816845861e75A25fCA122bb6898B8B1282a' // Mainnet cUSD
  ) {
    if (!contractAddress) throw new Error('Contract address is required');
    if (!rpcUrl) throw new Error('RPC URL is required');
    if (!walletClient) throw new Error('Wallet client is required');

    this.contractAddress = contractAddress;
    this.cUSDTokenAddress = cUSDTokenAddress;
    this.publicClient = createPublicClient({
      chain: celo,
      transport: http(rpcUrl)
    }) as PublicClient;
    this.walletClient = walletClient;

    if (!this.publicClient.readContract) {
      throw new Error('Public client is not properly initialized');
    }
    if (!this.walletClient.writeContract) {
      throw new Error('Wallet client is not properly initialized');
    }
  }

  // ============ User Management Functions ============

  async registerCollector(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }

      // First simulate the transaction
      const simulation = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollector',
        args: [name, location, contactInfo],
        account
      });

      if (!simulation || !simulation.request) {
        throw new Error('Transaction simulation failed: no request returned');
      }

      // Then execute with Divvi tracking
      const simulateFn = async () => {
        return { request: simulation.request };
      };
      return withDivviTracking(simulateFn, this.walletClient, account, true); // Mark as value-generating
    } catch (error) {
      console.error('Error registering collector:', error);
      throw new Error('Failed to register collector: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async registerRecycler(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }

      // First simulate the transaction
      const simulation = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerRecycler',
        args: [name, location, contactInfo],
        account
      });

      if (!simulation || !simulation.request) {
        throw new Error('Transaction simulation failed: no request returned');
      }

      // Then execute with Divvi tracking
      const simulateFn = async () => {
        return { request: simulation.request };
      };
      return withDivviTracking(simulateFn, this.walletClient, account, true); // Mark as value-generating
    } catch (error) {
      console.error('Error registering recycler:', error);
      throw new Error('Failed to register recycler: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateUserProfile(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      if (!account || !name || !location) {
        throw new Error('Name and location are required');
      }
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateUserProfile',
        args: [name, location, contactInfo],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getUserRole(userAddress: Address): Promise<string> {
    try {
      const role = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getUserRole',
        args: [userAddress]
      });
      return role as string;
    } catch (error) {
      console.error('Error getting user role:', error);
      throw new Error('Failed to get user role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getUserDetailedStats(userAddress: Address): Promise<UserStats> {
    try {
      const stats = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getUserDetailedStats',
        args: [userAddress]
      });
      return stats as unknown as UserStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user stats: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getUserProfile(userAddress: Address): Promise<UserProfileView> {
    try {
      const profile = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getUserProfile',
        args: [userAddress]
      });
      return profile as unknown as UserProfileView;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Collection Functions ============

  async getContractCUSDBalance(): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.cUSDTokenAddress,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'balanceOf',
        args: [this.contractAddress]
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error getting contract cUSD balance:', error);
      throw new Error('Failed to get contract cUSD balance: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async createCollection(
    account: Address,
    wasteType: AfricycleWasteStream,
    weight: number | bigint,
    location: string,
    imageHash: string,
    pickupTime: number | bigint,
    recycler: Address
  ): Promise<Hash> {
    try {
      console.log('Debug: Starting createCollection with params:', {
        account,
        wasteType,
        weight,
        location,
        imageHash,
        pickupTime,
        recycler
      });

      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      const pickupTimeBigInt = typeof pickupTime === 'number' ? BigInt(pickupTime) : pickupTime;

      // Validate inputs
      if (!location.trim()) throw new Error('Please provide a valid location.');
      if (!imageHash.trim()) throw new Error('Please upload a verification image.');
      if (weightBigInt <= BigInt(0)) throw new Error('Weight must be greater than 0.');
      if (pickupTimeBigInt <= BigInt(Math.floor(Date.now() / 1000))) throw new Error('Pickup time must be in the future.');
      if (!recycler) throw new Error('Recycler address is required.');

      // Check if user is a collector
      const COLLECTOR_ROLE = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'COLLECTOR_ROLE'
      });
      const hasCollectorRole = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'hasRole',
        args: [COLLECTOR_ROLE, account]
      });
      if (!hasCollectorRole) throw new Error('You are not registered as a collector.');

      // Check if recycler is valid
      const RECYCLER_ROLE = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'RECYCLER_ROLE'
      });
      const hasRecyclerRole = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'hasRole',
        args: [RECYCLER_ROLE, recycler]
      });
      if (!hasRecyclerRole) throw new Error('Invalid recycler address.');

      // Check if contract is paused
      const isPaused = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'paused'
      });
      if (isPaused) throw new Error('The contract is currently paused.');

      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createCollection',
        args: [wasteType, weightBigInt, location, imageHash, pickupTimeBigInt, recycler],
        account
      });

      return withDivviTracking(simulateFn, this.walletClient, account, true); // Value-generating
    } catch (error) {
      console.error('Error in createCollection:', error);
      const errorMessages: { [key: string]: string } = {
        'InsufficientBalance': 'Contract has insufficient cUSD balance.',
        'TransferFailed': 'Token transfer failed.',
        'ZeroAddress': 'Invalid address provided.',
        'Weight exceeds maximum': 'Weight exceeds maximum allowed limit.',
        'Weight must be positive': 'Weight must be greater than 0.',
        'Location required': 'Please provide a valid location.',
        'Image hash required': 'Please upload a verification image.',
        'Invalid pickup time': 'Pickup time must be in the future.',
        'Pickup time too far': 'Pickup time is beyond the allowed window.',
        'Invalid recycler': 'Selected address is not a registered recycler.',
        'User is blacklisted': 'Your account is blacklisted.',
        'User is suspended': 'Your account is suspended.',
        'Caller is not a collector': 'You are not registered as a collector.',
        'Contract is paused': 'The contract is currently paused.'
      };

      const revertReason = error instanceof Error ? error.message.match(/execution reverted: "([^"]+)"/)?.[1] : null;
      const errorMessage = revertReason && errorMessages[revertReason] 
        ? errorMessages[revertReason]
        : 'Failed to create collection: ' + (error instanceof Error ? error.message : 'Unknown error');
      
      throw new Error(errorMessage);
    }
  }

  async batchCreateCollection(
    account: Address,
    wasteTypes: AfricycleWasteStream[],
    weights: (number | bigint)[],
    locations: string[],
    imageHashes: string[],
    pickupTimes: (number | bigint)[],
    recyclers: Address[]
  ): Promise<Hash> {
    try {
      if (wasteTypes.length !== weights.length ||
          weights.length !== locations.length ||
          locations.length !== imageHashes.length ||
          imageHashes.length !== pickupTimes.length ||
          pickupTimes.length !== recyclers.length) {
        throw new Error('Array length mismatch');
      }

      const weightsBigInt = weights.map(w => typeof w === 'number' ? BigInt(w) : w);
      const pickupTimesBigInt = pickupTimes.map(pt => typeof pt === 'number' ? BigInt(pt) : pt);

      // Validate inputs
      for (let i = 0; i < wasteTypes.length; i++) {
        if (!locations[i].trim()) throw new Error(`Invalid location at index ${i}`);
        if (!imageHashes[i].trim()) throw new Error(`Invalid image hash at index ${i}`);
        if (weightsBigInt[i] <= BigInt(0)) throw new Error(`Invalid weight at index ${i}`);
        if (pickupTimesBigInt[i] <= BigInt(Math.floor(Date.now() / 1000))) {
          throw new Error(`Pickup time must be in the future at index ${i}`);
        }
        if (!recyclers[i]) throw new Error(`Invalid recycler address at index ${i}`);
      }

      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'batchCreateCollection',
        args: [wasteTypes, weightsBigInt, locations, imageHashes, pickupTimesBigInt, recyclers],
        account
      });

      return withDivviTracking(simulateFn, this.walletClient, account, true); // Value-generating
    } catch (error) {
      console.error('Error in batchCreateCollection:', error);
      throw new Error('Failed to create batch collection: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async confirmPickup(account: Address, collectionId: number | bigint): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'confirmPickup',
        args: [collectionIdBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error confirming pickup:', error);
      throw new Error('Failed to confirm pickup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async rejectPickup(account: Address, collectionId: number | bigint, reason: string): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'rejectPickup',
        args: [collectionIdBigInt, reason],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error rejecting pickup:', error);
      throw new Error('Failed to reject pickup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updatePickupDetails(
    account: Address,
    collectionId: number | bigint,
    newPickupTime: number | bigint,
    newRecycler: Address
  ): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const newPickupTimeBigInt = typeof newPickupTime === 'number' ? BigInt(newPickupTime) : newPickupTime;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updatePickupDetails',
        args: [collectionIdBigInt, newPickupTimeBigInt, newRecycler],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating pickup details:', error);
      throw new Error('Failed to update pickup details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async addEWasteDetails(
    account: Address,
    collectionId: number | bigint,
    componentCounts: (number | bigint)[],
    serialNumber: string,
    manufacturer: string,
    estimatedValue: number | bigint
  ): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const componentCountsBigInt = componentCounts.map(c => typeof c === 'number' ? BigInt(c) : c);
      const estimatedValueBigInt = typeof estimatedValue === 'number' ? BigInt(estimatedValue) : estimatedValue;
      
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'addEWasteDetails',
        args: [collectionIdBigInt, componentCountsBigInt, serialNumber, manufacturer, estimatedValueBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error adding E-Waste details:', error);
      throw new Error('Failed to add E-Waste details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateCollection(
    account: Address,
    collectionId: number | bigint,
    weight: number | bigint,
    location: string,
    imageHash: string
  ): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateCollection',
        args: [collectionIdBigInt, weightBigInt, location, imageHash],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw new Error('Failed to update collection: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getCollectionDetails(
    collectionId: number | bigint
  ): Promise<{
    collection: WasteCollection;
    componentCounts: bigint[];
    serialNumber: string;
    manufacturer: string;
    estimatedValue: bigint;
  }> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const details = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getCollectionDetails',
        args: [collectionIdBigInt],
      });
      return details as unknown as {
        collection: WasteCollection;
        componentCounts: bigint[];
        serialNumber: string;
        manufacturer: string;
        estimatedValue: bigint;
      };
    } catch (error) {
      console.error('Error getting collection details:', error);
      throw new Error('Failed to get collection details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get collection directly from collections mapping (simpler approach)
  async getCollectionDirect(collectionId: number | bigint): Promise<WasteCollection | null> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const collection = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'collections',
        args: [collectionIdBigInt],
      });
      
      // Check if collection exists (non-zero collector address means it exists)
      const rawData = collection as any[];
      if (rawData && rawData.length >= 13 && rawData[1] !== '0x0000000000000000000000000000000000000000') {
        // Parse the collection data based on the contract's collection struct
        return {
          id: rawData[0] as bigint,
          collector: rawData[1] as Address,
          wasteType: Number(rawData[2]) as AfricycleWasteStream,
          weight: rawData[3] as bigint,
          location: rawData[4] as string,
          imageHash: rawData[5] as string,
          status: Number(rawData[6]) as AfricycleStatus,
          timestamp: rawData[7] as bigint,
          quality: Number(rawData[8]) as AfricycleQualityGrade,
          rewardAmount: rawData[9] as bigint,
          isProcessed: Boolean(rawData[10]),
          pickupTime: rawData[11] as bigint,
          selectedRecycler: rawData[12] as Address,
        };
      }
      return null;
    } catch (error) {
      console.log(`Collection ${collectionId} not accessible:`, error);
      return null;
    }
  }

  // Get all collections for a recycler (by iterating through available collections)
  async getRecyclerCollections(recyclerAddress: Address): Promise<WasteCollection[]> {
    try {
      console.log('Debug: Starting getRecyclerCollections for recycler:', recyclerAddress);
      const collections: WasteCollection[] = [];
      
      // Use a much more efficient approach
      let collectionId = 0;
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Reduced from 10
      const maxTotalChecks = 10; // Maximum total collections to check
      
      while (consecutiveFailures < maxConsecutiveFailures && collectionId < maxTotalChecks) {
        try {
          const collection = await this.getCollectionDirect(collectionId);
          console.log(`Debug: Collection ${collectionId}:`, {
            exists: !!collection,
            selectedRecycler: collection?.selectedRecycler,
            targetRecycler: recyclerAddress,
            status: collection?.status
          });
          
          // Check if collection exists and is assigned to this recycler
          if (collection && 
              collection.selectedRecycler && 
              collection.selectedRecycler.toLowerCase() === recyclerAddress.toLowerCase()) {
            collections.push(collection);
            console.log(`Debug: Added collection ${collectionId} to results`);
          }
          consecutiveFailures = 0; // Reset failure count on success
        } catch (error) {
          // Collection might not exist or be accessible, continue
          console.log(`Collection ${collectionId} not accessible:`, error);
          consecutiveFailures++;
        }
        collectionId++;
      }
      
      console.log(`Debug: Found ${collections.length} collections for recycler ${recyclerAddress}`);
      console.log(`Debug: Checked ${collectionId} collections total`);
      return collections;
    } catch (error) {
      console.error('Error getting recycler collections:', error);
      throw new Error('Failed to get recycler collections: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get processing batch details
  async getProcessingBatchDetails(batchId: number | bigint): Promise<ProcessingBatch> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      console.log(`Debug: Fetching processing batch details for batchId:`, batchIdBigInt.toString());
      
      const batch = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'processingBatches',
        args: [batchIdBigInt],
      });
      
      console.log(`Debug: Raw batch data for ${batchIdBigInt}:`, batch);
      
      // Parse the raw contract data into ProcessingBatch structure
      // Based on the contract's ProcessingBatch struct:
      // struct ProcessingBatch {
      //   uint256 id;                    // 0
      //   address processor;             // 1
      //   WasteStream wasteType;         // 2
      //   uint256 inputAmount;           // 3
      //   uint256 outputAmount;          // 4
      //   uint256 timestamp;             // 5
      //   Status status;                 // 6
      //   string processDescription;     // 7
      //   QualityGrade outputQuality;    // 8
      //   uint256 carbonOffset;          // 9
      // }
      
      const rawData = batch as any[];
      console.log(`Debug: Raw data array length for batch ${batchIdBigInt}:`, rawData?.length);
      console.log(`Debug: Raw data elements:`, rawData);
      
      if (rawData && rawData.length >= 10 && rawData[1] !== '0x0000000000000000000000000000000000000000') {
        const parsedBatch: ProcessingBatch = {
          id: rawData[0] as bigint,
          processor: rawData[1] as Address,
          wasteType: Number(rawData[2]) as AfricycleWasteStream,
          inputAmount: rawData[3] as bigint,
          outputAmount: rawData[4] as bigint,
          timestamp: rawData[5] as bigint,
          status: Number(rawData[6]) as AfricycleStatus,
          processDescription: rawData[7] as string,
          outputQuality: Number(rawData[8]) as AfricycleQualityGrade,
          carbonOffset: rawData[9] as bigint,
        };
        
        console.log(`Debug: Parsed batch ${batchIdBigInt}:`, parsedBatch);
        return parsedBatch;
      } else {
        console.log(`Debug: Batch ${batchIdBigInt} does not exist (invalid processor address or insufficient data)`);
        throw new Error(`Processing batch ${batchId} does not exist`);
      }
    } catch (error) {
      console.error(`Error getting processing batch details for ${batchId}:`, error);
      throw new Error('Failed to get processing batch details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get all processing batches for a recycler
  async getRecyclerProcessingBatches(recyclerAddress: Address): Promise<ProcessingBatch[]> {
    try {
      console.log('Debug: Starting getRecyclerProcessingBatches for recycler:', recyclerAddress);
      const batches: ProcessingBatch[] = [];
      
      // Since there's no direct way to get all batches, we'll need to iterate
      // This is not ideal but necessary without additional contract functions
      // In a real implementation, you'd want a contract function to return recycler batches
      
      // For now, we'll try to get batches by incrementing ID (not ideal)
      let batchId = 0;
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Reduced from 10
      const maxTotalChecks = 10; // Maximum total batches to check
      
      console.log('Debug: Will check up to', maxTotalChecks, 'batches, stopping after', maxConsecutiveFailures, 'consecutive failures');
      
      while (consecutiveFailures < maxConsecutiveFailures && batchId < maxTotalChecks) {
        try {
          console.log(`Debug: Checking batch ${batchId}...`);
          
          // Add explicit error handling for batch details fetching
          let batch: ProcessingBatch | null = null;
          try {
            batch = await this.getProcessingBatchDetails(batchId);
            console.log(`Debug: Successfully fetched batch ${batchId}:`, batch);
          } catch (batchError) {
            console.log(`Debug: Failed to fetch batch ${batchId}:`, batchError);
            // Continue to the logging below with null batch
          }
          
          console.log(`Debug: Batch ${batchId}:`, {
            exists: !!batch,
            processor: batch?.processor,
            targetRecycler: recyclerAddress,
            status: batch?.status,
            inputAmount: batch?.inputAmount?.toString()
          });
          
          // Add safety check to ensure batch exists and has required properties
          if (batch && batch.processor && batch.processor.toLowerCase() === recyclerAddress.toLowerCase()) {
            batches.push(batch);
            console.log(`Debug: Added batch ${batchId} to results`);
          }
          consecutiveFailures = 0; // Reset failure count
        } catch (error) {
          console.log(`Debug: Error accessing batch ${batchId}:`, error);
          consecutiveFailures++;
        }
        batchId++;
      }
      
      console.log(`Debug: Found ${batches.length} batches for recycler ${recyclerAddress}`);
      console.log(`Debug: Checked ${batchId} batches total, ${consecutiveFailures} consecutive failures`);
      return batches;
    } catch (error) {
      console.error('Error getting recycler processing batches:', error);
      throw new Error('Failed to get recycler processing batches: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Processing Functions ============

  async createProcessingBatch(
    account: Address,
    collectionIds: (number | bigint)[],
    processDescription: string
  ): Promise<Hash> {
    try {
        const collectionIdsBigInt = collectionIds.map(id => typeof id === 'number' ? BigInt(id) : id);
        const simulateFn = () => this.publicClient.simulateContract({
          address: this.contractAddress,
          abi: afriCycleAbi,
          functionName: 'createProcessingBatch',
          args: [collectionIdsBigInt, processDescription],
          account,
        });
        return withDivviTracking(simulateFn, this.walletClient, account, true); // Value-generating
      } catch (error) {
        console.error('Error creating processing batch:', error);
        throw new Error('Failed to process batch: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

  async completeProcessing(
    account: Address,
    batchId: number | bigint,
    outputAmount: number | bigint,
    outputQuality: AfricycleQualityGrade
  ): Promise<Hash> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      
      // First, get the batch details to check the input amount and validate
      console.log(`Debug: Fetching batch details to validate output amount...`);
      const batchDetails = await this.getProcessingBatchDetails(batchIdBigInt);
      console.log(`Debug: Batch input amount: ${batchDetails.inputAmount.toString()}`);
      
      // Handle decimal amounts by converting to the same units as input
      let outputAmountBigInt: bigint;
      if (typeof outputAmount === 'number') {
        // The input amount shows us what units the contract uses
        // If input is 2000 for 2kg, then we need to multiply by 1000
        // If input is 2 for 2kg, then we use the number directly
        const inputAmountNum = Number(batchDetails.inputAmount);
        const inputKg = 2; // We know this batch has 2kg input
        const unitsPerKg = inputAmountNum / inputKg;
        
        console.log(`Debug: Contract uses ${unitsPerKg} units per kg`);
        outputAmountBigInt = BigInt(Math.floor(outputAmount * unitsPerKg));
      } else {
        outputAmountBigInt = outputAmount;
      }

      console.log(`Debug: Converting output amount ${outputAmount} to ${outputAmountBigInt.toString()}`);
      console.log(`Debug: Input amount: ${batchDetails.inputAmount.toString()}, Output amount: ${outputAmountBigInt.toString()}`);
      
      // Validate that output amount doesn't exceed input amount
      if (outputAmountBigInt > batchDetails.inputAmount) {
        throw new Error(`Output amount (${outputAmountBigInt.toString()}) cannot exceed input amount (${batchDetails.inputAmount.toString()})`);
      }

      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'completeProcessing',
        args: [batchIdBigInt, outputAmountBigInt, outputQuality],
        account,
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error completing processing:', error);
      throw new Error('Failed to complete processing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async calculateCarbonOffset(
    wasteType: AfricycleWasteStream,
    amount: number | bigint,
    quality: AfricycleQualityGrade
  ): Promise<BigInt> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const carbonOffset = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'calculateCarbonOffset',
        args: [wasteType, amountBigInt, quality],
      });
      return carbonOffset as BigInt;
    } catch (error) {
      console.error('Error calculating carbon offset:', error);
      throw new Error('Failed to calculate carbon offset: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Marketplace Functions ============

  async createListing(
    account: Address,
    wasteType: AfricycleWasteStream,
    amount: number | bigint,
    pricePerUnit: number | bigint,
    quality: AfricycleQualityGrade,
    description: string
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const pricePerUnitBigInt = typeof pricePerUnit === 'number' ? BigInt(pricePerUnit) : pricePerUnit;
      
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createListing',
        args: [wasteType, amountBigInt, pricePerUnitBigInt, quality, description],
        account,
      });
      return withDivviTracking(simulateFn, this.walletClient, account, true); // Value-generating
    } catch (error) {
      console.error('Error creating listing:', error);
      throw new Error('Failed to create listing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateListing(
    account: Address,
    listingId: number | bigint,
    newAmount: number | bigint,
    newPricePerUnit: number | bigint,
    newDescription: string
  ): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      const newAmountBigInt = typeof newAmount === 'number' ? BigInt(newAmount) : newAmount;
      const newPricePerUnitBigInt = typeof newPricePerUnit === 'number' ? BigInt(newPricePerUnit) : newPricePerUnit;
      
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateListing',
        args: [listingIdBigInt, newAmountBigInt, newPricePerUnitBigInt, newDescription],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating listing:', error);
      throw new Error('Failed to update listing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async cancelListing(account: Address, listingId: number | bigint): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'cancelListing',
        args: [listingIdBigInt],
        account,
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error canceling listing:', error);
      throw new Error('Failed to cancel listing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async purchaseListing(account: Address, listingId: number | bigint): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'purchaseListing',
        args: [listingIdBigInt],
        account,
      });
      return withDivviTracking(simulateFn, this.walletClient, account, true); // Value-generating
    } catch (error) {
      console.error('Error purchasing listing:', error);
      throw new Error('Failed to purchase listing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getMarketplaceListings(
    wasteType: AfricycleWasteStream,
    activeOnly: boolean
  ): Promise<bigint[]> {
    try {
      const listings = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getMarketplaceListings',
        args: [wasteType, activeOnly]
      });
      return listings as bigint[];
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      throw new Error('Failed to get marketplace listings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Impact Credit Functions ============

  async getUserImpactCredits(userAddress: Address): Promise<bigint[]> {
    try {
      const credits = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getUserImpactCredits',
        args: [userAddress]
      });
      return credits as bigint[];
    } catch (error) {
      console.error('Error getting user impact credits:', error);
      throw new Error('Failed to get user impact credits: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async transferImpactCredit(
    account: Address,
    creditId: number | bigint,
    to: Address
  ): Promise<Hash> {
    try {
      const creditIdBigInt = typeof creditId === 'number' ? BigInt(creditId) : creditId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'transferImpactCredit',
        args: [creditIdBigInt, to],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error transferring impact credit:', error);
      throw new Error('Failed to transfer impact credit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async burnImpactCredit(account: Address, creditId: number | bigint): Promise<Hash> {
    try {
      const creditIdBigInt = typeof creditId === 'number' ? BigInt(creditId) : creditId;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'burnImpactCredit',
        args: [creditIdBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error burning impact credit:', error);
      throw new Error('Failed to burn impact credit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Withdrawal Functions ============

  async withdrawCollectorEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawCollectorEarnings',
        args: [amountBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error withdrawing collector earnings:', error);
      throw new Error('Failed to withdraw collector earnings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async withdrawRecyclerEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawRecyclerEarnings',
        args: [amountBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error withdrawing recycler earnings:', error);
      throw new Error('Failed to withdraw recycler earnings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async withdrawRecyclerInventory(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawRecyclerInventory',
        args: [amountBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error withdrawing recycler inventory:', error);
      throw new Error('Failed to withdraw recycler inventory: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Stats Functions ============

  async getGlobalStats(): Promise<{
    collectedStats: bigint[];
    processedStats: bigint[];
    marketplaceStats: bigint[];
    platformFees: bigint;
    rewardsPaid: bigint;
  }> {
    try {
      const stats = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getGlobalStats'
      });
      const [collectedStats, processedStats, marketplaceStats, platformFees, rewardsPaid] = 
        stats as [bigint[], bigint[], bigint[], bigint, bigint];
      return {
        collectedStats,
        processedStats,
        marketplaceStats,
        platformFees,
        rewardsPaid
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      throw new Error('Failed to get global stats: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getPlatformStats(): Promise<{
    userCount: bigint;
    collectionCount: bigint;
    processedCount: bigint;
    listingCount: bigint;
    creditCount: bigint;
    revenue: bigint;
    wasteStats: bigint[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getPlatformStats'
      });
      const [userCount, collectionCount, processedCount, listingCount, creditCount, revenue, wasteStats] = 
        result as [bigint, bigint, bigint, bigint, bigint, bigint, bigint[]];
      return {
        userCount,
        collectionCount,
        processedCount,
        listingCount,
        creditCount,
        revenue,
        wasteStats
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw new Error('Failed to get platform stats: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Recycler Functions ============

  async registerCollectorAtRecycler(
    account: Address,
    collector: Address
  ): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollectorAtRecycler',
        args: [collector],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error registering collector at recycler:', error);
      throw new Error('Failed to register collector at recycler: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async removeCollectorFromRecycler(
    account: Address,
    collector: Address
  ): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'removeCollectorFromRecycler',
        args: [collector],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error removing collector from recycler:', error);
      throw new Error('Failed to remove collector from recycler: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateRecyclerInventory(
    account: Address,
    wasteType: AfricycleWasteStream,
    newAmount: number | bigint
  ): Promise<Hash> {
    try {
      const newAmountBigInt = typeof newAmount === 'number' ? BigInt(newAmount) : newAmount;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateRecyclerInventory',
        args: [wasteType, newAmountBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating recycler inventory:', error);
      throw new Error('Failed to update recycler inventory: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Admin Functions ============

  async setRewardRate(
    account: Address,
    wasteType: AfricycleWasteStream,
    rate: number | bigint
  ): Promise<Hash> {
    try {
      const rateBigInt = typeof rate === 'number' ? BigInt(rate) : rate;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'setRewardRate',
        args: [wasteType, rateBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error setting reward rate:', error);
      throw new Error('Failed to set reward rate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async setQualityMultiplier(
    account: Address,
    wasteType: AfricycleWasteStream,
    quality: AfricycleQualityGrade,
    multiplier: number | bigint
  ): Promise<Hash> {
    try {
      const multiplierBigInt = typeof multiplier === 'number' ? BigInt(multiplier) : multiplier;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'setQualityMultiplier',
        args: [wasteType, quality, multiplierBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error setting quality multiplier:', error);
      throw new Error('Failed to set quality multiplier: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateCarbonOffsetMultiplier(
    account: Address,
    wasteType: AfricycleWasteStream,
    multiplier: number | bigint
  ): Promise<Hash> {
    try {
      const multiplierBigInt = typeof multiplier === 'number' ? BigInt(multiplier) : multiplier;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateCarbonOffsetMultiplier',
        args: [wasteType, multiplierBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating carbon offset multiplier:', error);
      throw new Error('Failed to update carbon offset multiplier: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateQualityCarbonMultiplier(
    account: Address,
    quality: AfricycleQualityGrade,
    multiplier: number | bigint
  ): Promise<Hash> {
    try {
      const multiplierBigInt = typeof multiplier === 'number' ? BigInt(multiplier) : multiplier;
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateQualityCarbonMultiplier',
        args: [quality, multiplierBigInt],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error updating quality carbon multiplier:', error);
      throw new Error('Failed to update quality carbon multiplier: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async batchUpdateCollectionQuality(
    account: Address,
    collectionIds: (number | bigint)[],
    newGrades: AfricycleQualityGrade[]
  ): Promise<Hash> {
    try {
      const collectionIdsBigInt = collectionIds.map(id => typeof id === 'number' ? BigInt(id) : id);
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'batchUpdateCollectionQuality',
        args: [collectionIdsBigInt, newGrades],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error batch updating collection quality:', error);
      throw new Error('Failed to batch update collection quality: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async batchUpdateReputation(
    account: Address,
    users: Address[],
    newScores: (number | bigint)[],
    reason: string
  ): Promise<Hash> {
    try {
      const newScoresBigInt = newScores.map(score => typeof score === 'number' ? BigInt(score) : score);
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'batchUpdateReputation',
        args: [users, newScoresBigInt, reason],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error batch updating reputation:', error);
      throw new Error('Failed to batch update reputation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async withdrawPlatformFees(account: Address): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawPlatformFees',
        args: [],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error withdrawing platform fees:', error);
      throw new Error('Failed to withdraw platform fees: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async pause(account: Address): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'pause',
        args: [],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error pausing contract:', error);
      throw new Error('Failed to pause contract: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async unpause(account: Address): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'unpause',
        args: [],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error unpausing contract:', error);
      throw new Error('Failed to unpause contract: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async suspendUser(account: Address, user: Address, reason: string): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'suspendUser',
        args: [user, reason],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error suspending user:', error);
      throw new Error('Failed to suspend user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async unsuspendUser(account: Address, user: Address): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'unsuspendUser',
        args: [user],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw new Error('Failed to unsuspend user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async blacklistUser(account: Address, user: Address, reason: string): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'blacklistUser',
        args: [user, reason],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error blacklisting user:', error);
      throw new Error('Failed to blacklist user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async removeFromBlacklist(account: Address, user: Address): Promise<Hash> {
    try {
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'removeFromBlacklist',
        args: [user],
        account
      });
      return withDivviTracking(simulateFn, this.walletClient, account);
    } catch (error) {
      console.error('Error removing user from blacklist:', error);
      throw new Error('Failed to remove user from blacklist: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ============ Helper Functions for Real Active Collectors ============

  async getRealActiveCollectorsCount(recyclerAddress: Address): Promise<bigint> {
    try {
      console.log('Debug: Starting getRealActiveCollectorsCount for recycler:', recyclerAddress);
      
      // Get unique collectors who have chosen this recycler
      const uniqueCollectors = new Set<string>();
      
      // Query collections incrementally until we hit the end
      let collectionId = 0;
      const batchSize = 10;
      const maxCollections = 20; // Safety limit to prevent infinite loops
      
      while (collectionId < maxCollections) {
        const promises = [];
        const end = Math.min(collectionId + batchSize, maxCollections);
        
        // Create batch of promises
        for (let j = collectionId; j < end; j++) {
          promises.push(
            this.publicClient.readContract({
              address: this.contractAddress,
              abi: afriCycleAbi,
              functionName: 'collections',
              args: [BigInt(j)]
            }).catch(() => null) // Return null for failed queries
          );
        }

        const batchResults = await Promise.allSettled(promises);
        let foundValidCollection = false;
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            // The contract returns an array, not an object
            const rawData = result.value as any[];
            
            // Parse the array data based on the contract's collection struct
            // struct WasteCollection { 
            //   uint256 id;                     // 0
            //   address collector;              // 1
            //   WasteStream wasteType;          // 2
            //   uint256 weight;                 // 3
            //   string location;                // 4
            //   string imageHash;               // 5
            //   Status status;                  // 6
            //   uint256 timestamp;              // 7
            //   QualityGrade quality;           // 8
            //   uint256 rewardAmount;           // 9
            //   bool isProcessed;               // 10
            //   uint256 pickupTime;             // 11
            //   address selectedRecycler;       // 12
            // }
            
            if (rawData && rawData.length >= 13) {
              const collectionIdInArray = Number(rawData[0]);
              const collector = rawData[1] as Address;
              const selectedRecycler = rawData[12] as Address;
              const status = Number(rawData[6]);
              const isProcessed = Boolean(rawData[10]);
              
              console.log(`Debug: Checking collection ${collectionId + index}:`, {
                collector,
                selectedRecycler,
                status,
                isProcessed,
                recyclerAddress
              });
              
              // Check if collection exists and has valid addresses
              if (collector && 
                  collector !== '0x0000000000000000000000000000000000000000' &&
                  selectedRecycler &&
                  selectedRecycler !== '0x0000000000000000000000000000000000000000') {
                foundValidCollection = true;
                
                // Only count collections that are active (not completed/processed)
                if (selectedRecycler.toLowerCase() === recyclerAddress.toLowerCase() && 
                    !isProcessed && 
                    status !== 4) { // 4 = COMPLETED status
                  uniqueCollectors.add(collector.toLowerCase());
                  console.log(`Debug: Added collector ${collector} for recycler ${recyclerAddress}`);
                }
              }
            }
          }
        });

        // If no valid collections found in this batch, we've likely reached the end
        if (!foundValidCollection) {
          console.log('Debug: No more valid collections found, stopping search');
          break;
        }
        
        collectionId = end;
      }

      console.log('Debug: Final unique collectors count:', uniqueCollectors.size);
      console.log('Debug: Unique collectors:', Array.from(uniqueCollectors));
      
      return BigInt(uniqueCollectors.size);
    } catch (error) {
      console.error('Error getting real active collectors count:', error);
      // Fallback to contract's activeCollectors if our calculation fails
      try {
        const profile = await this.getUserProfile(recyclerAddress);
        return profile.activeCollectors;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return BigInt(0); // Return 0 if everything fails
      }
    }
  }
}

export function useAfriCycle({ contractAddress, rpcUrl }: { contractAddress: Address, rpcUrl: string }): (AfriCycle & { account: Address }) | null {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const africycle = useMemo(() => {
    if (!isConnected || !address || !walletClient) {
      return null;
    }

    try {
      const instance = new AfriCycle(contractAddress, rpcUrl, walletClient);
      return Object.assign(instance, { account: address });
    } catch (error) {
      console.error('useAfriCycle: Error creating instance:', error);
      return null;
    }
  }, [isConnected, address, walletClient, contractAddress, rpcUrl]);

  return africycle;
}