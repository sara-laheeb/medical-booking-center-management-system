-- Create bookable resources (rooms, halls, offices, etc.)

USE booking_db;

CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'room',
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO resources (name, type, description)
VALUES
('Meeting Room A', 'room', 'Small meeting room for up to 6 people'),
('Conference Hall', 'hall', 'Large hall for events up to 50 people'),
('Doctor Office 1', 'office', 'General consultation room');
