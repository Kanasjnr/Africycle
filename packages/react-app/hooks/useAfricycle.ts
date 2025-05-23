import { 
    createPublicClient, 
    createWalletClient, 
    http, 
    parseEther,
    formatEther,
    type Address,
    type Hash,
    type PublicClient,
    type WalletClient,
    type Transport,
    type Chain,
    type Account,
    custom
  } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores } from 'viem/chains'; // Using Alfajores testnet instead of mainnet
// Import ABI directly from JSON file
import afriCycleAbi from '@/ABI/Africycle.json';
import { useAccount, useWalletClient } from 'wagmi';
import { useMemo } from 'react'

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
  CANCELLED = 5
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
  carbonCredits: bigint;
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
  // Collector stats
  totalCollected: bigint;
  totalEarnings: bigint;
  pendingVerifications: bigint;
  verifiedCollections: bigint;
  collectorReputationScore: bigint;
  collectedByType: [bigint, bigint, bigint, bigint];
  // Collection point stats
  totalInventory: bigint;
  collectionPointPendingVerifications: bigint;
  scheduledPickups: bigint;
  activeCollectors: bigint;
  inventoryByType: [bigint, bigint, bigint, bigint];
  // Recycler stats
  recyclerTotalEarnings: bigint;
  activeListings: bigint;
  recyclerReputationScore: bigint;
  processedByType: [bigint, bigint, bigint, bigint];
  // Corporate stats
  totalPurchases: bigint;
  totalImpactCredits: bigint;
  carbonOffset: bigint;
  purchasedByType: [bigint, bigint, bigint, bigint];
}

export class AfriCycle {
  private publicClient: PublicClient;
  private walletClient: WalletClient<Transport, Chain, Account>;
  private contractAddress: Address;
  private cUSDTokenAddress: Address;

