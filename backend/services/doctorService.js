'use strict';

/**
 * DoctorService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Responsibilities:
 * - Apply business rules
 * - Validate business conditions
 * - Coordinate database operations
 * - Throw structured AppError exceptions
 */

const db = require('../config/database');
const DoctorModel = require('../models/doctor.model');
const AppError = require('../errors/AppError');

class DoctorService {

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
   * Find doctor or throw 404 error.
   */
  async _findOrFail(id) {

    const doctor = await DoctorModel.findById(id);

    if (!doctor) {
      throw new AppError(`Doctor with ID ${id} not found`, 404);
    }

    return doctor;
  }

  /**
   * Ensure the linked user account exists and has the doctor role.
   */
  async _assertUserIsDoctor(userId) {

    const [rows] = await db.execute(
      `
      SELECT
        id,
        role,
        is_active
      FROM users
      WHERE id = ?
      `,
      [userId]
    );
  
    const user = rows[0];
  
    if (!user) {
      throw new AppError(
        `User with ID ${userId} not found`,
        404
      );
    }
  
    if (!user.is_active) {
      throw new AppError(
        'User account is inactive',
        403
      );
    }
  
    if (user.role !== 'doctor') {
      throw new AppError(
        'Linked user account must have the "doctor" role',
        422
      );
    }
  
    return user;
  }
  
  async _assertSpecialtyExists(specialtyId) {

    const [rows] = await db.execute(
      `
      SELECT id
      FROM specialties
      WHERE id = ?
        AND is_active = 1
      `,
      [specialtyId]
    );

    if (!rows[0]) {
      throw new AppError(
        `Specialty with ID ${specialtyId} not found or inactive`,
        404
      );
    }

    return rows[0];
  }


