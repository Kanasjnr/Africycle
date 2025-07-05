// Email service for sending notifications via Netlify Functions
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://africycle.xyz/.netlify/functions' 
  : 'http://localhost:8888/.netlify/functions';

const SITE_URL = 'https://africycle.xyz';

export const sendWelcomeEmail = async (userData: any) => {
  console.log('📧 [EmailService] Sending welcome email...', userData);
  
  try {
    const response = await fetch(`${BASE_URL}/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userType: userData.userType,
        userName: userData.userName,
        userEmail: userData.userEmail,
        walletAddress: userData.walletAddress,
        dashboardUrl: `${SITE_URL}/dashboard/${userData.userType}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📧 [EmailService] Welcome email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EmailService] Error sending welcome email:', error);
    throw error;
  }
};

export const sendCollectionRequest = async (collectionData: any) => {
  console.log('📧 [EmailService] Sending collection request email...', collectionData);
  
  try {
    const response = await fetch(`${BASE_URL}/send-collection-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...collectionData,
        dashboardUrl: `${SITE_URL}/dashboard/recycler`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📧 [EmailService] Collection request email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EmailService] Error sending collection request email:', error);
    throw error;
  }
};

export const sendCollectionConfirmed = async (collectionData: any) => {
  console.log('📧 [EmailService] Sending collection confirmed email...', collectionData);
  
  try {
    const response = await fetch(`${BASE_URL}/send-collection-confirmed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...collectionData,
        dashboardUrl: `${SITE_URL}/dashboard/collector`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📧 [EmailService] Collection confirmed email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EmailService] Error sending collection confirmed email:', error);
    throw error;
  }
};

export const sendCollectionRejected = async (collectionData: any) => {
  console.log('📧 [EmailService] Sending collection rejected email...', collectionData);
  
  try {
    const response = await fetch(`${BASE_URL}/send-collection-rejected`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...collectionData,
        dashboardUrl: `${SITE_URL}/dashboard/collector`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📧 [EmailService] Collection rejected email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EmailService] Error sending collection rejected email:', error);
    throw error;
  }
};

export const sendPaymentReceived = async (paymentData: any) => {
  console.log('📧 [EmailService] Sending payment received email...', paymentData);
  
  try {
    const response = await fetch(`${BASE_URL}/send-payment-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...paymentData,
        dashboardUrl: `${SITE_URL}/dashboard/collector`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📧 [EmailService] Payment received email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EmailService] Error sending payment received email:', error);
    throw error;
  }
};

const extractEmailFromContactInfo = (contactInfo: string): string | null => {
  if (!contactInfo) return null;
  
  // Simple email regex pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = contactInfo.match(emailRegex);
  
  return match ? match[0] : null;
};

const getWasteTypeNumber = (wasteType: any): number => {
  // Convert AfricycleWasteStream enum to number
  return typeof wasteType === 'number' ? wasteType : Number(wasteType) || 0;
};

// For backward compatibility with existing code that uses EmailService class
export const EmailService = {
  sendWelcomeEmail,
  sendCollectionRequest,
  sendCollectionConfirmed,
  sendCollectionRejected,
  sendPaymentReceived,
  extractEmailFromContactInfo,
  getWasteTypeNumber
}; 