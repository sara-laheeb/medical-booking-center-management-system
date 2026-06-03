-- Run this file ONCE as MySQL admin (root), then restart the server.
-- The application user (booking_app) only needs SELECT/INSERT/UPDATE/DELETE.

USE booking_db;

-- Step 1: Resources table
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'room',
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO resources (id, name, type, description)
VALUES
(1, 'Meeting Room A', 'room', 'Small meeting room for up to 6 people'),
(2, 'Conference Hall', 'hall', 'Large hall for events up to 50 people'),
(3, 'Doctor Office 1', 'office', 'General consultation room');

-- Step 2: Extend bookings table (ignore errors if columns already exist)
ALTER TABLE bookings ADD COLUMN resource_id INT NULL AFTER id;
ALTER TABLE bookings ADD COLUMN email VARCHAR(150) NULL AFTER name;
ALTER TABLE bookings ADD COLUMN start_time TIME NOT NULL DEFAULT '09:00:00' AFTER booking_date;
ALTER TABLE bookings ADD COLUMN end_time TIME NOT NULL DEFAULT '10:00:00' AFTER start_time;
ALTER TABLE bookings ADD COLUMN notes TEXT NULL AFTER status;
ALTER TABLE bookings ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE bookings SET resource_id = 1 WHERE resource_id IS NULL;

ALTER TABLE bookings MODIFY COLUMN resource_id INT NOT NULL;

-- Add foreign key only if it does not exist (MySQL 8+)
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'booking_db'
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_NAME = 'fk_bookings_resource'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id) REFERENCES resources(id)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
