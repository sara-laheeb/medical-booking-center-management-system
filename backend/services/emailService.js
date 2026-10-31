'use strict';

/**
 * Email & Notification Service
 * -------------------------------------------------------------
 * Handles dispatching email notifications for appointment lifecycle
 * events (booking, confirmation/status updates, cancellation).
 *
 * Configurable via environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_USER: SMTP authentication username
 * - SMTP_PASS: SMTP authentication password
 * - SMTP_SECURE: Use TLS/SSL (default: false)
 * - SMTP_FROM: Default sender address (default: noreply@medicare.local)
 *
 * Safety & Resilience:
 * - If SMTP credentials are not configured (standard local dev), notifications
 *   are safely recorded via the application logger in simulated mode.
 * - Errors never crash or block business flows (appointments, cancellations).
 * - Transparent delivery status tracking (delivered: false, simulated: true).
 */

const logger = require('../utils/Logger');

class EmailService {
  constructor() {
    this.smtpHost = process.env.SMTP_HOST || null;
    this.smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    this.smtpUser = process.env.SMTP_USER || null;
    this.smtpPass = process.env.SMTP_PASS || null;
    this.smtpSecure = process.env.SMTP_SECURE === 'true';
    this.smtpFrom = process.env.SMTP_FROM || 'MediCare Center <noreply@medicare.local>';

    this.transporter = null;
    this._initTransporter();
  }

