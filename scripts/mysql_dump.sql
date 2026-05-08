-- MySQL database dump
-- Converted from PostgreSQL for BookSlot ERP
-- Target: MySQL 8.0+

SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

-- -----------------------------------------------------------
-- Database creation
-- -----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `bookslot`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bookslot`;

-- -----------------------------------------------------------
-- Table: users
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'organiser', 'admin') NOT NULL DEFAULT 'customer',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `otp` VARCHAR(10) DEFAULT NULL,
  `otp_expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Table: businesses
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `businesses`;
CREATE TABLE `businesses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` ENUM('healthcare','beauty_wellness','fitness','education','legal','financial','consulting','automotive','home_services','technology','hospitality','other') NOT NULL DEFAULT 'other',
  `logo_url` VARCHAR(512) DEFAULT NULL,
  `cover_url` VARCHAR(512) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `website` VARCHAR(512) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `owner_id` INT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `businesses_slug_unique` (`slug`),
  KEY `fk_businesses_owner` (`owner_id`),
  CONSTRAINT `businesses_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Table: business_members
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `business_members`;
CREATE TABLE `business_members` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('owner', 'staff', 'admin') NOT NULL DEFAULT 'staff',
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bm_business` (`business_id`),
  KEY `fk_bm_user` (`user_id`),
  CONSTRAINT `business_members_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `business_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Table: appointment_types
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `appointment_types`;
CREATE TABLE `appointment_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `duration` INT NOT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `schedule_type` ENUM('weekly', 'flexible') NOT NULL DEFAULT 'weekly',
  `manage_capacity` TINYINT(1) NOT NULL DEFAULT 0,
  `max_capacity` INT DEFAULT 1,
  `advance_payment` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_amount` DECIMAL(10,2) DEFAULT NULL,
  `manual_confirmation` TINYINT(1) NOT NULL DEFAULT 0,
  `assignment_type` ENUM('auto', 'manual') NOT NULL DEFAULT 'auto',
  `location` VARCHAR(500) DEFAULT NULL,
  `resource_type` ENUM('user', 'resource') NOT NULL DEFAULT 'user',
  `working_hours` JSON DEFAULT NULL,
  `organiser_id` INT NOT NULL,
  `share_token` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_apt_business` (`business_id`),
  KEY `fk_apt_organiser` (`organiser_id`),
  CONSTRAINT `appointment_types_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_types_organiser_id_users_id_fk` FOREIGN KEY (`organiser_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Table: questions
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `appointment_id` INT NOT NULL,
  `question` TEXT NOT NULL,
  `question_type` ENUM('text', 'select', 'checkbox', 'radio') NOT NULL DEFAULT 'text',
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `options` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_questions_appointment` (`appointment_id`),
  CONSTRAINT `questions_appointment_id_appointment_types_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointment_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Table: bookings
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `appointment_type_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `provider_id` INT DEFAULT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NOT NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  `capacity` INT NOT NULL DEFAULT 1,
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  `answers` JSON DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bookings_apt` (`appointment_type_id`),
  KEY `fk_bookings_customer` (`customer_id`),
  KEY `fk_bookings_provider` (`provider_id`),
  CONSTRAINT `bookings_appointment_type_id_appointment_types_id_fk` FOREIGN KEY (`appointment_type_id`) REFERENCES `appointment_types` (`id`),
  CONSTRAINT `bookings_customer_id_users_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bookings_provider_id_users_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- -----------------------------------------------------------
-- Data: users
-- -----------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `is_active`, `is_verified`, `otp`, `otp_expires_at`, `created_at`, `updated_at`) VALUES
(1, 'Admin User',      'admin@bookslot.com',  '7ca7a4f7397a24723d7d5bf139e49da8d8612f13cb90edb0c0cb65d2058448b0', 'admin',     1, 1, NULL, NULL, '2026-05-02 13:20:16', '2026-05-02 13:20:16'),
(2, 'Sarah Organiser',  'sarah@bookslot.com',  '7ca7a4f7397a24723d7d5bf139e49da8d8612f13cb90edb0c0cb65d2058448b0', 'organiser', 1, 1, NULL, NULL, '2026-05-02 13:20:16', '2026-05-02 15:05:24'),
(3, 'John Customer',    'john@bookslot.com',   '7ca7a4f7397a24723d7d5bf139e49da8d8612f13cb90edb0c0cb65d2058448b0', 'customer',  1, 1, NULL, NULL, '2026-05-02 13:20:16', '2026-05-02 13:20:16'),
(4, 'Priya Organiser',  'priya@bookslot.com',  '7ca7a4f7397a24723d7d5bf139e49da8d8612f13cb90edb0c0cb65d2058448b0', 'organiser', 1, 1, NULL, NULL, '2026-05-02 13:20:16', '2026-05-02 13:20:16'),
(5, 'Alex Customer',    'alex@bookslot.com',   '7ca7a4f7397a24723d7d5bf139e49da8d8612f13cb90edb0c0cb65d2058448b0', 'customer',  1, 1, NULL, NULL, '2026-05-02 13:20:16', '2026-05-02 13:20:16');

-- -----------------------------------------------------------
-- Data: businesses
-- -----------------------------------------------------------
INSERT INTO `businesses` (`id`, `name`, `slug`, `description`, `category`, `logo_url`, `cover_url`, `address`, `city`, `country`, `phone`, `website`, `email`, `owner_id`, `is_active`, `is_verified`, `created_at`, `updated_at`) VALUES
(1, 'HealthFirst Clinic',    'healthfirst-clinic',    'Comprehensive primary care and specialist consultations. We provide personalized healthcare services for the whole family.', 'healthcare',      NULL, NULL, '12 Marine Drive, Nariman Point', 'Mumbai', 'India', '+91 98765 43210', NULL, 'info@healthfirstclinic.com', 2, 1, 1, '2026-05-02 13:36:46', '2026-05-02 13:36:46'),
(2, 'FitZone Gym',           'fitzone-gym',           'State-of-the-art fitness center with personal training sessions, yoga, Zumba, and more. Transform your body and mind.',      'fitness',         NULL, NULL, '8 BKC Complex, Bandra Kurla',    'Mumbai', 'India', '+91 96543 21098', NULL, 'hello@fitz.one',              2, 1, 0, '2026-05-02 13:36:57', '2026-05-02 13:36:57'),
(3, 'LegalEase Consultants', 'legalease-consultants', 'Expert legal advice for corporate law, property disputes, family law, and tax planning. Trusted by 500+ clients.',           'legal',           NULL, NULL, '23 Connaught Place',             'Delhi',  'India', '+91 95432 10987', NULL, 'contact@legalease.in',        4, 1, 1, '2026-05-02 13:37:03', '2026-05-02 13:37:03'),
(4, 'Priya''s Beauty Studio','priyas-beauty-studio',  'Premium beauty and wellness treatments. From hair styling to skincare, we help you look and feel your best.',                'beauty_wellness', NULL, NULL, '45 FC Road, Shivajinagar',       'Pune',   'India', '+91 97654 32109', NULL, 'priya@beautystudio.com',      4, 1, 1, '2026-05-02 13:37:35', '2026-05-02 13:37:35');

-- -----------------------------------------------------------
-- Data: business_members
-- -----------------------------------------------------------
INSERT INTO `business_members` (`id`, `business_id`, `user_id`, `role`, `joined_at`) VALUES
(1, 1, 2, 'owner', '2026-05-02 13:37:40'),
(2, 2, 2, 'owner', '2026-05-02 13:37:45'),
(3, 3, 4, 'owner', '2026-05-02 13:37:52'),
(4, 4, 4, 'owner', '2026-05-02 13:38:19');

-- -----------------------------------------------------------
-- Data: appointment_types
-- -----------------------------------------------------------
INSERT INTO `appointment_types` (`id`, `business_id`, `title`, `description`, `duration`, `is_published`, `schedule_type`, `manage_capacity`, `max_capacity`, `advance_payment`, `payment_amount`, `manual_confirmation`, `assignment_type`, `location`, `resource_type`, `working_hours`, `organiser_id`, `share_token`, `created_at`, `updated_at`) VALUES
(1, 1, 'General Consultation',      '30-minute consultation with a primary care physician',                    30,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 2, 'ynr9e0yegmi',  '2026-05-02 13:38:24', '2026-05-02 13:38:24'),
(2, 1, 'Specialist Appointment',    '60-minute appointment with a specialist doctor',                          60,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 2, '49glvfexb2r',  '2026-05-02 13:38:29', '2026-05-02 13:38:29'),
(3, 4, 'Hair Styling & Blowdry',    'Full hair styling session including cut, blowdry and finish',             90,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 4, 'v118fwknv7e',  '2026-05-02 13:38:35', '2026-05-02 13:38:35'),
(4, 4, 'Facial Treatment',          'Relaxing and rejuvenating facial with premium skincare products',          60,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 4, 'ykqiicor04',   '2026-05-02 13:38:40', '2026-05-02 13:38:40'),
(5, 2, 'Personal Training Session',  'One-on-one workout session with a certified personal trainer',           60,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 2, 'r9ls7zfpfwn',  '2026-05-02 13:38:45', '2026-05-02 13:38:45'),
(6, 3, 'Legal Consultation',        'Initial consultation to discuss your legal needs and options',             45,  1, 'weekly', 0, 1, 0, NULL,  0, 'auto', NULL,  'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 4, '5qiiag1d91m',  '2026-05-02 13:38:51', '2026-05-02 13:38:51'),
(7, 1, 'massage',                    '',                                                                        60,  0, 'weekly', 0, 1, 1, 10.00, 1, 'auto', 'vit', 'user', '{"friday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"monday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"sunday":{"enabled":false,"endTime":"14:00","startTime":"10:00"},"tuesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"saturday":{"enabled":false,"endTime":"14:00","startTime":"10:00"},"thursday":{"enabled":true,"endTime":"17:00","startTime":"09:00"},"wednesday":{"enabled":true,"endTime":"17:00","startTime":"09:00"}}', 1, 'e68baa992f2bef1f3c83c9cc05e08a733245593de8d0d33e7a713058c7762dc3', '2026-05-02 15:08:01', '2026-05-02 15:08:01');

-- -----------------------------------------------------------
-- Data: bookings
-- -----------------------------------------------------------
INSERT INTO `bookings` (`id`, `appointment_type_id`, `customer_id`, `provider_id`, `start_time`, `end_time`, `status`, `capacity`, `payment_status`, `answers`, `notes`, `created_at`, `updated_at`) VALUES
(1,  1, 3, 2,    '2026-05-04 09:00:00', '2026-05-04 09:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:11', '2026-05-02 13:39:11'),
(2,  1, 5, 2,    '2026-05-05 10:00:00', '2026-05-05 10:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:16', '2026-05-02 13:39:16'),
(3,  2, 3, 2,    '2026-05-07 11:00:00', '2026-05-07 11:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:22', '2026-05-02 13:39:22'),
(4,  3, 5, 4,    '2026-05-03 14:00:00', '2026-05-03 14:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:27', '2026-05-02 13:39:27'),
(5,  4, 3, 4,    '2026-05-06 15:00:00', '2026-05-06 15:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:32', '2026-05-02 13:39:32'),
(6,  5, 5, 2,    '2026-05-04 10:00:00', '2026-05-04 10:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:37', '2026-05-02 13:39:37'),
(7,  6, 3, 4,    '2026-05-08 11:00:00', '2026-05-08 11:30:00', 'cancelled', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:42', '2026-05-02 14:59:24'),
(8,  1, 5, 2,    '2026-04-30 09:00:00', '2026-04-30 09:30:00', 'completed', 1, 'unpaid', '[]', NULL, '2026-05-02 13:39:47', '2026-05-02 13:39:47'),
(9,  1, 3, NULL, '2026-05-06 09:30:00', '2026-05-06 10:00:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 15:00:53', '2026-05-02 15:00:53'),
(13, 1, 3, NULL, '2026-05-12 09:00:00', '2026-05-12 09:30:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 16:01:06', '2026-05-02 16:01:06'),
(14, 6, 4, NULL, '2026-05-05 13:30:00', '2026-05-05 14:15:00', 'confirmed', 1, 'unpaid', '[]', NULL, '2026-05-02 16:05:08', '2026-05-02 16:05:08');

-- -----------------------------------------------------------
-- Data: questions  (empty — no rows in source)
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- Reset AUTO_INCREMENT to match PostgreSQL sequences
-- -----------------------------------------------------------
ALTER TABLE `users`             AUTO_INCREMENT = 9;
ALTER TABLE `businesses`        AUTO_INCREMENT = 5;
ALTER TABLE `business_members`  AUTO_INCREMENT = 5;
ALTER TABLE `appointment_types` AUTO_INCREMENT = 8;
ALTER TABLE `bookings`          AUTO_INCREMENT = 15;
ALTER TABLE `questions`         AUTO_INCREMENT = 1;

-- -----------------------------------------------------------
-- Restore settings
-- -----------------------------------------------------------
SET TIME_ZONE=@OLD_TIME_ZONE;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;

-- MySQL dump complete
