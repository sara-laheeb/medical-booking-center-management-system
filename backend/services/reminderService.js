/**
 * Automated Appointment Reminder Service
 * ----------------------------------------------------
 * Scans confirmed appointments scheduled 48 hours ahead and creates
 * in-app reminder notifications.
 *
 * Guarantees zero duplicate reminders using notificationStore deduplication.
 */

'use strict';

const db = require('../config/database');
const notificationStore = require('./notificationStore');
const emailService = require('./emailService');

class ReminderService {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Scan for confirmed appointments occurring ~48 hours from now
   * (e.g., appointment_date = CURDATE() + 2 days)
   * and issue reminder notifications if not already sent.
   */
  async checkAndSend48hReminders() {
    if (this.isProcessing) {
      return { processed: 0, remindersSent: 0, skipped: true };
    }
    this.isProcessing = true;

    try {
      const [appointments] = await db.execute(`
        SELECT
          a.id,
          a.appointment_code,
          a.appointment_date,
          a.start_time,
          a.patient_id,
          a.doctor_id,
          p.user_id AS patient_user_id,
          CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
          p.email AS patient_email,
          du.name AS doctor_name,
          s.name AS specialty_name,
          s.name_ar AS specialty_name_ar
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN doctors d ON d.id = a.doctor_id
        INNER JOIN users du ON du.id = d.user_id
        INNER JOIN specialties s ON s.id = d.specialty_id
        WHERE a.status = 'confirmed'
          AND a.deleted_at IS NULL
          AND a.appointment_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
      `);

      let remindersSent = 0;

      for (const appt of appointments) {
        if (!appt.patient_user_id) continue;

        // Deduplication check: verify if 48h_reminder was already dispatched for this appointment
        const alreadyNotified = notificationStore.exists({
          type: '48h_reminder',
          appointment_id: appt.id,
        });

        if (alreadyNotified) {
          continue;
        }

        const dateStr = String(appt.appointment_date).split('T')[0];
        const timeStr = String(appt.start_time).substring(0, 5);

        // Dispatch In-App Notification
        notificationStore.createNotification({
          user_id: appt.patient_user_id,
          patient_id: appt.patient_id,
          appointment_id: appt.id,
          type: '48h_reminder',
          title: 'Upcoming Appointment Reminder (in 48 Hours)',
          title_ar: 'تذكير بموعدك الطبي القادم (خلال 48 ساعة)',
          message: `Reminder: You have an upcoming appointment with Dr. ${appt.doctor_name} (${appt.specialty_name}) on ${dateStr} at ${timeStr}.`,
          message_ar: `تذكير: لديك موعد طبي قادم مع د. ${appt.doctor_name} (${appt.specialty_name_ar || appt.specialty_name}) بتاريخ ${dateStr} في تمام الساعة ${timeStr}.`,
          metadata: {
            appointment_code: appt.appointment_code,
            date: dateStr,
            time: timeStr,
            doctor_name: appt.doctor_name,
          },
        });

        // Non-blocking email delivery attempt if configured
        if (appt.patient_email && emailService?.sendAppointmentStatusEmail) {
          emailService
            .sendAppointmentStatusEmail({
              patientEmail: appt.patient_email,
              patientName: appt.patient_name,
              appointmentCode: appt.appointment_code,
              status: 'confirmed_reminder',
              doctorName: appt.doctor_name,
              date: dateStr,
              time: timeStr,
            })
            .catch(() => {});
        }

        remindersSent += 1;
      }

      return { processed: appointments.length, remindersSent };
    } catch {
      return { processed: 0, remindersSent: 0 };
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new ReminderService();
