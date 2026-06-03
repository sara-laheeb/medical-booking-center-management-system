-- Extend bookings table for a complete booking system

USE booking_db;

ALTER TABLE bookings
    ADD COLUMN resource_id INT NULL AFTER id,
    ADD COLUMN email VARCHAR(150) NULL AFTER name,
    ADD COLUMN start_time TIME NOT NULL DEFAULT '09:00:00' AFTER booking_date,
    ADD COLUMN end_time TIME NOT NULL DEFAULT '10:00:00' AFTER start_time,
    ADD COLUMN notes TEXT NULL AFTER status,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Assign existing bookings to the first available resource
UPDATE bookings SET resource_id = 1 WHERE resource_id IS NULL;

ALTER TABLE bookings
    MODIFY COLUMN resource_id INT NOT NULL,
    ADD CONSTRAINT fk_bookings_resource
        FOREIGN KEY (resource_id) REFERENCES resources(id);
