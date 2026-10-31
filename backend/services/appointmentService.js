'use strict';

/**
 * AppointmentService
 * --------------------------------------------------
 * Business Logic Layer for the appointments module.
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Patient/doctor lookups still go through a lightweight
 * db call here since there's no PatientModel.findExists /
 * DoctorModel.findActive helper exposed for cross-module use;
 * everything specific to the appointments table itself goes
 * through AppointmentModel.
 */

const db = require('../config/database');
const AppointmentModel = require('../models/Appointment.model');
const AppError = require('../errors/AppError');
const emailService = require('./emailService');
const notificationStore = require('./notificationStore');

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

class AppointmentService {

    /**
   * Normalize pagination parameters.
   */
  _parsePagination({ page = 1, limit = 10 }) {

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    };
  }

  /**
   * Add minutes to a time string.
   *
   * Accepts:
   * HH:MM
   * HH:MM:SS
   *
   * Returns:
   * HH:MM:SS
   */
  _addMinutes(time, minutes) {

    const [h, m, s = 0] = time.split(':').map(Number);

    const total = h * 60 + m + Number(minutes);

    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;

    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }



  async _findOrFail(id) {

    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      throw new AppError(`Appointment with ID ${id} not found`, 404);
    }

    return appointment;
  }
  async _getDoctorProfileByUserId(userId) {

    const [rows] = await db.execute(
      `
      SELECT id, appointment_duration, is_active
      FROM doctors
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    const doctor = rows[0];

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    if (!doctor.is_active) {
      throw new AppError('Your doctor profile is not currently active', 422);
    }

    return doctor;
  }

  async _assertAppointmentAccess(appointment, user) {

    if (['admin', 'receptionist'].includes(user.role)) {
      return;
    }

    if (user.role === 'doctor') {

      const doctor = await this._getDoctorProfileByUserId(user.id);

      if (appointment.doctor_id !== doctor.id) {
        throw new AppError(
          'Doctors can only access their own appointments',
          403
        );
      }

      return;
    }

    if (user.role === 'patient') {

      const [rows] = await db.execute(
        `
        SELECT id
        FROM patients
        WHERE user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [user.id]
      );

      if (!rows[0] || appointment.patient_id !== rows[0].id) {
        throw new AppError(
          'Patients can only access their own appointments',
          403
        );
      }

      return;
    }

    throw new AppError('You are not authorized to access appointments', 403);
  }

  async _assertPatientExists(patientId) {

    const [rows] = await db.execute(
      'SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL',
      [patientId]
    );

    if (!rows[0]) {
      throw new AppError(`Patient with ID ${patientId} not found`, 404);
    }
  }

  async _getActiveDoctorOrFail(doctorId) {

    const [rows] = await db.execute(
      'SELECT id, appointment_duration, work_days, work_start, work_end, is_active FROM doctors WHERE id = ?',
      [doctorId]
    );

    const doctor = rows[0];

    if (!doctor) {
      throw new AppError(`Doctor with ID ${doctorId} not found`, 404);
    }

    if (!doctor.is_active) {
      throw new AppError('This doctor is not currently active', 422);
    }

    return doctor;
  }

  /**
   * Ensure the requested slot doesn't overlap an existing,
   * non-cancelled appointment for the same doctor.
   */
  async _assertSlotIsFree({ doctorId, date, startTime, endTime, excludeId = null }) {

    const conflict = await AppointmentModel.findOverlapping({
      doctorId,
      date,
      startTime,
      endTime,
      excludeId
    });

    if (conflict) {
      throw new AppError(
        'This doctor already has an appointment overlapping this time slot',
        409
      );
    }
  }

  async getAllAppointments(query = {}, user) {

    const { page, limit, offset } = this._parsePagination(query);
    const filters = {
      patientId: query.patient_id || null,
      doctorId: query.doctor_id || null,
      status: STATUSES.includes(query.status) ? query.status : null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null
    };

    if (user.role === 'doctor') {
      const doctor = await this._getDoctorProfileByUserId(user.id);
      filters.doctorId = doctor.id;
    }

    if (user.role === 'patient') {

      const [rows] = await db.execute(
        `
        SELECT id
        FROM patients
        WHERE user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [user.id]
      );

      if (!rows[0]) {
        throw new AppError('Patient profile not found', 404);
      }

      filters.patientId = rows[0].id;
    }
    const [data, total] = await Promise.all([
      AppointmentModel.findAll({
        limit,
        offset,
        ...filters
      }),
      AppointmentModel.countAll(filters)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async getAppointmentById(id, user) {

    const appointment = await this._findOrFail(id);

    await this._assertAppointmentAccess(appointment, user);

    return appointment;
  }

  /**
   * Book a new appointment.
   *
   * Business rules:
   * - Patient and doctor must exist, doctor must be active
   * - Appointment cannot be booked in the past
   * - end_time is derived from the doctor's appointment_duration
   * - Slot must not overlap an existing appointment for that doctor
   */
  async createAppointment(data, user){

    // If authenticated user is a patient, strictly associate appointment with their own profile
    if (user.role === 'patient') {
      const [patRows] = await db.execute(
        'SELECT id FROM patients WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
        [user.id]
      );
      if (!patRows[0]) {
        throw new AppError('Patient profile not found', 404);
      }
      if (data.patient_id && Number(data.patient_id) !== Number(patRows[0].id)) {
        throw new AppError('Patients can only book appointments for themselves', 403);
      }
      data.patient_id = patRows[0].id;
    }

    await this._assertPatientExists(data.patient_id);
    const doctor = await this._getActiveDoctorOrFail(data.doctor_id);
    if (user.role === 'doctor') {
      const doctorProfile = await this._getDoctorProfileByUserId(user.id);

      if (data.doctor_id !== doctorProfile.id) {
        throw new AppError(
          'Doctors can only create appointments for themselves',
          403
        );
      }
    }

    if (!doctor.appointment_duration) {
      throw new AppError(
        'Doctor appointment duration is not configured',
        500
      );
    }

    const requestedDateTime = new Date(
      `${data.appointment_date}T${data.start_time}`
    );

    if (Number.isNaN(requestedDateTime.getTime())) {
      throw new AppError('Invalid appointment date or start time', 400);
    }

    if (requestedDateTime <= new Date()) {
      throw new AppError('Cannot book an appointment in the past', 400);
    }

    // Verify doctor working schedule
    if (doctor.work_days) {
      const [y, m, d] = data.appointment_date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayOfWeek = dayNames[dateObj.getUTCDay()];
      const doctorWorkDays = doctor.work_days
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (!doctorWorkDays.includes(dayOfWeek)) {
        throw new AppError(
          'Doctor is not available on this day of the week',
          400
        );
      }
    }

    const endTime = this._addMinutes(
      data.start_time,
      doctor.appointment_duration
    );

    if (doctor.work_start && data.start_time < doctor.work_start) {
      throw new AppError('Appointment time is before doctor working hours', 400);
    }
    if (doctor.work_end && endTime > doctor.work_end) {
      throw new AppError('Appointment time is after doctor working hours', 400);
    }

    // Atomic transaction with FOR UPDATE row lock to prevent race conditions and double bookings
    const conn = await db.getConnection();
    let newId;

    try {
      await conn.beginTransaction();

      const [conflictRows] = await conn.execute(
        `
        SELECT id
        FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND status NOT IN ('cancelled', 'no_show')
          AND deleted_at IS NULL
          AND start_time < ?
          AND end_time > ?
        FOR UPDATE
        `,
        [data.doctor_id, data.appointment_date, endTime, data.start_time]
      );

      if (conflictRows.length > 0) {
        throw new AppError(
          'This doctor already has an appointment overlapping this time slot',
          409
        );
      }

      const temporaryCode = `TMP-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      const [insertRes] = await conn.execute(
        `
        INSERT INTO appointments (
          appointment_code,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          end_time,
          status,
          visit_type,
          chief_complaint,
          notes,
          booked_by
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
        `,
        [
          temporaryCode,
          data.patient_id,
          data.doctor_id,
          data.appointment_date,
          data.start_time,
          endTime,
          data.visit_type || 'new',
          data.chief_complaint || null,
          data.notes || null,
          user.id,
        ]
      );

      newId = insertRes.insertId;
      const appointmentCode = `APT-${String(newId).padStart(6, '0')}`;

      await conn.execute(
        `
        UPDATE appointments
        SET appointment_code = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        [appointmentCode, newId]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      // Handle MySQL InnoDB deadlocks or lock wait timeouts during concurrent booking attempts
      if (
        err.code === 'ER_LOCK_DEADLOCK' ||
        err.errno === 1213 ||
        err.code === 'ER_LOCK_WAIT_TIMEOUT' ||
        err.errno === 1205 ||
        (err.message && err.message.includes('Deadlock found when trying to get lock'))
      ) {
        throw new AppError(
          'This doctor already has an appointment overlapping this time slot',
          409
        );
      }
      throw err;
    } finally {
      conn.release();
    }

    const createdAppointment = await this._findOrFail(newId);
    this._dispatchBookingNotification(createdAppointment).catch(() => {});
    return createdAppointment;
  }

  /**
   * Reschedule an appointment to a new date/time.
   */
  async rescheduleAppointment(id, { appointment_date, start_time }, user) {

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);

    const requestedDateTime = new Date(
      `${appointment_date}T${start_time}`
    );

    if (Number.isNaN(requestedDateTime.getTime())) {
      throw new AppError('Invalid appointment date or start time', 400);
    }

    if (requestedDateTime <= new Date()) {
      throw new AppError('Cannot reschedule an appointment to the past', 400);
    }

    const doctor = await this._getActiveDoctorOrFail(
      appointment.doctor_id
    );

    if (!doctor.appointment_duration) {
      throw new AppError(
        'Doctor appointment duration is not configured',
        500
      );
    }

    const endTime = this._addMinutes(
      start_time,
      doctor.appointment_duration
    );

    await this._assertSlotIsFree({
      doctorId: appointment.doctor_id,
      date: appointment_date,
      startTime: start_time,
      endTime,
      excludeId: id
    });

    const rescheduled = await AppointmentModel.reschedule(id, {
      appointmentDate: appointment_date,
      startTime: start_time,
      endTime
    });

    if (!rescheduled) {
      throw new AppError('Failed to reschedule appointment', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Update appointment status (confirm, start, complete, no-show).
   */
  async updateStatus(id, status, user) {

    if (!STATUSES.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new AppError(
        `Cannot change status of an appointment that is already "${appointment.status}"`,
        422
      );
    }

    const updated = await AppointmentModel.updateStatus(id, status);

    if (!updated) {
      throw new AppError('Failed to update appointment status', 500);
    }

    const updatedAppointment = await this._findOrFail(id);
    this._dispatchStatusNotification(updatedAppointment, status).catch(() => {});

    return updatedAppointment;
  }

  /**
   * Cancel an appointment with a reason.
   */
  async cancelAppointment(id, reason, user) {

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new AppError(
        `Cannot cancel an appointment that is already "${appointment.status}"`,
        422
      );
    }

    const cancelled = await AppointmentModel.cancel(id, reason);

    if (!cancelled) {
      throw new AppError('Failed to cancel appointment', 500);
    }

    const cancelledAppointment = await this._findOrFail(id);
    this._dispatchCancellationNotification(cancelledAppointment, reason).catch(() => {});

    return cancelledAppointment;
  }

  /**
   * Soft delete an appointment record.
   */
  async deleteAppointment(id, user) {

    const appointment = await this._findOrFail(id);

    await this._assertAppointmentAccess(appointment, user);

    const deleted = await AppointmentModel.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete appointment', 500);
    }

    return { message: 'Appointment deleted successfully' };
  }

  /**
   * Helper to retrieve patient user record safely.
   */
  async _getPatientUserRecord(patientId) {
    try {
      const [rows] = await db.execute(
        'SELECT user_id, email, CONCAT(first_name, \' \', last_name) AS full_name FROM patients WHERE id = ? LIMIT 1',
        [patientId]
      );
      return rows[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to format date cleanly as YYYY-MM-DD.
   */
  _formatDateIso(dateVal) {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
      return `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;
    }
    return String(dateVal).split('T')[0];
  }

  /**
   * Asynchronous non-blocking dispatch for booking notification.
   */
  async _dispatchBookingNotification(appointment) {
    try {
      const pat = await this._getPatientUserRecord(appointment.patient_id);
      const dateStr = this._formatDateIso(appointment.appointment_date);
      const timeStr = String(appointment.start_time).substring(0, 5);

      if (pat?.user_id) {
        notificationStore.createNotification({
          user_id: pat.user_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: 'booking_submitted',
          title: 'Appointment Request Submitted',
          title_ar: 'تم إرسال طلب الموعد بنجاح',
          message: `Your booking request (${appointment.appointment_code}) on ${dateStr} at ${timeStr} with Dr. ${appointment.doctor_name} has been submitted and is pending receptionist review.`,
          message_ar: `تم استلام طلب حجز موعدك (${appointment.appointment_code}) بتاريخ ${dateStr} في تمام الساعة ${timeStr} مع د. ${appointment.doctor_name} وهو قيد مراجعة موظف الاستقبال.`,
          metadata: {
            appointment_code: appointment.appointment_code,
            date: dateStr,
            time: timeStr,
            doctor_name: appointment.doctor_name,
          },
        });
      }

      if (pat?.email) {
        await emailService.sendAppointmentBookingEmail({
          patientEmail: pat.email,
          patientName: appointment.patient_name || pat.full_name,
          appointmentCode: appointment.appointment_code,
          doctorName: appointment.doctor_name,
          date: dateStr,
          time: timeStr,
        });
      }
    } catch {
      // Non-blocking notification
    }
  }

  /**
   * Asynchronous non-blocking dispatch for status update notification.
   */
  async _dispatchStatusNotification(appointment, status) {
    try {
      const pat = await this._getPatientUserRecord(appointment.patient_id);
      const dateStr = this._formatDateIso(appointment.appointment_date);
      const timeStr = String(appointment.start_time).substring(0, 5);

      if (pat?.user_id) {
        let title = 'Appointment Status Updated';
        let title_ar = 'تحديث حالة الموعد';
        let message = `Your appointment (${appointment.appointment_code}) status has been updated to "${status}".`;
        let message_ar = `تم تحديث حالة موعدك (${appointment.appointment_code}) إلى "${status}".`;
        let notifType = 'status_change';

        if (status === 'confirmed') {
          title = 'Appointment Confirmed';
          title_ar = 'تم تأكيد موعدك الطبي';
          message = `Good news! Your appointment (${appointment.appointment_code}) with Dr. ${appointment.doctor_name} on ${dateStr} at ${timeStr} has been confirmed by the front desk.`;
          message_ar = `خبر سار! تم تأكيد موعدك الطبي (${appointment.appointment_code}) مع د. ${appointment.doctor_name} بتاريخ ${dateStr} في تمام الساعة ${timeStr} من قبل الاستقبال.`;
          notifType = 'booking_confirmed';
        } else if (status === 'in_progress') {
          title = 'Consultation In Progress';
          title_ar = 'بدء المعاينة الطبية';
          message = `Your consultation with Dr. ${appointment.doctor_name} is now in progress.`;
          message_ar = `جلسة المعاينة السريرية مع د. ${appointment.doctor_name} جارية الآن.`;
          notifType = 'consultation_started';
        } else if (status === 'completed') {
          title = 'Consultation Completed';
          title_ar = 'اكتملت المعاينة الطبية';
          message = `Your consultation with Dr. ${appointment.doctor_name} is completed. You can view diagnosis notes and prescriptions in your portal.`;
          message_ar = `اكتملت المعاينة الطبية مع د. ${appointment.doctor_name}. يمكنك الاطلاع على السجلات والنتائج والوصفات عبر البوابة.`;
          notifType = 'consultation_completed';
        }

        notificationStore.createNotification({
          user_id: pat.user_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: notifType,
          title,
          title_ar,
          message,
          message_ar,
          metadata: {
            appointment_code: appointment.appointment_code,
            status,
            date: dateStr,
            time: timeStr,
          },
        });
      }

      if (pat?.email) {
        await emailService.sendAppointmentStatusEmail({
          patientEmail: pat.email,
          patientName: appointment.patient_name || pat.full_name,
          appointmentCode: appointment.appointment_code,
          status,
          doctorName: appointment.doctor_name,
          date: dateStr,
          time: timeStr,
        });
      }
    } catch {
      // Non-blocking notification
    }
  }

  /**
   * Asynchronous non-blocking dispatch for cancellation notification.
   */
  async _dispatchCancellationNotification(appointment, reason) {
    try {
      const pat = await this._getPatientUserRecord(appointment.patient_id);
      const dateStr = this._formatDateIso(appointment.appointment_date);
      const timeStr = String(appointment.start_time).substring(0, 5);

      if (pat?.user_id) {
        notificationStore.createNotification({
          user_id: pat.user_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: 'booking_cancelled',
          title: 'Appointment Cancelled',
          title_ar: 'تم إلغاء الموعد',
          message: `Your appointment (${appointment.appointment_code}) on ${dateStr} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          message_ar: `تم إلغاء موعدك الطبي (${appointment.appointment_code}) بتاريخ ${dateStr}.${reason ? ` السبب: ${reason}` : ''}`,
          metadata: {
            appointment_code: appointment.appointment_code,
            reason,
            date: dateStr,
            time: timeStr,
          },
        });
      }

      if (pat?.email) {
        await emailService.sendAppointmentCancellationEmail({
          patientEmail: pat.email,
          patientName: appointment.patient_name || pat.full_name,
          appointmentCode: appointment.appointment_code,
          reason,
          doctorName: appointment.doctor_name,
          date: dateStr,
          time: timeStr,
        });
      }
    } catch {
      // Non-blocking notification
    }
  }
}

module.exports = new AppointmentService();