  /**
   * Initializes email transporter if credentials and library exist.
   */
  _initTransporter() {
    if (!this.smtpHost || !this.smtpUser) {
      logger.info(
        '[EmailService] SMTP host/user not configured in environment. Running in simulated notification mode.'
      );
      return;
    }

    try {
      // Check if nodemailer is installed in project dependencies
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpSecure,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });
      logger.info(`[EmailService] Transporter configured for SMTP host: ${this.smtpHost}:${this.smtpPort}`);
    } catch {
      logger.info(
        '[EmailService] Mail transport package not installed. Running in simulated notification mode.'
      );
    }
  }

  /**
   * Check whether real email delivery is actively configured.
   */
  isConfigured() {
    return Boolean(this.transporter && this.smtpHost && this.smtpUser);
  }

  /**
   * Core dispatch function for sending emails.
   */
  async _send({ to, subject, text, html, event, metadata = {} }) {
    if (!to) {
      return {
        delivered: false,
        skipped: true,
        reason: 'No recipient email address provided',
      };
    }

    const payload = {
      from: this.smtpFrom,
      to,
      subject,
      text,
      html,
      event,
      timestamp: new Date().toISOString(),
      metadata,
    };

    if (this.isConfigured()) {
      try {
        const info = await this.transporter.sendMail({
          from: this.smtpFrom,
          to,
          subject,
          text,
          html,
        });
        logger.info(`[EmailService] Delivered email for event "${event}" to: ${to}`, { messageId: info.messageId });
        return { delivered: true, messageId: info.messageId };
      } catch (err) {
        logger.error(`[EmailService] Failed delivering email to ${to}: ${err.message}`, { error: err });
        return { delivered: false, error: err.message };
      }
    }

    // Fallback: Safe simulation and structured logging without throwing
    logger.info(`[EmailService:SIMULATED] Event: "${event}" | Recipient: ${to} | Subject: "${subject}"`, {
      event,
      to,
      subject,
      metadata,
    });

    return {
      delivered: false,
      simulated: true,
      reason: 'SMTP provider not configured. Notification recorded to system log.',
      payload,
    };
  }

  /**
   * Dispatch booking confirmation email to the patient.
   */
  async sendAppointmentBookingEmail({
    patientEmail,
    patientName,
    appointmentCode,
    doctorName,
    date,
    time,
  }) {
    const subject = `Appointment Confirmation - ${appointmentCode} | MediCare Center`;
    const text = `Dear ${patientName || 'Patient'},\n\n` +
      `Your appointment has been successfully scheduled.\n\n` +
      `Appointment Code: ${appointmentCode}\n` +
      `Attending Clinician: ${doctorName || 'Assigned Doctor'}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n\n` +
      `Please arrive 15 minutes before your scheduled appointment.\n\n` +
      `Thank you,\nMediCare Center`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0284c7; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">MediCare Center - Appointment Confirmed</h2>
        </div>
        <div style="padding: 24px;">
          <p>Dear <strong>${patientName || 'Patient'}</strong>,</p>
          <p>Your medical appointment has been scheduled successfully. Below are the consultation details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Appointment Code:</td><td style="padding: 8px 0; font-weight: bold; color: #0284c7;">${appointmentCode}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Clinician:</td><td style="padding: 8px 0; font-weight: bold;">${doctorName || 'Assigned Doctor'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Date:</td><td style="padding: 8px 0; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Time:</td><td style="padding: 8px 0; font-weight: bold;">${time}</td></tr>
          </table>
          <p style="color: #64748b; font-size: 13px;">Please arrive 15 minutes prior to your allocated time.</p>
        </div>
      </div>
    `;

    return this._send({
      to: patientEmail,
      subject,
      text,
      html,
      event: 'appointment_created',
      metadata: { appointmentCode, doctorName, date, time },
    });
  }

  /**
   * Dispatch status update email to the patient (e.g. confirmed, in_progress, completed).
   */
  async sendAppointmentStatusEmail({
    patientEmail,
    patientName,
    appointmentCode,
    status,
    doctorName,
    date,
    time,
  }) {
    const statusLabels = {
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      no_show: 'Marked as No-Show',
    };
    const readableStatus = statusLabels[status] || status;

    const subject = `Appointment Status Updated: ${readableStatus} (${appointmentCode}) | MediCare Center`;
    const text = `Dear ${patientName || 'Patient'},\n\n` +
      `The status of your appointment (${appointmentCode}) has been updated to: ${readableStatus}.\n\n` +
      `Attending Clinician: ${doctorName || 'Assigned Doctor'}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n\n` +
      `Thank you,\nMediCare Center`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0284c7; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">Appointment Status Update</h2>
        </div>
        <div style="padding: 24px;">
          <p>Dear <strong>${patientName || 'Patient'}</strong>,</p>
          <p>The status of your scheduled consultation has been updated to: <span style="display: inline-block; padding: 4px 10px; background-color: #e0f2fe; color: #0369a1; font-weight: bold; border-radius: 4px;">${readableStatus}</span></p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Appointment Code:</td><td style="padding: 8px 0; font-weight: bold;">${appointmentCode}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Clinician:</td><td style="padding: 8px 0; font-weight: bold;">${doctorName || 'Assigned Doctor'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Date:</td><td style="padding: 8px 0; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Time:</td><td style="padding: 8px 0; font-weight: bold;">${time}</td></tr>
          </table>
        </div>
      </div>
    `;

    return this._send({
      to: patientEmail,
      subject,
      text,
      html,
      event: `appointment_status_${status}`,
      metadata: { appointmentCode, status, doctorName, date, time },
    });
  }

  /**
   * Dispatch cancellation email to the patient.
   */
  async sendAppointmentCancellationEmail({
    patientEmail,
    patientName,
    appointmentCode,
    reason,
    doctorName,
    date,
    time,
  }) {
    const subject = `Appointment Cancelled - ${appointmentCode} | MediCare Center`;
    const text = `Dear ${patientName || 'Patient'},\n\n` +
      `Your appointment (${appointmentCode}) scheduled for ${date} at ${time} with ${doctorName || 'your doctor'} has been cancelled.\n\n` +
      (reason ? `Cancellation Reason: ${reason}\n\n` : '') +
      `If you wish to reschedule, please contact our clinic front desk or visit the booking portal.\n\n` +
      `Thank you,\nMediCare Center`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecdd3; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e11d48; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">Appointment Cancellation Notice</h2>
        </div>
        <div style="padding: 24px;">
          <p>Dear <strong>${patientName || 'Patient'}</strong>,</p>
          <p>This is to notify you that appointment <strong>${appointmentCode}</strong> scheduled for <strong>${date} at ${time}</strong> has been cancelled.</p>
          ${reason ? `<div style="background-color: #fff1f2; border-inline-start: 4px solid #e11d48; padding: 12px 16px; margin: 16px 0; font-size: 13.5px;"><strong>Reason:</strong> ${reason}</div>` : ''}
          <p style="color: #64748b; font-size: 13px;">If you wish to schedule a new visit, please contact the front desk or use the online portal.</p>
        </div>
      </div>
    `;

    return this._send({
      to: patientEmail,
      subject,
      text,
      html,
      event: 'appointment_cancelled',
      metadata: { appointmentCode, reason, doctorName, date, time },
    });
  }
}

module.exports = new EmailService();
