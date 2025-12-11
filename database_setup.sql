-- ============================================
-- SQL Script untuk Database db_payroll
-- Database: MySQL (untuk XAMPP/phpMyAdmin)
-- ============================================

-- Buat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS db_payroll
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Gunakan database
USE db_payroll;

-- ============================================
-- Tabel: users
-- Deskripsi: Menyimpan data pengguna sistem
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Data dummy untuk testing (opsional)
-- ============================================
-- INSERT INTO users (username, password) VALUES
-- ('admin', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'),
-- ('user1', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567891');

-- ============================================
-- Verifikasi tabel sudah dibuat
-- ============================================
SHOW TABLES;
