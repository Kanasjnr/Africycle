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
import { celo } from 'viem/chains';
// Import ABI directly from JSON file
import afriCycleAbi from '@/ABI/Africycle.json';
import { useAccount, useWalletClient } from 'wagmi';
import { useMemo } from 'react'
import { withDivviTracking } from '../lib/divvi'

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
  collectorReputationScore: bigint;
  collectedByType: [bigint, bigint, bigint, bigint];
  // Collection point stats
  totalInventory: bigint;
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
    cUSDTokenAddress: Address = '0x765DE816845861e75A25fCA122bb6898B8B1282a' // Mainnet cUSD
  ) {
    if (!contractAddress) throw new Error('Contract address is required')
    if (!rpcUrl) throw new Error('RPC URL is required')

    this.contractAddress = contractAddress
    this.cUSDTokenAddress = cUSDTokenAddress
    this.publicClient = createPublicClient({
      chain: celo,
      transport: http(rpcUrl)
    }) as PublicClient

    // Only create wallet client if window.ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.walletClient = createWalletClient({
        chain: celo,
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
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollector',
        args: [name, location, contactInfo],
        account
      });
      return withDivviTracking(simulateFn);
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
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }
      
      // Create a simple simulation function
      const simulateFn = () => {
        return this.publicClient.simulateContract({
          address: this.contractAddress,
          abi: afriCycleAbi,
          functionName: 'registerCollectionPoint',
          args: [name, location, contactInfo],
          account
        });
      };

      // Pass the simulation function to withDivviTracking
      return withDivviTracking(simulateFn);
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
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerRecycler',
        args: [name, location, contactInfo],
        account
      });
      return withDivviTracking(simulateFn);
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
      if (!account || !name || !location || !contactInfo) {
        throw new Error('All registration parameters are required');
      }
      const simulateFn = () => this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCorporate',
        args: [name, location, contactInfo],
        account
      });
      return withDivviTracking(simulateFn);
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
    imageHash: string
  ): Promise<Hash> {
    try {
      console.log('Debug: Starting createCollection with params:', {
        account,
        wasteType,
        weight,
        location,
        imageHash
      });

      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      
      // First check if the user is a collector using hasRole
      console.log('Debug: Checking if user has collector role...');
      const COLLECTOR_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000001'; // Default role ID for collector
      const hasCollectorRole = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'hasRole',
        args: [COLLECTOR_ROLE, account]
      });
      console.log('Debug: hasCollectorRole result:', hasCollectorRole);

      if (!hasCollectorRole) {
        throw new Error('You are not registered as a collector. Please complete your registration first.');
      }

      // Check if contract is paused
      console.log('Debug: Checking if contract is paused...');
      const isPaused = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'paused'
      });
      console.log('Debug: isPaused result:', isPaused);

      if (isPaused) {
        throw new Error('The contract is currently paused. Please try again later.');
      }

      // Validate input parameters
      if (!location.trim()) {
        throw new Error('Please provide a valid location.');
      }

      if (!imageHash.trim()) {
        throw new Error('Please upload a verification image.');
      }

      if (weightBigInt <= BigInt(0)) {
        throw new Error('Weight must be greater than 0.');
      }

      console.log('Debug: Simulating contract call...');
      try {
        const { request } = await this.publicClient.simulateContract({
          address: this.contractAddress,
          abi: afriCycleAbi,
          functionName: 'createCollection',
          args: [wasteType, weightBigInt, location, imageHash],
          account
        });
        console.log('Debug: Contract simulation successful, sending transaction...');
        return this.walletClient.writeContract(request);
      } catch (simError) {
        console.error('Debug: Contract simulation error:', simError);
        if (simError instanceof Error) {
          // Log the full error message
          console.error('Debug: Full simulation error message:', simError.message);
          // Try to extract the revert reason
          const revertMatch = simError.message.match(/execution reverted: "([^"]+)"/);
          if (revertMatch) {
            console.error('Debug: Extracted revert reason:', revertMatch[1]);
          }
        }
        throw simError;
      }
    } catch (error) {
      console.error('Debug: Error in createCollection:', error);
      
      if (error instanceof Error) {
        // Check for common simulation errors
        if (error.message.includes('insufficient funds')) {
          throw new Error('You do not have enough CELO to pay for the transaction gas fees.');
        }
        if (error.message.includes('execution reverted')) {
          // Try to extract the revert reason
          const revertReason = error.message.match(/execution reverted: "([^"]+)"/)?.[1];
          console.error('Debug: Contract revert reason:', revertReason);
          if (revertReason) {
            const errorMessages: { [key: string]: string } = {
              'TransferFailed': 'The contract does not have enough cUSD tokens to distribute rewards. Please contact support.',
              'Not collector': 'You are not registered as a collector. Please complete your registration first.',
              'Invalid location': 'Please provide a valid location for the collection.',
              'Invalid image hash': 'Please upload a verification image for the collection.',
              'Weight must be positive': 'Please enter a valid weight greater than 0.',
              'Weight exceeds maximum': 'The weight exceeds the maximum allowed limit.',
              'Invalid waste type': 'Please select a valid waste type.',
              'Contract is paused': 'The contract is currently paused. Please try again later.'
            };
            const errorMessage = errorMessages[revertReason] || 
              `Failed to create collection: ${revertReason}. Please try again or contact support if the issue persists.`;
            console.error('Debug: Mapped error message:', errorMessage);
            throw new Error(errorMessage);
          }
        }
      }
      // For any other errors, throw a generic message
      throw new Error('Failed to create collection. Please try again or contact support if the issue persists.');
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
    imageHash: string
  ): Promise<Hash> {
    try {
      const collectionIdBigInt = typeof collectionId === 'number' ? BigInt(collectionId) : collectionId;
      const weightBigInt = typeof weight === 'number' ? BigInt(weight) : weight;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateCollection',
        args: [collectionIdBigInt, weightBigInt, location, '', imageHash], // Empty string for qrCode parameter
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
    outputQuality: AfricycleQualityGrade
  ): Promise<Hash> {
    try {
      const batchIdBigInt = typeof batchId === 'number' ? BigInt(batchId) : batchId;
      const outputAmountBigInt = typeof outputAmount === 'number' ? BigInt(outputAmount) : outputAmount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'completeProcessing',
        args: [batchIdBigInt, outputAmountBigInt, outputQuality],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error completing processing:', error);
      throw error;
    }
  }

  /**
   * Calculate carbon offset
   */
  async calculateCarbonOffset(
    wasteType: AfricycleWasteStream,
    amount: number | bigint,
    quality: AfricycleQualityGrade
  ): Promise<bigint> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      
      const carbonOffset = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'calculateCarbonOffset',
        args: [wasteType, amountBigInt, quality]
      });
      
      return carbonOffset as bigint;
    } catch (error) {
      console.error('Error calculating carbon offset:', error);
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
    description: string
  ): Promise<Hash> {
    try {
      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const pricePerUnitBigInt = typeof pricePerUnit === 'number' ? BigInt(pricePerUnit) : pricePerUnit;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'createListing',
        args: [wasteType, amountBigInt, pricePerUnitBigInt, quality, description, BigInt(0)], // Carbon credits set to 0
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

  /**
   * Transfer an impact credit
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

  // ============ Stats Functions ============

  /**
   * Get global stats
   */
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

  // ============ Collection Point Functions ============

  /**
   * Register a collector at a collection point
   */
  async registerCollectorAtPoint(
    account: Address,
    collector: Address
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'registerCollectorAtPoint',
        args: [collector],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error registering collector at point:', error);
      throw error;
    }
  }

  /**
   * Remove a collector from a collection point
   */
  async removeCollectorFromPoint(
    account: Address,
    collector: Address
  ): Promise<Hash> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'removeCollectorFromPoint',
        args: [collector],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error removing collector from point:', error);
      throw error;
    }
  }

  /**
   * Update collection point inventory
   */
  async updateCollectionPointInventory(
    account: Address,
    wasteType: AfricycleWasteStream,
    newAmount: number | bigint
  ): Promise<Hash> {
    try {
      const newAmountBigInt = typeof newAmount === 'number' ? BigInt(newAmount) : newAmount;
      
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: afriCycleAbi,
        functionName: 'updateCollectionPointInventory',
        args: [wasteType, newAmountBigInt],
        account
      });

      return this.walletClient.writeContract(request);
    } catch (error) {
      console.error('Error updating collection point inventory:', error);
      throw error;
    }
  }
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