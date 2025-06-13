-- WebRTC Signaling Server Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $ BEGIN
    CREATE TYPE connection_state AS ENUM ('connected', 'disconnected', 'reconnecting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE room_status AS ENUM ('active', 'inactive', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Create database user for the application (if not exists)
DO $ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'webrtc_user') THEN
        CREATE ROLE webrtc_user WITH LOGIN PASSWORD 'webrtc_password';
    END IF;
END $;

-- Grant permissions
GRANT CONNECT ON DATABASE webrtc_signaling TO webrtc_user;
GRANT USAGE ON SCHEMA public TO webrtc_user;
GRANT CREATE ON SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO webrtc_user;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO webrtc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO webrtc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO webrtc_user;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'WebRTC Signaling Server database initialized successfully' AS message;
