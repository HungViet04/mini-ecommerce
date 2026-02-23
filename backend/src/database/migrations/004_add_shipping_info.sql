-- Migration: Add shipping info and payment method to orders table
-- Date: 2026-01-10
ALTER TABLE `orders`
ADD COLUMN `shipping_name` varchar(100) DEFAULT NULL AFTER `total`,
ADD COLUMN `shipping_phone` varchar(20) DEFAULT NULL AFTER `shipping_name`,
ADD COLUMN `shipping_address` varchar(500) DEFAULT NULL AFTER `shipping_phone`,
ADD COLUMN `shipping_city` varchar(100) DEFAULT NULL AFTER `shipping_address`,
ADD COLUMN `shipping_notes` text DEFAULT NULL AFTER `shipping_city`,
ADD COLUMN `payment_method` enum ('cod', 'bank_transfer') DEFAULT 'cod' AFTER `shipping_notes`,
ADD COLUMN `shipping_fee` decimal(10, 2) DEFAULT 30000.00 AFTER `payment_method`;

-- Update total to include shipping fee for existing orders
-- UPDATE `orders` SET `total` = `total` + 30000 WHERE `shipping_fee` IS NULL;