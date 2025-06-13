# Environment Variables Documentation

This document describes all environment variables required for the Africycle project. The project consists of two main packages: the frontend application (`react-app`) and the smart contract package (`hardhat`).

## Frontend Application (packages/react-app)

Create a `.env` file in the `packages/react-app` directory with the following variables:

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `NEXT_PUBLIC_CELO_RPC_URL` | Celo network RPC URL | `https://alfajores-forno.celo-testnet.org` | Default is Alfajores testnet |
| `NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS` | Deployed smart contract address | `0x1234...` | Must be a valid Ethereum address |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect project ID | `abc123...` | Get from [WalletConnect Cloud](https://cloud.walletconnect.com) |
| `DATABASE_URL` | PostgreSQL database URL | `postgresql://user:pass@localhost:5432/africycle` | Used by Prisma |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` | Get from Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | `your-upload-preset` | Get from Cloudinary dashboard |
| `CLOUDINARY_URL` | Full Cloudinary URL | `cloudinary://key:secret@cloud-name` | Get from Cloudinary dashboard |

### Optional Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `NODE_ENV` | Environment mode | `development` | Set to `production` in production |
| `DEBUG` | Enable debug logging | `false` | Set to `true` to enable debug logs |
| `NEXT_PUBLIC_MAPBOX_API_KEY` | Mapbox API key | - | Required if using Mapbox maps |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | - | Required if using Google Maps |

## Smart Contract Package (packages/hardhat)

Create a `.env` file in the `packages/hardhat` directory with the following variables:

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `PRIVATE_KEY` | Deployer account private key | `abc123...` | Without 0x prefix |
| `CELOSCAN_API_KEY` | CeloScan API key | `abc123...` | Get from [CeloScan](https://celoscan.io) |

### Optional Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `ALFAJORES_RPC_URL` | Alfajores testnet RPC URL | `https://alfajores-forno.celo-testnet.org` | Override default RPC URL |
| `CELO_RPC_URL` | Celo mainnet RPC URL | `https://forno.celo.org` | Override default RPC URL |
| `REPORT_GAS` | Enable gas reporting | `false` | Set to `true` to enable gas reports |
| `VERIFY_CONTRACTS` | Enable contract verification | `false` | Set to `true` to verify contracts |
| `PARALLEL_TESTS` | Run tests in parallel | `false` | Set to `true` to enable parallel testing |
| `COVERAGE_REPORT` | Generate coverage reports | `false` | Set to `true` to generate coverage reports |

## Security Notes

1. **Never commit `.env` files to version control**
   - Use `.env.example` files as templates
   - Add `.env` to `.gitignore`
   - Keep your private keys and API keys secure

2. **Production Environment**
   - Use different values for production
   - Consider using a secrets management service
   - Rotate keys and credentials regularly

3. **API Keys and Credentials**
   - Store sensitive keys in a secure vault
   - Use different keys for development and production
   - Monitor API key usage and set up alerts

## Setting Up Development Environment

1. Copy the example files:
   ```bash
   # For frontend
   cp packages/react-app/.env.example packages/react-app/.env
   
   # For smart contracts
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```

2. Fill in the required variables in each `.env` file

3. Verify the setup:
   ```bash
   # Test frontend
   yarn workspace @africycle/react-app dev
   
   # Test smart contracts
   yarn workspace @africycle/hardhat compile
   ```

## Troubleshooting

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server is running
   - Ensure database user has correct permissions

2. **Contract Deployment Issues**
   - Verify PRIVATE_KEY is correct
   - Check account has sufficient funds
   - Ensure network RPC URL is accessible

3. **Frontend Issues**
   - Verify all NEXT_PUBLIC_ variables are set
   - Check browser console for errors
   - Ensure contract address is correct

## Additional Resources

- [Celo Documentation](https://docs.celo.org)
- [WalletConnect Documentation](https://docs.walletconnect.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Prisma Documentation](https://www.prisma.io/docs) 