  constructor(
    contractAddress: Address,
    rpcUrl: string,
    cUSDTokenAddress: Address = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // Alfajores cUSD
  ) {
    if (!contractAddress) throw new Error('Contract address is required')
    if (!rpcUrl) throw new Error('RPC URL is required')

    this.contractAddress = contractAddress
    this.cUSDTokenAddress = cUSDTokenAddress
    this.publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(rpcUrl)
    }) as PublicClient

    // Only create wallet client if window.ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.walletClient = createWalletClient({
        chain: celoAlfajores,
        transport: custom(window.ethereum)
      }) as WalletClient<Transport, Chain, Account>
    } else {
      throw new Error('Ethereum provider not found')
    }

    // Verify clients are properly initialized
    if (!this.publicClient.readContract) {
      throw new Error('Public client is not properly initialized')
    }
    if (!this.walletClient.writeContract) {
      throw new Error('Wallet client is not properly initialized')
    }
  }

  // ============ User Management Functions ============

  /**
   * Register a new collector
   */
  async registerCollector(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollector',
        args: [name, location, contactInfo],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error registering collector:', error);
      throw error;
    }
  }

  /**
   * Register a new collection point
   */
  async registerCollectionPoint(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollectionPoint',
        args: [name, location, contactInfo],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error registering collection point:', error);
      throw error;
    }
  }

  /**
   * Register a new recycler
   */
  async registerRecycler(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerRecycler',
        args: [name, location, contactInfo],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error registering recycler:', error);
      throw error;
    }
  }

  /**
   * Register a new corporate partner
   */
  async registerCorporate(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCorporate',
        args: [name, location, contactInfo],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error registering corporate partner:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    account: Address,
    name: string,
    location: string,
    contactInfo: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateUserProfile',
        args: [name, location, contactInfo],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's role
   */
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
      throw error;
    }
  }

  /**
   * Get user's detailed stats
   */
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
      throw error;
    }
  }

  /**
   * Get user profile
   */
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
      throw error;
    }
  }

  // ============ Collection Functions ============

  /**
   * Get the contract's cUSD balance
   */
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
      throw new Error('Failed to get contract cUSD balance');
    }
  }

  /**
   * Create a new waste collection
   */
  async createCollection(
    account: Address,
    wasteType: AfricycleWasteStream,
    weight: number | bigint,
    location: string,
    qrCode: string,
    imageHash: string
  ): Promise<Hash> {
    try {
      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      
      // Calculate expected reward
      const rewardRate = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'rewardRates',
        args: [wasteType]
      }) as bigint;
      
      const expectedReward = (weightBigInt * rewardRate) / BigInt(1e18);
      
      // Check contract's cUSD balance
      const contractBalance = await this.getContractCUSDBalance();
      if (contractBalance < expectedReward) {
        throw new Error(`Contract has insufficient cUSD balance (${formatEther(contractBalance)} cUSD) to distribute the expected reward (${formatEther(expectedReward)} cUSD). Please contact support.`);
      }
      
      // First simulate the transaction to catch any potential errors
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createCollection',
        args: [wasteType, weightBigInt, location, qrCode, imageHash],
        account
      });

      // If simulation succeeds, send the actual transaction
      const hash = await this.walletClient.writeContract(request);
      
      // Wait for transaction to be mined and check for revert
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'reverted') {
        // Try to decode the revert reason from the logs
        const revertLog = receipt.logs.find(log => 
          log.topics[0] === '0x08c379a000000000000000000000000000000000000000000000000000000000' // Error(string) event signature
        );
        
        let revertReason = '';
        if (revertLog) {
          // Extract the error message from the log data
          const data = revertLog.data.slice(2); // Remove '0x'
          const messageLength = parseInt(data.slice(0, 64), 16);
          const messageHex = data.slice(64, 64 + messageLength * 2);
          revertReason = Buffer.from(messageHex, 'hex').toString().replace(/\0/g, '');
        }

        const errorMessages: { [key: string]: string } = {
          'Reward transfer failed': 'The contract does not have enough cUSD tokens to distribute rewards. Please contact support.',
          'Caller is not a collector': 'You are not registered as a collector. Please complete your registration first.',
          'Location required': 'Please provide a valid location for the collection.',
          'Image hash required': 'Please upload a verification image for the collection.',
          'Weight must be positive': 'Please enter a valid weight greater than 0.',
          'Weight exceeds maximum': 'The weight exceeds the maximum allowed limit.',
        };

        // Throw a user-friendly error message
        throw new Error(errorMessages[revertReason] || 
          'Failed to create collection. Please try again or contact support if the issue persists.');
      }

      return hash;
    } catch (error) {
      // Handle simulation errors
      if (error instanceof Error) {
        // Check for common simulation errors
        if (error.message.includes('insufficient funds')) {
          throw new Error('You do not have enough CELO to pay for the transaction gas fees.');
        }
        if (error.message.includes('execution reverted')) {
          // Try to extract the revert reason
          const revertReason = error.message.match(/execution reverted: "([^"]+)"/)?.[1];
          if (revertReason) {
            const errorMessages: { [key: string]: string } = {
              'Reward transfer failed': 'The contract does not have enough cUSD tokens to distribute rewards. Please contact support.',
              'Caller is not a collector': 'You are not registered as a collector. Please complete your registration first.',
              'Location required': 'Please provide a valid location for the collection.',
              'Image hash required': 'Please upload a verification image for the collection.',
              'Weight must be positive': 'Please enter a valid weight greater than 0.',
              'Weight exceeds maximum': 'The weight exceeds the maximum allowed limit.',
            };
            throw new Error(errorMessages[revertReason] || 
              'Failed to create collection. Please try again or contact support if the issue persists.');
          }
        }
      }
      // For any other errors, throw a generic message
      throw new Error('Failed to create collection. Please try again or contact support if the issue persists.');
    }
  }

  /**
   * Create multiple waste collections in a batch
   */
  async batchCreateCollections(
    account: Address,
    wasteTypes: AfricycleWasteStream[],
    weights: (number | bigint)[],
    locations: string[],
    qrCodes: string[],
    imageHashes: string[]
  ): Promise<Hash> {
    try {
      const weightsBigInt = weights.map(w => typeof w === 'number' ? BigInt(w) : w);
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'batchCreateCollections',
        args: [wasteTypes, weightsBigInt, locations, qrCodes, imageHashes],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error creating batch collections:', error);
      throw error;
    }
  }

  /**
   * Add E-Waste details to a collection
   */
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
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'addEWasteDetails',
        args: [collectionIdBigInt, componentCountsBigInt, serialNumber, manufacturer, estimatedValueBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error adding E-Waste details:', error);
      throw error;
    }
  }

  /**
   * Update an existing collection
   */
  async updateCollection(
    account: Address,
    collectionId: number | bigint,
    weight: number | bigint,
    location: string,
    qrCode: string,
    imageHash: string
  ): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateCollection',
        args: [collectionIdBigInt, weightBigInt, location, qrCode, imageHash],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Get collection details
   */
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
        args: [collectionIdBigInt]
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
      throw error;
    }
  }

  /**
   * Get individual collection
   */
  async getCollection(
    collectionId: number | bigint
  ): Promise<WasteCollection> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      
      const collection = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'collections',
        args: [collectionIdBigInt]
      });
      
      return collection as unknown as WasteCollection;
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  // ============ Processing Functions ============

  /**
   * Create a new processing batch
   */
  async createProcessingBatch(
    account: Address,
    collectionIds: (number | bigint)[],
    processDescription: string
  ): Promise<Hash> {
    try {
      const collectionIdsBigInt = collectionIds.map(id => typeof id === 'number' ? BigInt(id) : id);
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createProcessingBatch',
        args: [collectionIdsBigInt, processDescription],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error creating processing batch:', error);
      throw error;
    }
  }

  /**
   * Complete a processing batch
   */
  async completeProcessing(
    account: Address,
    batchId: number | bigint,
    outputAmount: number | bigint,
    outputQuality: AfricycleQualityGrade,
    carbonOffset: number | bigint
  ): Promise<Hash> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      const outputAmountBigInt = typeof outputAmount === 'number' ? BigInt(outputAmount) : outputAmount;
      const carbonOffsetBigInt = typeof carbonOffset === 'number' ? BigInt(carbonOffset) : carbonOffset;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'completeProcessing',
        args: [batchIdBigInt, outputAmountBigInt, outputQuality, carbonOffsetBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error completing processing:', error);
      throw error;
    }
  }

  /**
   * Update a processing batch
   */
  async updateProcessingBatch(
    account: Address,
    batchId: number | bigint,
    newOutputAmount: number | bigint,
    newQuality: AfricycleQualityGrade
  ): Promise<Hash> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      const newOutputAmountBigInt = typeof newOutputAmount === 'number' ? BigInt(newOutputAmount) : newOutputAmount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateProcessingBatch',
        args: [batchIdBigInt, newOutputAmountBigInt, newQuality],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error updating processing batch:', error);
      throw error;
    }
  }

  /**
   * Get processing batch
   */
  async getProcessingBatch(
    batchId: number | bigint
  ): Promise<ProcessingBatch> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      
      const batch = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'processingBatches',
        args: [batchIdBigInt]
      });
      
      return batch as unknown as ProcessingBatch;
    } catch (error) {
      console.error('Error getting processing batch:', error);
      throw error;
    }
  }

  /**
   * Get processing batch details
   */
  async getProcessingBatchDetails(
    batchId: number | bigint
  ): Promise<{
    batch: ProcessingBatch;
    processor: Address;
    collectionIds: bigint[];
  }> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      
      const details = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getProcessingBatchDetails',
        args: [batchIdBigInt]
      });
      
      return details as unknown as {
        batch: ProcessingBatch;
        processor: Address;
        collectionIds: bigint[];
      };
    } catch (error) {
      console.error('Error getting processing batch details:', error);
      throw error;
    }
  }

  /**
   * Get processing batch collections
   */
  async getProcessingBatchCollections(
    batchId: number | bigint
  ): Promise<bigint[]> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      
      const collectionIds = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getProcessingBatchCollections',
        args: [batchIdBigInt]
      });
      
      return collectionIds as bigint[];
    } catch (error) {
      console.error('Error getting processing batch collections:', error);
      throw error;
    }
  }

  // ============ Marketplace Functions ============

  /**
   * Create a new marketplace listing
   */
  async createListing(
    account: Address,
    wasteType: AfricycleWasteStream,
    amount: number | bigint,
    pricePerUnit: number | bigint,
    quality: AfricycleQualityGrade,
    description: string,
    carbonCredits: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const pricePerUnitBigInt = typeof pricePerUnit === 'number' ? BigInt(pricePerUnit) : pricePerUnit;
      const carbonCreditsBigInt = typeof carbonCredits === 'number' ? BigInt(carbonCredits) : carbonCredits;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createListing',
        args: [wasteType, amountBigInt, pricePerUnitBigInt, quality, description, carbonCreditsBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Purchase from a marketplace listing
   */
  async purchaseListing(
    account: Address,
    listingId: number | bigint,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'purchaseListing',
        args: [listingIdBigInt, amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error purchasing listing:', error);
      throw error;
    }
  }

  /**
   * Update a marketplace listing
   */
  async updateListing(
    account: Address,
    listingId: number | bigint,
    newAmount: number | bigint,
    newPrice: number | bigint
  ): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      const newAmountBigInt = typeof newAmount === 'number' ? BigInt(newAmount) : newAmount;
      const newPriceBigInt = typeof newPrice === 'number' ? BigInt(newPrice) : newPrice;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateListing',
        args: [listingIdBigInt, newAmountBigInt, newPriceBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Cancel a marketplace listing
   */
  async cancelListing(
    account: Address,
    listingId: number | bigint
  ): Promise<Hash> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'cancelListing',
        args: [listingIdBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error cancelling listing:', error);
      throw error;
    }
  }

  /**
   * Get marketplace listing
   */
  async getListing(
    listingId: number | bigint
  ): Promise<MarketplaceListing> {
    try {
      const listingIdBigInt = typeof listingId === 'number' ? BigInt(listingId) : listingId;
      
      const listing = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'listings',
        args: [listingIdBigInt]
      });
      
      return listing as unknown as MarketplaceListing;
    } catch (error) {
      console.error('Error getting listing:', error);
      throw error;
    }
  }

  /**
   * Get marketplace listings by waste type
   */
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
      throw error;
    }
  }

  // ============ Impact Credit Functions ============

  /**
   * Get impact credit
   */
  async getImpactCredit(
    creditId: number | bigint
  ): Promise<ImpactCredit> {
    try {
      const creditIdBigInt = typeof creditId === 'number' ? BigInt(creditId) : creditId;
      
      const credit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'impactCredits',
        args: [creditIdBigInt]
      });
      
      return credit as unknown as ImpactCredit;
    } catch (error) {
      console.error('Error getting impact credit:', error);
      throw error;
    }
  }

  /**
   * Transfer an impact credit to another address
   */
  async transferImpactCredit(
    account: Address,
    creditId: number | bigint,
    to: Address
  ): Promise<Hash> {
    try {
      const creditIdBigInt = typeof creditId === 'number' ? BigInt(creditId) : creditId;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'transferImpactCredit',
        args: [creditIdBigInt, to],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error transferring impact credit:', error);
      throw error;
    }
  }

  /**
   * Burn an impact credit
   */
  async burnImpactCredit(
    account: Address,
    creditId: number | bigint
  ): Promise<Hash> {
    try {
      const creditIdBigInt = typeof creditId === 'number' ? BigInt(creditId) : creditId;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'burnImpactCredit',
        args: [creditIdBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error burning impact credit:', error);
      throw error;
    }
  }

  /**
   * Get user's impact credits
   */
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
      throw error;
    }
  }

  // ============ Withdrawal Functions ============

  /**
   * Withdraw collector earnings
   */
  async withdrawCollectorEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawCollectorEarnings',
        args: [amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error withdrawing collector earnings:', error);
      throw error;
    }
  }

  /**
   * Withdraw recycler earnings
   */
  async withdrawRecyclerEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawRecyclerEarnings',
        args: [amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error withdrawing recycler earnings:', error);
      throw error;
    }
  }

  /**
   * Withdraw corporate earnings
   */
  async withdrawCorporateEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawCorporateEarnings',
        args: [amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error withdrawing corporate earnings:', error);
      throw error;
    }
  }

  /**
   * Withdraw collection point earnings
   */
  async withdrawCollectionPointEarnings(
    account: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawCollectionPointEarnings',
        args: [amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error withdrawing collection point earnings:', error);
      throw error;
    }
  }

  // ============ Admin Functions ============

  /**
   * Set reward rate for a waste type
   */
  async setRewardRate(
    account: Address,
    wasteType: AfricycleWasteStream,
    rate: number | bigint
  ): Promise<Hash> {
    try {
      const rateBigInt = typeof rate === 'number' ? parseEther(rate.toString()) : rate;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'setRewardRate',
        args: [wasteType, rateBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error setting reward rate:', error);
      throw error;
    }
  }

  /**
   * Set quality multiplier for a waste type and quality grade
   */
  async setQualityMultiplier(
    account: Address,
    wasteType: AfricycleWasteStream,
    quality: AfricycleQualityGrade,
    multiplier: number | bigint
  ): Promise<Hash> {
    try {
      const multiplierBigInt = typeof multiplier === 'number' ? BigInt(multiplier) : multiplier;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'setQualityMultiplier',
        args: [wasteType, quality, multiplierBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error setting quality multiplier:', error);
      throw error;
    }
  }

  /**
   * Withdraw platform fees
   */
  async withdrawPlatformFees(account: Address): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'withdrawPlatformFees',
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error withdrawing platform fees:', error);
      throw error;
    }
  }

  /**
   * Pause the contract
   */
  async pause(account: Address): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'pause',
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error pausing contract:', error);
      throw error;
    }
  }

  /**
   * Unpause the contract
   */
  async unpause(account: Address): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'unpause',
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error unpausing contract:', error);
      throw error;
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(
    account: Address, 
    user: Address, 
    reason: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'suspendUser',
        args: [user, reason],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(
    account: Address, 
    user: Address
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'unsuspendUser',
        args: [user],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }
  }

  /**
   * Blacklist a user
   */
  async blacklistUser(
    account: Address, 
    user: Address, 
    reason: string
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'blacklistUser',
        args: [user, reason],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error blacklisting user:', error);
      throw error;
    }
  }

  /**
   * Remove a user from blacklist
   */
  async removeFromBlacklist(
    account: Address, 
    user: Address
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'removeFromBlacklist',
        args: [user],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error removing user from blacklist:', error);
      throw error;
    }
  }

  /**
   * Set verification threshold for a waste type
   */
  async setVerificationThreshold(
    account: Address,
    wasteType: AfricycleWasteStream,
    threshold: number | bigint
  ): Promise<Hash> {
    try {
      const thresholdBigInt = typeof threshold === 'number' ? BigInt(threshold) : threshold;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'setVerificationThreshold',
        args: [wasteType, thresholdBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error setting verification threshold:', error);
      throw error;
    }
  }

  /**
   * Emergency withdraw tokens
   */
  async emergencyWithdraw(
    account: Address,
    token: Address,
    amount: number | bigint
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'emergencyWithdraw',
        args: [token, amountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error performing emergency withdrawal:', error);
      throw error;
    }
  }

  // ============ Stats Functions ============

  /**
   * Get user stats
   */
  async getUserStats(userAddress: Address): Promise<{
    collected: bigint[];
    processed: bigint[];
    totalEarnings: bigint;
    reputationScore: bigint;
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getUserStats',
        args: [userAddress]
      });
      
      const [collected, processed, totalEarnings, reputationScore] = result as [bigint[], bigint[], bigint, bigint];
      
      return {
        collected,
        processed,
        totalEarnings,
        reputationScore
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get collector stats
   */
  async getCollectorStats(collectorAddress: Address): Promise<{
    totalCollected: bigint;
    totalEarnings: bigint;
    pendingVerifications: bigint;
    verifiedCollections: bigint;
    reputationScore: bigint;
    collectedByType: bigint[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getCollectorStats',
        args: [collectorAddress]
      });
      
      const [
        totalCollected, 
        totalEarnings, 
        pendingVerifications, 
        verifiedCollections,
        reputationScore,
        collectedByType
      ] = result as [bigint, bigint, bigint, bigint, bigint, bigint[]];
      
      return {
        totalCollected,
        totalEarnings,
        pendingVerifications,
        verifiedCollections,
        reputationScore,
        collectedByType
      };
    } catch (error) {
      console.error('Error getting collector stats:', error);
      throw error;
    }
  }

  /**
   * Get collection point stats
   */
  async getCollectionPointStats(collectionPointAddress: Address): Promise<{
    totalInventory: bigint;
    pendingVerifications: bigint;
    scheduledPickups: bigint;
    activeCollectors: bigint;
    inventoryByType: bigint[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getCollectionPointStats',
        args: [collectionPointAddress]
      });
      
      const [
        totalInventory, 
        pendingVerifications, 
        scheduledPickups, 
        activeCollectors,
        inventoryByType
      ] = result as [bigint, bigint, bigint, bigint, bigint[]];
      
      return {
        totalInventory,
        pendingVerifications,
        scheduledPickups,
        activeCollectors,
        inventoryByType
      };
    } catch (error) {
      console.error('Error getting collection point stats:', error);
      throw error;
    }
  }

  /**
   * Get recycler stats
   */
  async getRecyclerStats(recyclerAddress: Address): Promise<{
    totalEarnings: bigint;
    activeListings: bigint;
    reputationScore: bigint;
    processedByType: bigint[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getRecyclerStats',
        args: [recyclerAddress]
      });
      
      const [totalEarnings, activeListings, reputationScore, processedByType] = 
        result as [bigint, bigint, bigint, bigint[]];
      
      return {
        totalEarnings,
        activeListings,
        reputationScore,
        processedByType
      };
    } catch (error) {
      console.error('Error getting recycler stats:', error);
      throw error;
    }
  }

  /**
   * Get corporate stats
   */
  async getCorporateStats(corporateAddress: Address): Promise<{
    totalPurchases: bigint;
    totalImpactCredits: bigint;
    carbonOffset: bigint;
    purchasedByType: bigint[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getCorporateStats',
        args: [corporateAddress]
      });
      
      const [totalPurchases, totalImpactCredits, carbonOffset, purchasedByType] = 
        result as [bigint, bigint, bigint, bigint[]];
      
      return {
        totalPurchases,
        totalImpactCredits,
        carbonOffset,
        purchasedByType
      };
    } catch (error) {
      console.error('Error getting corporate stats:', error);
      throw error;
    }
  }

  /**
   * Get platform stats
   */
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
      throw error;
    }
  }

  /**
   * Get contract stats
   */
  async getContractStats(): Promise<{
    collectedStats: bigint[];
    processedStats: bigint[];
    userCount: bigint;
    listingCount: bigint;
    creditCount: bigint;
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'getContractStats'
      });
      
      const [collectedStats, processedStats, userCount, listingCount, creditCount] = 
        result as [bigint[], bigint[], bigint, bigint, bigint];
      
      return {
        collectedStats,
        processedStats,
        userCount,
        listingCount,
        creditCount
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      throw error;
    }
  }

  // ============ Helper Functions ============

  /**
   * Get reward rate for a waste type
   */
  async getRewardRate(wasteType: AfricycleWasteStream): Promise<bigint> {
    try {
      const rate = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'rewardRates',
        args: [wasteType]
      });
      
      return rate as bigint;
    } catch (error) {
      console.error('Error getting reward rate:', error);
      throw error;
    }
  }

  /**
   * Get quality multiplier for a waste type and quality grade
   */
  async getQualityMultiplier(
    wasteType: AfricycleWasteStream,
    quality: AfricycleQualityGrade
  ): Promise<bigint> {
    try {
      const multiplier = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'qualityMultipliers',
        args: [wasteType, quality]
      });
      
      return multiplier as bigint;
    } catch (error) {
      console.error('Error getting quality multiplier:', error);
      throw error;
    }
  }

  /**
   * Check if a user is blacklisted
   */
  async isUserBlacklisted(userAddress: Address): Promise<boolean> {
    try {
      const blacklisted = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'isBlacklisted',
        args: [userAddress]
      });
      
      return blacklisted as boolean;
    } catch (error) {
      console.error('Error checking if user is blacklisted:', error);
      throw error;
    }
  }

  /**
   * Check if a user is suspended
   */
  async isUserSuspended(userAddress: Address): Promise<boolean> {
    try {
      const suspended = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'isSuspended',
        args: [userAddress]
      });
      
      return suspended as boolean;
    } catch (error) {
      console.error('Error checking if user is suspended:', error);
      throw error;
    }
  }

  /**
   * Get total processed amount for a waste type
   */
  async getTotalProcessed(wasteType: AfricycleWasteStream): Promise<bigint> {
    try {
      const total = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'totalProcessed',
        args: [wasteType]
      });
      
      return total as bigint;
    } catch (error) {
      console.error('Error getting total processed amount:', error);
      throw error;
    }
  }

  /**
   * Get verification threshold for a waste type
   */
  async getVerificationThreshold(wasteType: AfricycleWasteStream): Promise<bigint> {
    try {
      const threshold = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'verificationThresholds',
        args: [wasteType]
      });
      
      return threshold as bigint;
    } catch (error) {
      console.error('Error getting verification threshold:', error);
      throw error;
    }
  }
}

