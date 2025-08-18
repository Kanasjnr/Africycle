import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'v2rwHYcrH-P2277Fc',
  SERVICE_ID: 'service_3lx0kjo',
  TEMPLATES: {
    WELCOME: 'template_1ipdwhc', // Welcome template
    PAYMENT: 'template_hnkwowo', // Payment template
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

export interface WelcomeEmailData {
  userType: 'collector' | 'recycler';
  userName: string;
  userEmail: string;
  walletAddress: string;
}

export interface PaymentEmailData {
  amount: string;
  wasteType: string;
  collectionId: string;
  weight: string;
  userEmail: string;
  transactionHash?: string;
}

export interface CollectionEmailData {
  collectionId: string;
  wasteType: string;
  weight: string;
  userEmail: string;
  status: 'request' | 'confirmed' | 'rejected';
  reason?: string;
}

export class EmailService {


  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      // Validate email data
      if (!data.userEmail || !data.userEmail.trim()) {
        console.error('Error: userEmail is empty or invalid:', data.userEmail);
        return false;
      }

      // Pre-format content based on user type
      const isCollector = data.userType === 'collector';
      const roleDisplay = isCollector ? 'Waste Collector' : 'Recycler';
      const roleColor = isCollector ? '#10b981' : '#3b82f6';
      const buttonColor = isCollector ? '#059669' : '#2563eb';
      const communityType = isCollector ? 'collectors' : 'recyclers';
      
      // Simple text content without HTML
      const featuresText = isCollector 
        ? '• Create your first waste collection\n• Upload verification photos\n• Start earning from verified waste\n• Track your environmental impact'
        : '• Manage incoming collection requests\n• Verify and process waste collections\n• Build your recycling business\n• Monitor your processing statistics';
      
      const tipsText = isCollector
        ? '• Take clear, well-lit photos of your waste\n• Separate waste by type for better pricing\n• Choose recyclers with high reputation scores\n• Update your profile to build trust'
        : '• Respond quickly to collection requests\n• Provide clear feedback on waste quality\n• Build relationships with reliable collectors\n• Keep your processing capacity updated';

      const templateParams = {
        user_name: data.userName,
        user_type: data.userType,
        user_email: data.userEmail,
        wallet_address: data.walletAddress,
        to_email: data.userEmail,
        email_type: 'welcome',
        subject: `Welcome to AfriCycle - ${isCollector ? 'Start Earning from Waste Today!' : 'Help Build Africa\'s Circular Economy!'} 🌍`,
        // Simple variables without HTML
        role_display: roleDisplay,
        role_color: roleColor,
        button_color: buttonColor,
        community_type: communityType,
        features_text: featuresText,
        tips_text: tipsText,
      };

      console.log('Sending welcome email with params:', templateParams);

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.WELCOME,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Welcome email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      console.error('Error details:', {
        userEmail: data.userEmail,
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templateId: EMAILJS_CONFIG.TEMPLATES.WELCOME,
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY
      });
      return false;
    }
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentEmail(data: PaymentEmailData): Promise<boolean> {
    try {
      const templateParams = {
        amount: data.amount,
        waste_type: data.wasteType,
        collection_id: data.collectionId,
        weight: data.weight,
        transaction_hash: data.transactionHash || '',
        to_email: data.userEmail,
        email_type: 'payment',
        subject: `💰 Payment Received - ₦${data.amount} for ${data.wasteType}`,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.PAYMENT,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Payment email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending payment email:', error);
      return false;
    }
  }

  /**
   * Send collection status email using the payment template
   */
  static async sendCollectionEmail(data: CollectionEmailData): Promise<boolean> {
    try {
      // Map collection status to email type
      const emailTypeMap = {
        'request': 'collection_request',
        'confirmed': 'collection_confirmed', 
        'rejected': 'collection_rejected'
      };

      const emailType = emailTypeMap[data.status];
      
      // Create subject based on status
      const subjectMap = {
        'request': `📋 New Collection Request - ${data.wasteType} (${data.weight} kg)`,
        'confirmed': `✅ Collection Confirmed - ${data.wasteType} (${data.weight} kg)`,
        'rejected': `❌ Collection Rejected - ${data.wasteType} (${data.weight} kg)`
      };

      const templateParams = {
        collection_id: data.collectionId,
        waste_type: data.wasteType,
        weight: data.weight,
        status: data.status,
        reason: data.reason || '',
        to_email: data.userEmail,
        email_type: emailType,
        subject: subjectMap[data.status],
        // Use amount field for status display instead of actual amount
        amount: data.status === 'confirmed' ? 'Processing' : data.status === 'rejected' ? 'Rejected' : 'Pending',
        // Add additional fields for better template flexibility
        collection_status: data.status,
        collection_type: data.wasteType,
        collection_weight: data.weight,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.PAYMENT,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log(`Collection ${data.status} email sent successfully:`, response);
      return true;
    } catch (error) {
      console.error('Error sending collection email:', error);
      return false;
    }
  }

  /**
   * Test email service connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.WELCOME,
        {
          user_type: 'test',
          user_name: 'Test User',
          user_email: 'test@example.com',
          wallet_address: '0x0000000000000000000000000000000000000000',
          to_email: 'test@example.com',
          email_type: 'test',
          subject: 'Test Email from AfriCycle',
        },
        EMAILJS_CONFIG.PUBLIC_KEY
      );
      
      console.log('Email service test successful:', response);
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}

export default EmailService; 