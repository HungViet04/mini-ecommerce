-- ============================================================
-- Migration: Add 'delivered' status to orders
-- Version: 1.0.3
-- Description: Allows users to confirm they received the order
-- ============================================================

-- Add 'delivered' status to the orders status enum
ALTER TABLE `orders` 
MODIFY COLUMN `status` ENUM('pending', 'paid', 'shipped', 'delivered') DEFAULT 'pending';
