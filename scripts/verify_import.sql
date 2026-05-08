USE bookslot;
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL SELECT 'business_members', COUNT(*) FROM business_members
UNION ALL SELECT 'appointment_types', COUNT(*) FROM appointment_types
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'questions', COUNT(*) FROM questions;
