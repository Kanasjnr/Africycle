// Email service for sending notifications via Netlify Functions
export class EmailService {
  private static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://africycle.xyz/.netlify/functions' 
    : 'http://localhost:8888/.netlify/functions';
  
  // Site URL for email links (safe to expose in frontend)
  private static readonly SITE_URL = 'https://africycle.xyz';

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(userData: {
    userType: 'collector' | 'recycler';
    userName: string;
    userEmail: string;
    walletAddress: string;
  }) {
    console.log('📧 [EmailService] Sending welcome email...', {
      userType: userData.userType,
      userName: userData.userName,
      userEmail: userData.userEmail,
      walletAddress: userData.walletAddress,
      endpoint: `${this.BASE_URL}/send-welcome-email`
    });

    try {
      const response = await fetch(`${this.BASE_URL}/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📧 [EmailService] Welcome email response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 [EmailService] Welcome email failed:', errorText);
        throw new Error(`Failed to send welcome email: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [EmailService] Welcome email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [EmailService] Error sending welcome email:', error);
      // Don't throw error to prevent breaking the main flow
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send collection request notification to recycler
   */
  static async sendCollectionRequest(collectionData: {
    recyclerEmail: string;
    collectionId: string;
    wasteType: string;
    weight: number;
    location: string;
    pickupTime: number;
    collectorName: string;
    collectorAddress: string;
    collectorContact?: string;
    imageHash?: string;
  }) {
    console.log('📧 [EmailService] Sending collection request email...', {
      recyclerEmail: collectionData.recyclerEmail,
      collectionId: collectionData.collectionId,
      wasteType: collectionData.wasteType,
      weight: collectionData.weight,
      location: collectionData.location,
      endpoint: `${this.BASE_URL}/send-collection-request`
    });

    try {
      const response = await fetch(`${this.BASE_URL}/send-collection-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      console.log('📧 [EmailService] Collection request response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 [EmailService] Collection request failed:', errorText);
        throw new Error(`Failed to send collection request: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [EmailService] Collection request email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [EmailService] Error sending collection request email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send collection confirmed notification to collector
   */
  static async sendCollectionConfirmed(collectionData: {
    collectorEmail: string;
    collectionId: string;
    wasteType: string;
    weight: number;
    pickupTime: number;
    recyclerName: string;
    recyclerContact?: string;
    recyclerAddress?: string;
    estimatedEarnings?: number;
  }) {
    console.log('✅ [EmailService] Sending collection confirmed email...', {
      collectorEmail: collectionData.collectorEmail,
      collectionId: collectionData.collectionId,
      wasteType: collectionData.wasteType,
      weight: collectionData.weight,
      recyclerName: collectionData.recyclerName,
      estimatedEarnings: collectionData.estimatedEarnings,
      endpoint: `${this.BASE_URL}/send-collection-confirmed`
    });

    try {
      const response = await fetch(`${this.BASE_URL}/send-collection-confirmed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      console.log('✅ [EmailService] Collection confirmed response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('✅ [EmailService] Collection confirmed failed:', errorText);
        throw new Error(`Failed to send collection confirmed email: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [EmailService] Collection confirmed email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [EmailService] Error sending collection confirmed email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send collection rejected notification to collector
   */
  static async sendCollectionRejected(collectionData: {
    collectorEmail: string;
    collectionId: string;
    wasteType: string;
    weight: number;
    pickupTime: number;
    rejectionReason: string;
  }) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-collection-rejected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to send collection rejected email: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Collection rejected email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending collection rejected email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send payment received notification to collector
   */
  static async sendPaymentReceived(paymentData: {
    collectorEmail: string;
    collectionId: string;
    wasteType: string;
    weight: number;
    amount: number;
    ratePerKg: number;
    qualityGrade?: string;
    transactionHash?: string;
    totalCollections?: number;
    totalEarnings?: number;
    carbonOffset?: number;
  }) {
    console.log('💰 [EmailService] Sending payment received email...', {
      collectorEmail: paymentData.collectorEmail,
      collectionId: paymentData.collectionId,
      wasteType: paymentData.wasteType,
      weight: paymentData.weight,
      amount: paymentData.amount,
      ratePerKg: paymentData.ratePerKg,
      qualityGrade: paymentData.qualityGrade,
      endpoint: `${this.BASE_URL}/send-payment-received`
    });

    try {
      const response = await fetch(`${this.BASE_URL}/send-payment-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('💰 [EmailService] Payment received response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('💰 [EmailService] Payment received failed:', errorText);
        throw new Error(`Failed to send payment received email: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [EmailService] Payment received email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [EmailService] Error sending payment received email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Helper method to get user email from blockchain profile
   */
  static extractEmailFromContactInfo(contactInfo: string): string | null {
    // Try to extract email from contact info string
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
    const match = contactInfo.match(emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Helper method to get waste type number from enum
   */
  static getWasteTypeNumber(wasteType: any): string {
    if (typeof wasteType === 'number') {
      return wasteType.toString();
    }
    
    // Convert enum to number
    const wasteTypeMap: { [key: string]: string } = {
      'PLASTIC': '0',
      'EWASTE': '1',
      'METAL': '2',
      'GENERAL': '3',
    };
    
    return wasteTypeMap[wasteType] || '0';
  }
} 