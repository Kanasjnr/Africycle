-- Africycle Database Initialization Script
-- This script sets up the initial database schema for the Africycle platform

-- Create database extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    location VARCHAR(255),
    contact_info TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('collector', 'recycler', 'admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_collected BIGINT DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    reputation_score BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id BIGINT UNIQUE NOT NULL,
    collector_address VARCHAR(42) NOT NULL,
    recycler_address VARCHAR(42) NOT NULL,
    waste_type INTEGER NOT NULL CHECK (waste_type IN (0, 1, 2, 3)), -- PLASTIC, EWASTE, METAL, GENERAL
    weight BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_hash VARCHAR(255) NOT NULL,
    pickup_time TIMESTAMP NOT NULL,
    status INTEGER DEFAULT 0 CHECK (status IN (0, 1, 2, 3, 4, 5, 6)), -- Status enum
    quality_grade INTEGER CHECK (quality_grade IN (0, 1, 2, 3)), -- LOW, MEDIUM, HIGH, PREMIUM
    reward_amount BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collector_address) REFERENCES users(address),
    FOREIGN KEY (recycler_address) REFERENCES users(address)
);

-- Create processing_batches table
CREATE TABLE IF NOT EXISTS processing_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id BIGINT UNIQUE NOT NULL,
    recycler_address VARCHAR(42) NOT NULL,
    waste_type INTEGER NOT NULL CHECK (waste_type IN (0, 1, 2, 3)),
    input_amount BIGINT NOT NULL,
    output_amount BIGINT,
    output_quality INTEGER CHECK (output_quality IN (0, 1, 2, 3)),
    status INTEGER DEFAULT 0 CHECK (status IN (0, 1)), -- PENDING, COMPLETED
    processing_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recycler_address) REFERENCES users(address)
);

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id BIGINT UNIQUE NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    waste_type INTEGER NOT NULL CHECK (waste_type IN (0, 1, 2, 3)),
    amount BIGINT NOT NULL,
    price_per_unit BIGINT NOT NULL,
    quality INTEGER NOT NULL CHECK (quality IN (0, 1, 2, 3)),
    description TEXT,
    status INTEGER DEFAULT 6 CHECK (status IN (0, 1, 2, 3, 4, 5, 6)), -- ACTIVE by default
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_address) REFERENCES users(address)
);

-- Create impact_credits table
CREATE TABLE IF NOT EXISTS impact_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id BIGINT UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    waste_type INTEGER NOT NULL CHECK (waste_type IN (0, 1, 2, 3)),
    amount BIGINT NOT NULL,
    carbon_offset BIGINT NOT NULL,
    certificate_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_address) REFERENCES users(address)
);

-- Create platform_stats table for analytics
CREATE TABLE IF NOT EXISTS platform_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE DEFAULT CURRENT_DATE,
    user_count BIGINT DEFAULT 0,
    collection_count BIGINT DEFAULT 0,
    processed_count BIGINT DEFAULT 0,
    listing_count BIGINT DEFAULT 0,
    credit_count BIGINT DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    waste_collected_plastic BIGINT DEFAULT 0,
    waste_collected_ewaste BIGINT DEFAULT 0,
    waste_collected_metal BIGINT DEFAULT 0,
    waste_collected_general BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_collections_collector ON collections(collector_address);
CREATE INDEX IF NOT EXISTS idx_collections_recycler ON collections(recycler_address);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_waste_type ON collections(waste_type);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_batches_recycler ON processing_batches(recycler_address);
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_waste_type ON marketplace_listings(waste_type);
CREATE INDEX IF NOT EXISTS idx_impact_credits_owner ON impact_credits(owner_address);
CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(stat_date);

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_batches_updated_at BEFORE UPDATE ON processing_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_stats_updated_at BEFORE UPDATE ON platform_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial platform stats record
INSERT INTO platform_stats (stat_date) VALUES (CURRENT_DATE) ON CONFLICT (stat_date) DO NOTHING;

-- Create admin user (optional - remove in production)
INSERT INTO users (address, name, email, location, contact_info, role, is_verified, verification_date)
VALUES (
    '0x0000000000000000000000000000000000000000',
    'Admin User',
    'admin@africycle.com',
    'System',
    'system@africycle.com',
    'admin',
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT (address) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO africycle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO africycle; 