import mysql from "mysql2/promise";
import { createHash } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3307/bookslot";

function hashPassword(password) {
  const salt = "bookslot_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

async function seed() {
  const pool = mysql.createPool(DATABASE_URL);

  console.log("🗑️  Clearing existing data...");
  // Disable FK checks for truncation
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  await pool.query("TRUNCATE TABLE bookings");
  await pool.query("TRUNCATE TABLE questions");
  await pool.query("TRUNCATE TABLE business_members");
  await pool.query("TRUNCATE TABLE appointment_types");
  await pool.query("TRUNCATE TABLE businesses");
  await pool.query("TRUNCATE TABLE users");
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");

  // ============================================================
  // USERS (5 rows)
  // ============================================================
  console.log("👤 Seeding users...");
  const defaultHash = hashPassword("password123");

  await pool.query(`
    INSERT INTO users (id, full_name, email, password_hash, role, is_active, is_verified, otp, otp_expires_at, created_at, updated_at)
    VALUES
      (1, 'Admin User', 'admin@bookslot.com', ?, 'admin', true, true, NULL, NULL, '2026-05-02 13:30:00', '2026-05-02 13:30:00'),
      (2, 'Sarah Johnson', 'sarah@bookslot.com', ?, 'organiser', true, true, NULL, NULL, '2026-05-02 13:32:00', '2026-05-02 13:32:00'),
      (3, 'Rahul Sharma', 'rahul@gmail.com', ?, 'customer', true, true, NULL, NULL, '2026-05-02 13:34:00', '2026-05-02 13:34:00'),
      (4, 'Priya Patel', 'priya@bookslot.com', ?, 'organiser', true, true, NULL, NULL, '2026-05-02 13:35:00', '2026-05-02 13:35:00'),
      (5, 'Amit Kumar', 'amit@gmail.com', ?, 'customer', true, true, NULL, NULL, '2026-05-02 13:36:00', '2026-05-02 13:36:00')
  `, [defaultHash, defaultHash, defaultHash, defaultHash, defaultHash]);

  console.log("   ✅ 5 users created (password for all: password123)");

  // ============================================================
  // BUSINESSES (4 rows)
  // Sarah (id=2) owns businesses 1 & 2
  // Priya (id=4) owns businesses 3 & 4
  // ============================================================
  console.log("🏢 Seeding businesses...");
  await pool.query(`
    INSERT INTO businesses (id, name, slug, description, category, logo_url, cover_url, address, city, country, phone, website, email, owner_id, is_active, is_verified, created_at, updated_at)
    VALUES
      (1, 'HealthFirst Clinic', 'healthfirst-clinic', 'Premium healthcare services including general consultation, dental care, and specialist appointments.', 'healthcare', NULL, NULL, '42 MG Road, Koregaon Park', 'Pune', 'India', '+91-9876543210', 'https://healthfirst.in', 'info@healthfirst.in', 2, true, true, '2026-05-02 13:37:00', '2026-05-02 13:37:00'),
      (2, 'FitZone Studio', 'fitzone-studio', 'Transform your body and mind with personal training, yoga sessions, and group fitness classes.', 'fitness', NULL, NULL, '15 FC Road, Shivaji Nagar', 'Pune', 'India', '+91-9876543211', 'https://fitzone.in', 'info@fitzone.in', 2, true, true, '2026-05-02 13:37:30', '2026-05-02 13:37:30'),
      (3, 'LegalEase Consultants', 'legalease-consultants', 'Expert legal advisory services for property matters, business compliance, and family law.', 'legal', NULL, NULL, '88 Baner Road', 'Pune', 'India', '+91-9876543212', 'https://legalease.in', 'info@legalease.in', 4, true, true, '2026-05-02 13:37:50', '2026-05-02 13:37:50'),
      (4, 'Glow Beauty Salon', 'glow-beauty-salon', 'Premium beauty and wellness services including haircuts, spa treatments, and skin care.', 'beauty_wellness', NULL, NULL, '22 Viman Nagar', 'Pune', 'India', '+91-9876543213', 'https://glowbeauty.in', 'info@glowbeauty.in', 4, true, true, '2026-05-02 13:38:10', '2026-05-02 13:38:10')
  `);
  console.log("   ✅ 4 businesses created");

  // ============================================================
  // BUSINESS MEMBERS (4 rows)
  // ============================================================
  console.log("👥 Seeding business members...");
  await pool.query(`
    INSERT INTO business_members (id, business_id, user_id, role, joined_at)
    VALUES
      (1, 1, 2, 'owner', '2026-05-02 13:37:48'),
      (2, 2, 2, 'owner', '2026-05-02 13:37:45'),
      (3, 3, 4, 'owner', '2026-05-02 13:37:52'),
      (4, 4, 4, 'owner', '2026-05-02 13:38:19')
  `);
  console.log("   ✅ 4 business members created");

  // ============================================================
  // APPOINTMENT TYPES (7 rows)
  // ============================================================
  console.log("📋 Seeding appointment types...");

  const workingHoursStandard = JSON.stringify({
    monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: true, startTime: "10:00", endTime: "14:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" },
  });

  const workingHoursExtended = JSON.stringify({
    monday: { enabled: true, startTime: "08:00", endTime: "20:00" },
    tuesday: { enabled: true, startTime: "08:00", endTime: "20:00" },
    wednesday: { enabled: true, startTime: "08:00", endTime: "20:00" },
    thursday: { enabled: true, startTime: "08:00", endTime: "20:00" },
    friday: { enabled: true, startTime: "08:00", endTime: "20:00" },
    saturday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    sunday: { enabled: true, startTime: "10:00", endTime: "14:00" },
  });

  await pool.query(`
    INSERT INTO appointment_types (id, business_id, title, description, duration, is_published, schedule_type, manage_capacity, max_capacity, advance_payment, payment_amount, manual_confirmation, assignment_type, location, resource_type, working_hours, organiser_id, share_token, created_at, updated_at)
    VALUES
      (1, 1, 'General Consultation', 'Comprehensive health check-up and consultation with an experienced physician.', 30, true, 'weekly', false, 1, true, 500.00, false, 'auto', 'Room 101, HealthFirst Clinic', 'user', ?, 2, 'tok_health_general_01', '2026-05-02 13:40:00', '2026-05-02 13:40:00'),
      (2, 1, 'Dental Check-up', 'Complete dental examination including X-ray and cleaning.', 45, true, 'weekly', false, 1, true, 800.00, false, 'auto', 'Dental Wing, HealthFirst Clinic', 'user', ?, 2, 'tok_health_dental_02', '2026-05-02 13:41:00', '2026-05-02 13:41:00'),
      (3, 2, 'Personal Training Session', 'One-on-one workout session with a certified personal trainer.', 60, true, 'weekly', false, 1, false, NULL, false, 'auto', 'FitZone Studio Main Hall', 'user', ?, 2, 'tok_fit_pt_03', '2026-05-02 13:42:00', '2026-05-02 13:42:00'),
      (4, 2, 'Yoga Class', 'Group yoga session for flexibility, strength, and mindfulness.', 60, true, 'weekly', true, 15, false, NULL, false, 'auto', 'FitZone Studio Yoga Room', 'resource', ?, 2, 'tok_fit_yoga_04', '2026-05-02 13:43:00', '2026-05-02 13:43:00'),
      (5, 3, 'Legal Consultation', 'One-on-one consultation with a senior advocate for any legal matter.', 60, true, 'weekly', false, 1, true, 1500.00, true, 'manual', 'LegalEase Office, Chamber 3', 'user', ?, 4, 'tok_legal_consult_05', '2026-05-02 13:44:00', '2026-05-02 13:44:00'),
      (6, 4, 'Haircut & Styling', 'Professional haircut and styling by expert stylists.', 45, true, 'weekly', false, 1, false, NULL, false, 'auto', 'Glow Beauty Salon', 'user', ?, 4, 'tok_beauty_hair_06', '2026-05-02 13:45:00', '2026-05-02 13:45:00'),
      (7, 4, 'Spa & Massage', 'Relaxing full-body spa treatment and therapeutic massage.', 90, false, 'weekly', true, 3, true, 2000.00, false, 'auto', 'Glow Beauty Spa Wing', 'resource', ?, 4, 'tok_beauty_spa_07', '2026-05-02 13:46:00', '2026-05-02 13:46:00')
  `, [workingHoursStandard, workingHoursStandard, workingHoursExtended, workingHoursExtended, workingHoursStandard, workingHoursExtended, workingHoursExtended]);
  console.log("   ✅ 7 appointment types created (6 published, 1 draft)");

  // ============================================================
  // BOOKINGS (11 rows)
  // ============================================================
  console.log("📅 Seeding bookings...");
  await pool.query(`
    INSERT INTO bookings (id, appointment_type_id, customer_id, provider_id, start_time, end_time, status, capacity, payment_status, answers, notes, created_at, updated_at)
    VALUES
      (1, 1, 3, NULL, '2026-05-03 09:00:00', '2026-05-03 09:30:00', 'confirmed', 1, 'paid', NULL, NULL, '2026-05-02 14:00:00', '2026-05-02 14:00:00'),
      (2, 1, 5, NULL, '2026-05-03 10:00:00', '2026-05-03 10:30:00', 'confirmed', 1, 'paid', NULL, NULL, '2026-05-02 14:05:00', '2026-05-02 14:05:00'),
      (3, 2, 3, NULL, '2026-05-03 11:00:00', '2026-05-03 11:45:00', 'confirmed', 1, 'paid', NULL, 'Regular dental cleaning', '2026-05-02 14:10:00', '2026-05-02 14:10:00'),
      (4, 3, 5, NULL, '2026-05-03 08:00:00', '2026-05-03 09:00:00', 'confirmed', 1, 'unpaid', NULL, 'Focus on upper body', '2026-05-02 14:15:00', '2026-05-02 14:15:00'),
      (5, 4, 3, NULL, '2026-05-03 10:00:00', '2026-05-03 11:00:00', 'confirmed', 1, 'unpaid', NULL, NULL, '2026-05-02 14:20:00', '2026-05-02 14:20:00'),
      (6, 4, 5, NULL, '2026-05-03 10:00:00', '2026-05-03 11:00:00', 'confirmed', 1, 'unpaid', NULL, NULL, '2026-05-02 14:25:00', '2026-05-02 14:25:00'),
      (7, 5, 3, NULL, '2026-05-04 09:00:00', '2026-05-04 10:00:00', 'pending', 1, 'unpaid', NULL, 'Property dispute query', '2026-05-02 14:30:00', '2026-05-02 14:30:00'),
      (8, 5, 5, NULL, '2026-05-04 11:00:00', '2026-05-04 12:00:00', 'pending', 1, 'unpaid', NULL, NULL, '2026-05-02 14:35:00', '2026-05-02 14:35:00'),
      (9, 6, 3, NULL, '2026-05-04 14:00:00', '2026-05-04 14:45:00', 'confirmed', 1, 'unpaid', NULL, NULL, '2026-05-02 14:40:00', '2026-05-02 14:40:00'),
      (10, 1, 3, NULL, '2026-05-05 09:00:00', '2026-05-05 09:30:00', 'cancelled', 1, 'refunded', NULL, 'Cancelled due to schedule conflict', '2026-05-02 14:45:00', '2026-05-02 14:45:00'),
      (11, 3, 3, NULL, '2026-05-05 08:00:00', '2026-05-05 09:00:00', 'confirmed', 1, 'unpaid', NULL, NULL, '2026-05-02 14:50:00', '2026-05-02 14:50:00')
  `);
  console.log("   ✅ 11 bookings created");

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n🎉 Seed complete! Summary:");
  const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
  const [businesses] = await pool.query("SELECT COUNT(*) as count FROM businesses");
  const [members] = await pool.query("SELECT COUNT(*) as count FROM business_members");
  const [appointments] = await pool.query("SELECT COUNT(*) as count FROM appointment_types");
  const [bookings] = await pool.query("SELECT COUNT(*) as count FROM bookings");
  const [questions] = await pool.query("SELECT COUNT(*) as count FROM questions");

  console.log(`   👤 Users: ${users[0].count}`);
  console.log(`   🏢 Businesses: ${businesses[0].count}`);
  console.log(`   👥 Business Members: ${members[0].count}`);
  console.log(`   📋 Appointment Types: ${appointments[0].count}`);
  console.log(`   📅 Bookings: ${bookings[0].count}`);
  console.log(`   ❓ Questions: ${questions[0].count}`);
  console.log("\n📝 Login credentials (all passwords: password123):");
  console.log("   Admin:     admin@bookslot.com");
  console.log("   Organiser: sarah@bookslot.com (owns HealthFirst + FitZone)");
  console.log("   Organiser: priya@bookslot.com (owns LegalEase + Glow Beauty)");
  console.log("   Customer:  rahul@gmail.com");
  console.log("   Customer:  amit@gmail.com");

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
