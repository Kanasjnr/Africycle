# AfriCycle: A Multi-Stream ReFi Waste Management Ecosystem

> 🚀 **Now Live on Celo Mainnet - Currently in Beta Testing Phase** 🚀
> 
> 📜 **Verified Smart Contract**: [View on CeloScan](https://celoscan.io/address/0xd8F399393958F5f29811b5786104cF90EfBeda41#code)

## 🌍 Overview
AfriCycle is a blockchain-powered circular economy platform that addresses Africa's waste management crisis across three key waste streams: **plastic**, **electronic waste (e-waste)**, and **metal/general waste**. The platform incentivizes waste collection through **tokenized rewards**, enables **transparent recycling processes**, and promotes **corporate sustainability** through verified **recycling credits**.

### 🎯 Current Status
- **Live on Celo Mainnet** 🟢
- **Beta Testing Phase** 🔄
- **Open for Early Adopters** 👥
- **Active Collection Points**: Multiple locations across Africa
- **Corporate Partnerships**: Growing network of sustainability-focused organizations
- **Verified Smart Contract**: [0xd8F399393958F5f29811b5786104cF90EfBeda41](https://celoscan.io/address/0xd8F399393958F5f29811b5786104cF90EfBeda41#code)

## 🔄 System Workflow
```mermaid
graph TD
    %% Roles
    Collector[Waste Collector]
    CollectionPoint[Collection Point]
    Recycler[Recycler]
    Corporate[Corporate Partner]
    
    %% Collection Process
    Collector -->|Delivers Waste| CollectionPoint
    CollectionPoint -->|Verifies & Weighs| CollectionPoint
    CollectionPoint -->|Transfers cUSD| Collector
    
    %% Recycling Process
    CollectionPoint -->|Sends Waste| Recycler
    Recycler -->|Processes Waste| Recycler
    Recycler -->|Creates NFT| RecyclingCertificate[Recycling Certificate]
    
    %% Corporate Partnership
    Corporate -->|Purchases Credits| Recycler
    Recycler -->|Transfers cUSD| Corporate
    Corporate -->|Tracks Impact| ImpactDashboard[Impact Dashboard]
    
    %% Styling
    style Collector fill:#4CAF50,stroke:#333,stroke-width:2px,color:white
    style CollectionPoint fill:#2196F3,stroke:#333,stroke-width:2px,color:white
    style Recycler fill:#FF9800,stroke:#333,stroke-width:2px,color:white
    style Corporate fill:#9C27B0,stroke:#333,stroke-width:2px,color:white
    style RecyclingCertificate fill:#F44336,stroke:#333,stroke-width:2px,color:white
    style ImpactDashboard fill:#607D8B,stroke:#333,stroke-width:2px,color:white
```

### Role-Based Workflow Description

1. **Waste Collector**
   - Delivers waste to collection points
   - Receives cUSD payments based on waste weight and type
   - Can track earnings through their wallet

2. **Collection Point**
   - Verifies and weighs incoming waste
   - Processes cUSD payments to collectors
   - Coordinates waste transfer to recyclers
   - Maintains quality standards

3. **Recycler**
   - Receives waste from collection points
   - Processes waste into recyclable materials
   - Creates NFTs for verified recycling
   - Sells recycling credits to corporate partners
   - Receives cUSD payments for credits

4. **Corporate Partner**
   - Purchases recycling credits using cUSD
   - Tracks environmental impact
   - Monitors sustainability goals
   - Accesses impact dashboard for reporting

### Key Interactions
- All financial transactions use cUSD
- NFTs represent verified recycling certificates
- Smart contracts automate payments and verification
- Impact tracking is transparent and immutable

## 🚀 Features
### ♻️ Multi-Stream Waste Collection
- **Plastic Waste**: QR-code-based verification and weight-based tracking.
- **E-Waste**: Detailed documentation of valuable components such as CPUs, batteries, and PCBs.
- **Metal & General Waste**: Categorization, weight-based verification, and quality assessment.
- **Real-time Tracking**: Live monitoring of waste collection and processing
- **Quality Assurance**: Automated verification of waste categories and conditions

### 🔗 Blockchain-Based Verification
- **Decentralized authentication** of waste collection.
- **Immutable record-keeping** for recycling activities.
- **Transparent supply chain management**.
- **Smart Contract Automation**: Automated payments and verification processes
- **Audit Trail**: Complete history of all waste transactions

### 🎁 Tokenized Incentive System
- **Direct cryptocurrency payments** to collectors.
- **Tokenized environmental impact credits**.
- **Governance tokens** for platform participation.
- **Dynamic Pricing**: Market-based compensation for different waste types
- **Loyalty Rewards**: Additional incentives for consistent collectors

### 🏪 Marketplace Ecosystem
- **Trading platform for recycled materials**.
- **Carbon/waste offset marketplace** for corporations.
- **Impact investment opportunities**.
- **Corporate Sustainability Credits**: Verified environmental impact tokens
- **Material Exchange**: Direct trading of processed recyclables

## 🏗 Technical Architecture
### 🛠 Blockchain Infrastructure
AfriCycle is built on the **Celo blockchain** for:
- **Mobile-first design** (lightweight clients for low-end devices)
- **Low transaction costs** (gas fees <$0.001 per transaction)
- **Sustainable consensus** (Proof-of-Stake validation, carbon-negative infrastructure)

### 🌐 Frontend Application
- **Next.js 14** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **Recharts** for data visualization
- **Progressive Web App (PWA)** capabilities
- **Responsive design** for mobile and desktop access

### 🖥 Backend Infrastructure
- **Hardhat** for smart contract development and testing
- **TypeScript** for contract development
- **OpenZeppelin** for secure contract implementations
- **IPFS** for decentralized media storage
- **Ceramic Network** for decentralized identity

### 📦 Blockchain Integration
- **ContractKit** for Celo-specific features
- **Web3.js/Ethers.js** for smart contract interactions
- **Metamask and Valora wallet integrations**
- **Hardhat Network** for local development

## 🛠 Tech Stack
- **Blockchain**: Celo
- **Smart Contracts**: Solidity, Hardhat, TypeScript
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Development**: Yarn Workspaces, ESLint, Prettier
- **Testing**: Mocha, Chai
- **Storage**: IPFS, Ceramic Network

## 🚀 Getting Started
### 📥 Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22 or higher)
- [Metamask](https://metamask.io/) or [Valora](https://valoraapp.com/)
- [Git](https://git-scm.com/)

### 🌐 Accessing the Platform
1. **Connect Your Wallet**
   - Install [Valora](https://valoraapp.com/) or [Metamask](https://metamask.io/)
   - Add Celo Mainnet to your wallet
   - Ensure you have some cUSD for transactions

2. **Join Beta Testing**
   - Join [Here](https://forms.gle/rRX8tS6yeSftxtpv5)
   - Complete the registration process
   - Verify your identity (KYC process)
   - Start participating in waste collection

3. **For Collection Points**
   - Apply through the platform
   - Complete verification process
   - Set up your collection point
   - Start accepting waste

4. **For Recyclers**
   - Submit business documentation
   - Complete facility verification
   - Set up processing capabilities
   - Begin accepting waste from collection points

5. **For Corporate Partners**
   - Register your organization
   - Complete sustainability assessment
   - Set up credit purchase system
   - Start tracking impact

### 📌 Installation
```bash
# Clone the repository
git clone https://github.com/your-org/africycle.git

# Navigate into the project directory
cd africycle

# Install dependencies
yarn install

# Set up environment variables
cp packages/react-app/.env.template packages/react-app/.env
```

### 🛠 Development
```bash
# Start the local blockchain
yarn hardhat:run:node

# In a new terminal, deploy contracts
yarn hardhat:compile
yarn hardhat:build

# Start the frontend development server
yarn react-app:dev
```

### 🧪 Testing
```bash
# Run smart contract tests
yarn hardhat:test

# Run frontend tests
yarn react-app:test
```

### 🏗 Project Structure
```
africycle/
├── packages/
│   ├── react-app/          # Next.js frontend application
│   │   ├── app/           # App router pages and layouts
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and configurations
│   │   ├── providers/    # React context providers
│   │   └── styles/       # Global styles and Tailwind config
│   │
│   └── hardhat/          # Smart contract development
│       ├── contracts/    # Solidity smart contracts
│       ├── scripts/      # Deployment and utility scripts
│       └── test/         # Contract tests
│
└── package.json          # Root package.json for workspace management
```

## 🧑‍💻 Contributing
We welcome contributions! Follow these steps:
1. **Fork the repository**.
2. **Create a new branch**: `git checkout -b feature-branch`.
3. **Commit changes**: `git commit -m 'Add new feature'`.
4. **Push changes**: `git push origin feature-branch`.
5. **Open a Pull Request**.

## 📝 License
This project is licensed under the **MIT License**.

## 📞 Contact & Support
- **Twitter**: [@AfriCycle](https://twitter.com/africycle)
- **Email**: aficycle0@gmail.com
- **Telegram**: [Join our community](https://t.me/+aCZcunVKdkw2NDc0)
- **Documentation**: [White paper ](https://africycle.hashnode.space/default-guide/africycle)
- **Support Hours**: 24/7 automated support with human assistance during business hours

## 🔒 Security
- Regular security updates and patches
- Bug bounty program for security researchers

## 📈 Roadmap
- Q2 2025: Current Phase - Beta testing and community building
- Q3 2025: Expansion to additional African regions
- Q4 2025: Launch of advanced features and partnerships
- Q1 2026: Global expansion and ecosystem growth
- Q2 2026: Integration with international waste management networks and advanced sustainability features

## 📊 Beta Testing Metrics
- **Active Users**: Growing community of waste collectors
- **Collection Points**: Multiple verified locations
- **Waste Processed**: Real-time tracking available on dashboard
- **Environmental Impact**: Transparent impact metrics
- **Transaction Volume**: Live on-chain data

## 🤝 Join the Beta
We're actively seeking:
- Waste Collectors
- Collection Point Operators
- Recyclers
- Corporate Partners
- Environmental Impact Investors

To participate in our beta testing program:
1. Fill out our [Beta Testing Application Form](https://forms.gle/rRX8tS6yeSftxtpv5)
2. Join our [Telegram Community](https://t.me/+aCZcunVKdkw2NDc0) for updates and support
3. Wait for our team to review your application
4. Once approved, you'll receive instructions to access the platform

For any questions about the beta program, please contact us at aficycle0@gmail.com