  /**
   * Retrieve all doctors.
   *
   * Supports pagination, search, specialty and status filters.
   */
  async getAllDoctors(query = {}) {

    const { page, limit, offset } = this._parsePagination(query);

    const filters = {
      search: (query.search || '').trim(),
      specialtyId: query.specialty_id || null,
      isActive: query.is_active === '' || query.is_active === undefined
        ? undefined
        : query.is_active === '1' || query.is_active === true
    };

    const [doctors, total] = await Promise.all([
      DoctorModel.findAll({ limit, offset, ...filters }),
      DoctorModel.countAll(filters)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: doctors,
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

  /**
   * Retrieve one doctor by ID.
   */
  async getDoctorById(id) {
    return this._findOrFail(id);
  }

  /**
   * Create a doctor profile linked to an existing user account.
   *
   * Business rules:
   * - Linked user must exist and have role = 'doctor'
   * - A user can only have one doctor profile
   * - License number must be unique
   */
  async createDoctor(data) {

    await this._assertUserIsDoctor(data.user_id);
    await this._assertSpecialtyExists(data.specialty_id);

    const existingProfile = await DoctorModel.findByUserId(data.user_id);

    if (existingProfile) {
      throw new AppError(
        'This user already has a doctor profile',
        409
      );
    }

    const existingLicense = await DoctorModel.findByLicenseNumber(
      data.license_number
    );

    if (existingLicense) {
      throw new AppError(
        'A doctor with this license number already exists',
        409
      );
    }

    const newId = await DoctorModel.create(data);

    return await DoctorModel.findById(newId);
  }

  /**
   * Update existing doctor profile.
   */
  async updateDoctor(id, data, currentUser) {

    const doctor = await this._findOrFail(id);
  
    // Doctor can update only their own profile
    if (
      currentUser.role === 'doctor' &&
      doctor.user_id !== currentUser.id
    ) {
      throw new AppError(
        'Doctors can only update their own profile',
        403
      );
    }
  
    if (data.specialty_id !== undefined) {
      await this._assertSpecialtyExists(data.specialty_id);
    }
  
    if (data.license_number) {
  
      const duplicate = await DoctorModel.findByLicenseNumber(
        data.license_number,
        id
      );
  
      if (duplicate) {
        throw new AppError(
          'A doctor with this license number already exists',
          409
        );
      }
    }
  
    const updated = await DoctorModel.update(id, data);
  
    if (!updated) {
      throw new AppError('Failed to update doctor', 500);
    }
  
    return await DoctorModel.findById(id);
  }

  /**
   * Deactivate a doctor profile.
   *
   * Doctors are never hard-deleted since appointments
   * and medical records keep a foreign key reference.
   */
  async deleteDoctor(id) {

    await this._findOrFail(id);

    const deactivated = await DoctorModel.deactivate(id);

    if (!deactivated) {
      throw new AppError('Failed to deactivate doctor', 500);
    }

    return { message: 'Doctor deactivated successfully' };
  }

  /**
   * Helper to convert HH:MM:SS or HH:MM string to minutes from midnight.
   */
  _timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Helper to convert minutes from midnight to HH:MM:SS string.
   */
  _minutesToTime(totalMins) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  /**
   * Compute real schedule availability and available time slots for a doctor on a specific date.
   *
   * Rules:
   * - Validates date format (YYYY-MM-DD)
   * - Checks if day of week is an active work day in doctor.work_days
   * - Slices working window [work_start, work_end] into intervals of appointment_duration
   * - Checks overlap with existing non-cancelled appointments for that doctor on that date
   * - Marks past slots as unavailable if date is today
   */
  async getDoctorAvailability(doctorId, dateString) {
    const doctor = await this._findOrFail(doctorId);

    if (!doctor.is_active) {
      throw new AppError('This doctor is not currently active', 422);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString || !dateRegex.test(dateString)) {
      throw new AppError('Valid date in format YYYY-MM-DD is required', 400);
    }

    // Determine day of the week in UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];

    const doctorWorkDays = (doctor.work_days || '')
      .toLowerCase()
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const isWorkDay = doctorWorkDays.includes(dayOfWeek);
    const duration = Number(doctor.appointment_duration) || 30;
    const workStart = doctor.work_start || '09:00:00';
    const workEnd = doctor.work_end || '17:00:00';

    if (!isWorkDay) {
      return {
        doctorId: doctor.id,
        doctorName: doctor.full_name,
        specialtyId: doctor.specialty_id,
        specialtyName: doctor.specialty_name_en,
        specialtyNameAr: doctor.specialty_name_ar,
        consultationFee: doctor.consultation_fee,
        date: dateString,
        dayOfWeek,
        isWorkDay: false,
        durationMinutes: duration,
        workHours: {
          start: workStart,
          end: workEnd,
        },
        slots: [],
      };
    }

    // Generate potential intervals
    const slots = [];
    let currentMins = this._timeToMinutes(workStart);
    const endMins = this._timeToMinutes(workEnd);

    while (currentMins + duration <= endMins) {
      const start = this._minutesToTime(currentMins);
      const end = this._minutesToTime(currentMins + duration);
      slots.push({
        start_time: start,
        end_time: end,
        available: true,
      });
      currentMins += duration;
    }

    // Query active booked appointments on this date
    const [bookedRows] = await db.execute(
      `
      SELECT id, start_time, end_time, status
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND status NOT IN ('cancelled', 'no_show')
        AND deleted_at IS NULL
      `,
      [doctorId, dateString]
    );

    // Check if target date is today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateString === todayStr;
    const currentDayMinutes = now.getHours() * 60 + now.getMinutes();

    // Mark slot statuses
    for (const slot of slots) {
      const slotStartMins = this._timeToMinutes(slot.start_time);
      const slotEndMins = this._timeToMinutes(slot.end_time);

      if (isToday && slotStartMins <= currentDayMinutes) {
        slot.available = false;
        slot.reason = 'past';
        continue;
      }

      const isBooked = bookedRows.some((appt) => {
        const apptStartMins = this._timeToMinutes(appt.start_time);
        const apptEndMins = this._timeToMinutes(appt.end_time);
        return apptStartMins < slotEndMins && apptEndMins > slotStartMins;
      });

      if (isBooked) {
        slot.available = false;
        slot.reason = 'booked';
      }
    }

    return {
      doctorId: doctor.id,
      doctorName: doctor.full_name,
      specialtyId: doctor.specialty_id,
      specialtyName: doctor.specialty_name_en,
      specialtyNameAr: doctor.specialty_name_ar,
      consultationFee: doctor.consultation_fee,
      date: dateString,
      dayOfWeek,
      isWorkDay: true,
      durationMinutes: duration,
      workHours: {
        start: workStart,
        end: workEnd,
      },
      slots,
    };
  }
}

module.exports = new DoctorService();