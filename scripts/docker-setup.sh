#!/bin/bash

# Docker Setup Script for Africycle
# This script helps set up the Docker development environment

set -e

echo "🐳 Setting up Africycle Docker Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp docker.env.example .env
    print_warning "Please edit the .env file with your actual configuration values."
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/logs
mkdir -p docker/prometheus

# Create self-signed SSL certificate for development
if [ ! -f "docker/nginx/ssl/cert.pem" ]; then
    print_status "Creating self-signed SSL certificate for development..."
    openssl req -x509 -newkey rsa:4096 -keyout docker/nginx/ssl/key.pem -out docker/nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Create Prometheus configuration
if [ ! -f "docker/prometheus/prometheus.yml" ]; then
    print_status "Creating Prometheus configuration..."
    cat > docker/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'africycle-frontend'
    static_configs:
      - targets: ['frontend:3000']

  - job_name: 'africycle-hardhat'
    static_configs:
      - targets: ['hardhat:8545']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
fi

# Function to start services
start_services() {
    print_status "Starting Docker services..."
    
    # Build and start services
    docker-compose up --build -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    print_status "Checking service health..."
    
    # Check if frontend is responding
    if curl -s http://localhost:3000/health > /dev/null; then
        print_status "✅ Frontend is running at http://localhost:3000"
    else
        print_warning "⚠️  Frontend health check failed"
    fi
    
    # Check if hardhat node is running
    if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
        print_status "✅ Hardhat node is running at http://localhost:8545"
    else
        print_warning "⚠️  Hardhat node health check failed"
    fi
    
    # Check if PostgreSQL is running
    if docker-compose exec postgres pg_isready -U africycle > /dev/null 2>&1; then
        print_status "✅ PostgreSQL is running"
    else
        print_warning "⚠️  PostgreSQL health check failed"
    fi
    
    print_status "🎉 Docker environment setup complete!"
    print_status "📝 Services available:"
    print_status "   - Frontend: http://localhost:3000"
    print_status "   - Hardhat RPC: http://localhost:8545"
    print_status "   - PostgreSQL: localhost:5432"
    print_status "   - Redis: localhost:6379"
    print_status "   - Nginx (if using production profile): http://localhost:80"
}

# Function to stop services
stop_services() {
    print_status "Stopping Docker services..."
    docker-compose down
    print_status "✅ Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting Docker services..."
    docker-compose restart
    print_status "✅ Services restarted"
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker environment..."
    docker-compose down -v
    docker system prune -f
    print_status "✅ Cleanup complete"
}

# Main menu
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs "$2"
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs [service]|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all Docker services"
        echo "  stop     - Stop all Docker services"
        echo "  restart  - Restart all Docker services"
        echo "  logs     - Show logs for all services or a specific service"
        echo "  cleanup  - Stop services and clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs frontend"
        echo "  $0 stop"
        exit 1
        ;;
esac 