-- Migration: Add description and image_url to products table
-- NOTE: This migration is for reference only. Use ecommerce_db.sql for database setup.

-- Add new columns (if not exists)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description TEXT AFTER name,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024) AFTER description;

-- Rollback (if needed):
-- ALTER TABLE products DROP COLUMN description, DROP COLUMN image_url;
