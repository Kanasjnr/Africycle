# Docker Setup for Africycle 🐳

This directory contains Docker configuration files for the Africycle platform, providing a complete containerized development and production environment.

## 📁 Structure

```
docker/
├── nginx/
│   ├── nginx.conf          # Development Nginx configuration
│   ├── nginx.prod.conf     # Production Nginx configuration
│   ├── ssl/               # SSL certificates directory
│   └── logs/              # Nginx logs directory
├── prometheus/
│   └── prometheus.yml     # Prometheus monitoring configuration
└── README.md              # This documentation
```

## 🚀 Quick Start

### Development Environment

1. **Copy environment template:**
   ```bash
   cp docker.env.example .env
   ```

2. **Edit environment variables:**
   ```bash
   nano .env
   ```

3. **Start development environment:**
   ```bash
   ./scripts/docker-setup.sh start
   ```

4. **Access services:**
   - Frontend: http://localhost:3000
   - Hardhat RPC: http://localhost:8545
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Production Environment

1. **Set up production environment:**
   ```bash
   # Copy and configure production environment
   cp docker.env.example .env.production
   
   # Edit production values
   nano .env.production
   ```

2. **Start production services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

## 🛠️ Services

### Frontend (React/Next.js)
- **Port**: 3000
- **Purpose**: Main web application
- **Health Check**: `/health` endpoint
- **Environment**: Development/Production builds

### Hardhat Blockchain Node
- **Port**: 8545
- **Purpose**: Local blockchain for development
- **RPC**: JSON-RPC endpoint for blockchain interactions
- **Network**: Celo-compatible test network

### PostgreSQL Database
- **Port**: 5432
- **Purpose**: Application data storage
- **Database**: `africycle`
- **User**: `africycle`
- **Features**: Auto-initialized with schema

### Redis Cache
- **Port**: 6379
- **Purpose**: Session storage and caching
- **Configuration**: Default Redis setup

### Nginx Reverse Proxy
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Load balancing, SSL termination, rate limiting
- **Features**: 
  - Rate limiting (API: 5-10 req/s, General: 20-30 req/s)
  - SSL/TLS termination
  - Static file caching
  - Security headers

## 🔧 Configuration

### Environment Variables

#### Required Variables
```bash
# Blockchain Configuration
NEXT_PUBLIC_CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

# Database Configuration
POSTGRES_DB=africycle
POSTGRES_USER=africycle
POSTGRES_PASSWORD=your_secure_password

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

#### Optional Variables
```bash
# Development
NODE_ENV=development
WATCHPACK_POLLING=true
DEBUG=false

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

### SSL Configuration

For production, place SSL certificates in `docker/nginx/ssl/`:
```bash
docker/nginx/ssl/
├── cert.pem    # SSL certificate
└── key.pem     # Private key
```

For development, self-signed certificates are auto-generated.

## 📊 Monitoring

### Prometheus Metrics
- **URL**: http://localhost:9090
- **Targets**: All services are monitored
- **Metrics**: Performance, availability, resource usage

### Grafana Dashboard
- **URL**: http://localhost:3001
- **Login**: admin/admin
- **Features**: Custom dashboards for Africycle metrics

### Service Health Checks
```bash
# Check all services
./scripts/docker-setup.sh logs

# Check specific service
./scripts/docker-setup.sh logs frontend
```

## 🔐 Security Features

### Nginx Security
- **Rate Limiting**: API and general endpoints
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **SSL/TLS**: Modern cipher suites
- **Request Size Limits**: 50MB max body size

### Database Security
- **User Isolation**: Dedicated database user
- **Network Security**: Internal network only
- **Backup Ready**: Volume persistence

### Container Security
- **Non-root Users**: All services run as non-root
- **Resource Limits**: Memory and CPU constraints
- **Network Isolation**: Custom bridge network

## 🛠️ Development Commands

### Docker Setup Script
```bash
# Start all services
./scripts/docker-setup.sh start

# Stop all services
./scripts/docker-setup.sh stop

# Restart services
./scripts/docker-setup.sh restart

# View logs
./scripts/docker-setup.sh logs [service]

# Clean up everything
./scripts/docker-setup.sh cleanup
```

### Manual Docker Commands
```bash
# Build and start development
docker-compose up --build -d

# Start production with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service]

# Execute commands in containers
docker-compose exec frontend npm run test
docker-compose exec postgres psql -U africycle -d africycle
docker-compose exec hardhat npx hardhat compile
```

## 🔄 Multi-Stage Builds

### Frontend Dockerfile Stages
1. **base**: Common Node.js setup
2. **development**: Development with hot reload
3. **builder**: Production build process
4. **production**: Optimized production image

### Build Targets
```bash
# Development build
docker build --target development -t africycle-frontend:dev packages/react-app

# Production build
docker build --target production -t africycle-frontend:prod packages/react-app
```

## 🗄️ Data Persistence

### Volumes
- **postgres_data**: Database files
- **redis_data**: Redis persistence
- **prometheus_data**: Metrics history
- **grafana_data**: Dashboard configurations

### Backup Strategy
```bash
# Backup database
docker-compose exec postgres pg_dump -U africycle africycle > backup.sql

# Restore database
docker-compose exec -T postgres psql -U africycle africycle < backup.sql
```

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs [service]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service]
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U africycle

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Network Issues
```bash
# Inspect network
docker network inspect africycle_africycle-network

# Test connectivity
docker-compose exec frontend ping postgres
```

### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change external port
```

## 📈 Performance Optimization

### Production Optimizations
- **Multi-stage builds**: Smaller images
- **Nginx caching**: Static file optimization
- **Database tuning**: PostgreSQL configuration
- **Resource limits**: Prevent resource exhaustion

### Development Optimizations
- **Volume mounts**: Fast code changes
- **Hot reload**: Instant feedback
- **Parallel builds**: Faster startup

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker-compose -f docker-compose.prod.yml build
      - name: Run tests
        run: |
          docker-compose -f docker-compose.yml run --rm frontend npm test
```

## 📞 Support

For Docker-related issues:
1. Check logs: `./scripts/docker-setup.sh logs`
2. Verify configuration: Check `.env` file
3. Clean restart: `./scripts/docker-setup.sh cleanup && ./scripts/docker-setup.sh start`
4. Check resource usage: `docker stats`

---

This Docker setup provides a robust, scalable, and secure environment for developing and deploying the Africycle platform. The configuration is optimized for both development velocity and production stability. 