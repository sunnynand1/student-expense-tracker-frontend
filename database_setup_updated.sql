-- 1. Create database and use it
CREATE DATABASE IF NOT EXISTS student_expense_tracker;
USE student_expense_tracker;

-- 2. Drop tables if they exist (no error if they don't)
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS users;

-- 3. Create users table with name field
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_username (username),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert test user with hashed password (password is 'password123')
-- The password is already hashed using bcrypt with 10 salt rounds
INSERT INTO users (name, username, email, password, is_active, created_at, updated_at)
VALUES (
    'Test User',
    'testuser', 
    'test@example.com', 
    '$2a$10$XFDq3wZxKJHILkQhH3Jm8u9t8eJZ8XoJ8VQJd8XoJ8XoJ8XoJ8XoJ', 
    TRUE, 
    NOW(), 
    NOW()
)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 6. Verify the tables were created
SHOW TABLES;

-- 7. Show the structure of the users table
DESCRIBE users;

SHOW DATABASES;

-- 8. Show the test user
SELECT id, name, username, email, is_active, created_at FROM users;
