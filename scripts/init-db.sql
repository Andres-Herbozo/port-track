-- PortTrack Database Initialization Script

-- Create database if not exists
-- CREATE DATABASE porttrack_dev;

-- Connect to the database
\c porttrack_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS porttrack;
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ships table
CREATE TABLE IF NOT EXISTS porttrack.ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    imo_number VARCHAR(20) UNIQUE NOT NULL,
    mmsi VARCHAR(20),
    call_sign VARCHAR(20),
    ship_type VARCHAR(100),
    length_m DECIMAL(8,2),
    width_m DECIMAL(8,2),
    draft_m DECIMAL(8,2),
    gross_tonnage INTEGER,
    net_tonnage INTEGER,
    flag VARCHAR(100),
    home_port VARCHAR(200),
    owner VARCHAR(200),
    operator VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cargo table
CREATE TABLE IF NOT EXISTS porttrack.cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES porttrack.ships(id),
    cargo_type VARCHAR(100) NOT NULL,
    description TEXT,
    weight_kg DECIMAL(12,2),
    volume_m3 DECIMAL(10,2),
    units INTEGER,
    hazardous BOOLEAN DEFAULT FALSE,
    customs_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS porttrack.routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES porttrack.ships(id),
    origin_port VARCHAR(200) NOT NULL,
    destination_port VARCHAR(200) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    distance_nm DECIMAL(10,2),
    estimated_duration_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create port_operations table
CREATE TABLE IF NOT EXISTS porttrack.port_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID REFERENCES porttrack.ships(id),
    operation_type VARCHAR(50) NOT NULL, -- 'loading', 'unloading', 'refueling', 'maintenance'
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    berth_number VARCHAR(20),
    crane_count INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS porttrack.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS porttrack.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS porttrack.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES porttrack.users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES porttrack.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES porttrack.users(id),
    UNIQUE(user_id, permission_id)
);

-- Insert default permissions
INSERT INTO porttrack.permissions (name, description, resource, action) VALUES
('view_ships', 'View ship information', 'ships', 'read'),
('edit_ships', 'Edit ship information', 'ships', 'update'),
('delete_ships', 'Delete ship records', 'ships', 'delete'),
('view_cargo', 'View cargo information', 'cargo', 'read'),
('edit_cargo', 'Edit cargo information', 'cargo', 'update'),
('view_routes', 'View route information', 'routes', 'read'),
('edit_routes', 'Edit route information', 'routes', 'update'),
('view_operations', 'View port operations', 'operations', 'read'),
('edit_operations', 'Edit port operations', 'operations', 'update'),
('admin_users', 'Manage user accounts', 'users', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ships_imo ON porttrack.ships(imo_number);
CREATE INDEX IF NOT EXISTS idx_ships_status ON porttrack.ships(status);
CREATE INDEX IF NOT EXISTS idx_cargo_ship_id ON porttrack.cargo(ship_id);
CREATE INDEX IF NOT EXISTS idx_routes_ship_id ON porttrack.routes(ship_id);
CREATE INDEX IF NOT EXISTS idx_operations_ship_id ON porttrack.port_operations(ship_id);
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON porttrack.users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON porttrack.users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ships_updated_at BEFORE UPDATE ON porttrack.ships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cargo_updated_at BEFORE UPDATE ON porttrack.cargo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON porttrack.routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON porttrack.port_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON porttrack.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to porttrack_user
GRANT USAGE ON SCHEMA porttrack TO porttrack_user;
GRANT USAGE ON SCHEMA audit TO porttrack_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA porttrack TO porttrack_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO porttrack_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA porttrack TO porttrack_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO porttrack_user;

-- Insert sample data
INSERT INTO porttrack.ships (name, imo_number, ship_type, length_m, width_m, draft_m, gross_tonnage, flag, home_port, owner) VALUES
('PortTrack Explorer', 'IMO1234567', 'Container Ship', 300.5, 42.8, 15.2, 45000, 'Panama', 'Rotterdam', 'PortTrack Shipping Co.'),
('Ocean Navigator', 'IMO2345678', 'Bulk Carrier', 280.3, 38.5, 14.8, 38000, 'Liberia', 'Hamburg', 'Global Maritime Ltd.'),
('Sea Voyager', 'IMO3456789', 'Tanker', 320.7, 45.2, 16.5, 52000, 'Marshall Islands', 'Singapore', 'Pacific Tankers Inc.')
ON CONFLICT (imo_number) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW porttrack.ship_summary AS
SELECT 
    s.id,
    s.name,
    s.imo_number,
    s.ship_type,
    s.status,
    s.flag,
    COUNT(c.id) as cargo_count,
    COUNT(r.id) as route_count,
    COUNT(o.id) as operation_count
FROM porttrack.ships s
LEFT JOIN porttrack.cargo c ON s.id = c.ship_id
LEFT JOIN porttrack.routes r ON s.id = r.ship_id
LEFT JOIN porttrack.port_operations o ON s.id = o.ship_id
GROUP BY s.id, s.name, s.imo_number, s.ship_type, s.status, s.flag;

-- Grant access to views
GRANT SELECT ON porttrack.ship_summary TO porttrack_user;
