-- Alternative SQL to manually add price column to subjects table
-- Run this if the migration doesn't work or you need to manually apply it

ALTER TABLE subjects ADD COLUMN price DECIMAL(10, 2) DEFAULT 0 NULL AFTER units;

-- Verify the column was added
-- SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'subjects' AND COLUMN_NAME = 'price';

