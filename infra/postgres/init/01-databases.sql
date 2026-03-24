-- Databases for the taxononie platform
-- Runs automatically on first postgres container start.

CREATE DATABASE payload;   -- Payload CMS (portal)
CREATE DATABASE case_api;  -- case-api (replace in-memory store)
CREATE DATABASE n8n;       -- n8n workflow engine

-- Grant the default user access to all databases
GRANT ALL PRIVILEGES ON DATABASE payload  TO postgres;
GRANT ALL PRIVILEGES ON DATABASE case_api TO postgres;
GRANT ALL PRIVILEGES ON DATABASE n8n      TO postgres;
