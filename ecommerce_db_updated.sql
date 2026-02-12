-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th1 12, 2026 lúc 04:14 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `ecommerce_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Điện thoại'),
(2, 'Tai nghe'),
(3, 'Máy tính'),
(4, 'Phụ kiện'),
(5, 'Đồng hồ');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_name` varchar(100) DEFAULT NULL,
  `shipping_phone` varchar(20) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_notes` text DEFAULT NULL,
  `payment_method` enum('cod','bank_transfer') DEFAULT 'cod',
  `shipping_fee` decimal(10,2) DEFAULT 30000.00,
  `status` enum('pending','paid','shipped','delivered') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total`, `shipping_name`, `shipping_phone`, `shipping_address`, `shipping_city`, `shipping_notes`, `payment_method`, `shipping_fee`, `status`, `created_at`) VALUES
(8, 6, 45030000.00, 'chi', '0325251470', 'số 19, ngõ 131, đường phát triển, thôn hội xá, hương sơn, Hương Sơn, Mỹ Đức', 'Hà Nội', NULL, 'bank_transfer', 30000.00, 'delivered', '2026-01-10 08:13:49'),
(9, 6, 1670000.00, 'chi', '0325251470', 'số 19, ngõ 131, đường phát triển, thôn hội xá, hương sơn, Hương Sơn, Mỹ Đức', 'Hà Nội', NULL, 'cod', 30000.00, 'delivered', '2026-01-12 15:04:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(8, 8, 1, 1, 45000000.00),
(9, 9, 10, 1, 350000.00),
(10, 9, 8, 1, 1290000.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(1024) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `stock`, `category_id`, `description`, `image_url`, `created_at`) VALUES
(1, 'iPhone 17 Pro Max', 45000000.00, 9, 1, 'iPhone 17 Pro Max 256GB Chính Hãng 2026 - Màu Titan Tự Nhiên', 'https://clickbuy.com.vn/uploads/pro/iphone-17-pro-max-7908-hqzm-1024x1024-218698.jpg', '2026-01-01 10:00:00'),
(2, 'Samsung Galaxy S26 Ultra', 38000000.00, 15, 1, 'Samsung Galaxy S26 Ultra 512GB - AI Camera', 'https://images.samsung.com/vn/smartphones/galaxy-s26-ultra/images/galaxy-s26-ultra.png', '2026-01-02 11:00:00'),
(3, 'AirPods Pro 3', 6790000.00, 25, 2, 'Apple AirPods Pro 3 - Active Noise Cancellation', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/i/airpods_pro_3_sep25_pdp_image_position_1__vn-vi_1.png', '2026-01-03 09:30:00'),
(4, 'Sony WH-1000XM6', 8500000.00, 12, 2, 'Tai nghe chống ồn cao cấp Sony WH-1000XM6', 'https://sony.com.vn/image/headphone-wh1000xm6.png', '2026-01-04 14:00:00'),
(5, 'MacBook Pro M4', 65000000.00, 8, 3, 'Apple MacBook Pro 14-inch M4 Pro 2026', 'https://store.apple.com/vn/macbook-pro-m4.png', '2026-01-05 08:00:00'),
(6, 'Dell XPS 15', 42000000.00, 6, 3, 'Dell XPS 15 9540 - Intel Core Ultra 9', 'https://dell.com/vn/xps-15.png', '2026-01-06 10:30:00'),
(7, 'Apple Watch Ultra 3', 21900000.00, 20, 5, 'Apple Watch Ultra 3 GPS + Cellular', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/1/2/1222.png', '2026-01-07 12:00:00'),
(8, 'Sạc MagSafe 25W', 1290000.00, 49, 4, 'Bộ sạc không dây MagSafe 25W chính hãng Apple', 'https://store.apple.com/vn/magsafe-charger.png', '2026-01-08 09:00:00'),
(9, 'Cáp USB-C to Lightning', 550000.00, 100, 4, 'Cáp sạc nhanh USB-C to Lightning 2m', 'https://store.apple.com/vn/usb-c-cable.png', '2026-01-09 11:00:00'),
(10, 'Tai nghe Bluetooth JBL', 350000.00, 29, 2, 'Tai nghe Bluetooth JBL Tune 510BT', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-chup-tai-jbl-tune-520bt_4_.png', '2026-01-09 15:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Admin', 'admin@example.com', '$2b$10$37yDnAbdBtzfqDAAmo41WujS5DmOgtyY08r7lEcFGitlALjZVgSJi', 'admin', '2026-01-01 00:00:00'),
(6, 'chi', 'chi@example.com', '$2b$10$Of16KH0VyA..0mZL02ZrueVBdNl7kq2IGu/eaKkN25BPDodWKIVQe', 'user', '2026-01-10 08:13:14');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `status` (`status`),
  ADD KEY `created_at` (`created_at`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
