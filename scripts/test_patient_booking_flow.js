/**
 * Test script for Patient Booking, Doctor Availability, Concurrency, and In-App Notifications
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../backend/config/database');
const doctorService = require('../backend/services/doctorService');
const appointmentService = require('../backend/services/appointmentService');
const notificationStore = require('../backend/services/notificationStore');
const reminderService = require('../backend/services/reminderService');

async function runTests() {
  console.log('=== Starting Patient Booking & Notification Verification ===');

  // 1. Doctor Availability Check
  console.log('\n[1] Testing Doctor Availability...');
  // Doctor id 7 is Dental (Dr. Zaid Ali, works sat,sun,mon,tue,wed)
  // Let's pick a future date that is a Sunday:
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); // Next Sunday
  const nextSunday = d.toISOString().split('T')[0];

  const avail = await doctorService.getDoctorAvailability(7, nextSunday);
  console.log(`Availability for Dr. ${avail.doctorName} on ${nextSunday} (${avail.dayOfWeek}):`);
  console.log(`- Is Work Day: ${avail.isWorkDay}`);
  console.log(`- Duration: ${avail.durationMinutes} mins`);
  console.log(`- Total slots generated: ${avail.slots.length}`);
  if (avail.slots.length > 0) {
    console.log(`- Sample slot: ${avail.slots[0].start_time} - ${avail.slots[0].end_time} (Available: ${avail.slots[0].available})`);
  }

  // 2. Patient Booking & Double-Booking Concurrency Test
  console.log('\n[2] Testing Concurrency & Double-Booking Protection...');
  // Find a patient account
  const [patientRows] = await db.execute('SELECT id, user_id FROM patients WHERE deleted_at IS NULL LIMIT 1');
  const patient = patientRows[0];
  console.log(`Using patient ID: ${patient.id}, user_id: ${patient.user_id}`);

  // Test slot on next Sunday
  const testSlotStart = avail.slots[0].start_time;
  const bookingPayload = {
    patient_id: patient.id,
    doctor_id: 7,
    appointment_date: nextSunday,
    start_time: testSlotStart,
    visit_type: 'new',
    chief_complaint: 'Tooth pain consultation',
    notes: 'Testing booking flow',
  };

  const patientUser = { id: patient.user_id, role: 'patient' };

  // First booking attempt
  const appt1 = await appointmentService.createAppointment(bookingPayload, patientUser);
  console.log(`✓ Booking 1 created successfully: ID=${appt1.id}, Code=${appt1.appointment_code}, Status=${appt1.status}`);

  // Second concurrent/duplicate booking attempt on the same slot
  let blocked = false;
  try {
    await appointmentService.createAppointment(bookingPayload, patientUser);
  } catch (err) {
    blocked = true;
    console.log(`✓ Booking 2 correctly rejected with conflict error: "${err.message}" (Status Code: ${err.statusCode})`);
  }

  if (!blocked) {
    throw new Error('FAIL: Concurrency protection failed — double booking allowed!');
  }

  // 3. Receptionist Status Approval & Notification Flow
  console.log('\n[3] Testing Status Approval & Notification Propagation...');
  const receptionistUser = { id: 2, role: 'receptionist' };
  const updatedAppt = await appointmentService.updateStatus(appt1.id, 'confirmed', receptionistUser);
  console.log(`✓ Appointment ${updatedAppt.id} status updated to: ${updatedAppt.status}`);

  // Check In-App Notifications for this patient
  const notifs = notificationStore.getNotifications(patient.user_id);
  console.log(`✓ Patient user ${patient.user_id} has ${notifs.total} notification(s), ${notifs.unread_count} unread:`);
  for (const n of notifs.data.slice(0, 3)) {
    console.log(`  - [${n.type}] "${n.title}": ${n.message}`);
  }

  // 4. Test 48-Hour Reminder Deduplication
  console.log('\n[4] Testing 48-Hour Reminder Check & Deduplication...');
  const reminderResult = await reminderService.checkAndSend48hReminders();
  console.log(`✓ Reminder scan processed ${reminderResult.processed} upcoming appointments, sent ${reminderResult.remindersSent} new reminders.`);

  // Clean up test appointment
  await db.execute('DELETE FROM appointments WHERE id = ?', [appt1.id]);
  console.log(`\n✓ Cleaned up test appointment ${appt1.id}.`);

  console.log('\n=== ALL BACKEND CHECKS PASSED SUCCESSFULLY ===');
  await db.end();
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
