-- Sample bookings with resources and time slots (run after 004 and 005)

USE booking_db;

INSERT INTO bookings (resource_id, name, email, booking_date, start_time, end_time, status, notes)
VALUES
(1, 'Sara', 'sara@example.com', '2026-06-10', '09:00:00', '10:00:00', 'confirmed', 'Team standup'),
(2, 'Ali', 'ali@example.com', '2026-06-12', '14:00:00', '16:00:00', 'pending', 'Workshop session');
