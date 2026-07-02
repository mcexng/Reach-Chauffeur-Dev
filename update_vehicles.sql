-- Add color and licenseplate to vehicles table
ALTER TABLE vehicles ADD COLUMN color TEXT DEFAULT 'Midnight Obsidian Black';
ALTER TABLE vehicles ADD COLUMN licenseplate TEXT DEFAULT 'Pending Registry';