// Factory function to create a new instance of AfriCycle
export function createAfriCycle(
  contractAddress: Address,
  rpcUrl: string,
  privateKey?: string
): AfriCycle {
  // Create public client with specific chain type
  const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(rpcUrl)
  }) as PublicClient;

  // Create wallet client if private key is provided
  let walletClient: WalletClient<Transport, Chain, Account> | undefined;
  if (privateKey) {
    // Convert private key to account
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain: celoAlfajores,
      transport: http(rpcUrl)
    }) as WalletClient<Transport, Chain, Account>;
  }

  // Create AfriCycle instance with the public client and optional wallet client
  const instance = new AfriCycle(contractAddress, rpcUrl);
  
  // If we have a wallet client, override the default one
  if (walletClient) {
    (instance as any).walletClient = walletClient;
  }

  return instance;
}

// Hook to use AfriCycle in React components
export function useAfriCycle({ contractAddress, rpcUrl }: { contractAddress: Address, rpcUrl: string }): (AfriCycle & { account: Address }) | null {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // Memoize the AfriCycle instance
  const africycle = useMemo(() => {
    if (!isConnected || !address || !walletClient) {
      return null
    }

    try {
      // Create AfriCycle instance
      const instance = new AfriCycle(contractAddress, rpcUrl)
      
      // Return the instance with the account property
      return Object.assign(instance, { account: address })
    } catch (error) {
      console.error('useAfriCycle: Error creating instance:', error)
      return null
    }
  }, [isConnected, address, walletClient, contractAddress, rpcUrl])

  return africycle
}