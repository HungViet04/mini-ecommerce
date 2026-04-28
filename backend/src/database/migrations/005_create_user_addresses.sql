-- Migration: Create user_addresses table
CREATE TABLE
    IF NOT EXISTS `user_addresses` (
        `id` int (11) NOT NULL AUTO_INCREMENT,
        `user_id` int (11) NOT NULL,
        `full_name` varchar(100) NOT NULL,
        `phone` varchar(20) NOT NULL,
        `province` varchar(100) NOT NULL,
        `district` varchar(100) NOT NULL,
        `ward` varchar(100) NOT NULL,
        `address` varchar(255) NOT NULL,
        `note` varchar(255) DEFAULT NULL,
        `type` enum ('home', 'office', 'other') DEFAULT 'home',
        `is_default` tinyint (1) NOT NULL DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`),
        KEY `user_id` (`user_id`),
        KEY `user_default` (`user_id`, `is_default`),
        CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;