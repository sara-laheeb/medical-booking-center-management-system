'use strict';

/**
 * PatientService
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
 *
 * This layer is framework independent:
 * No req/res usage is allowed here.
 */

const PatientModel = require('../models/patient.model');
const AppError = require('../errors/AppError');

class PatientService {

  /**
   * Normalize pagination parameters.
   *
   * Converts user input into safe values
   * and prepares database offset.
   */
  _parsePagination({ page = 1, limit = 10 }) {

    const parsedPage = Math.max(
      1,
      parseInt(page, 10) || 1
    );

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
   * Find patient or throw 404 error.
   *
   * Prevents duplicated existence checks
   * across service methods.
   */
  async _findOrFail(id) {

    const patient = await PatientModel.findById(id);

    if (!patient || patient.deleted_at) {
      throw new AppError(
        `Patient with ID ${id} not found`,
        404
      );
    }

    return patient;
  }

  /**
   * Retrieve all patients.
   *
   * Supports:
   * - Pagination
   * - Search
   * - Status filtering
   */
  async getAllPatients(query = {}) {

    const {
      page,
      limit,
      offset
    } = this._parsePagination(query);

    const filters = {
      search: (query.search || '').trim()
      
    };

    const [
      patients,
      total
    ] = await Promise.all([
      PatientModel.findAll({
        limit,
        offset,
        ...filters
      }),
      PatientModel.countAll(filters)
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(total / limit)
    );

    return {
      data: patients,
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
   * Retrieve one patient by ID.
   */
  async getPatientById(id) {
    return this._findOrFail(id);
  }

  /**
   * Create new patient.
   *
   * Business rules:
   * - National ID must be unique
   * - Email must be unique when provided
   * - Generate patient code automatically
   */
  async createPatient(data, createdBy) {

    const existingNid =
      await PatientModel.findByNationalId(
        data.national_id
      );

    if (existingNid) {
      throw new AppError(
        'A patient with this National ID already exists',
        409
      );
    }

    if (data.email) {

      const existingEmail =
        await PatientModel.findByEmail(data.email);

      if (existingEmail) {
        throw new AppError(
          'A patient with this email already exists',
          409
        );
      }
    }

    const patientCode =
      await PatientModel.generatePatientCode();

    const newId =
      await PatientModel.create({
        ...data,
        patient_code: patientCode,
        created_by: createdBy
      });

    return PatientModel.findById(newId);
  }

  /**
   * Update existing patient.
   *
   * Checks uniqueness while excluding
   * the current patient record.
   */
  async updatePatient(id, data) {

    await this._findOrFail(id);

    if (data.national_id) {

      const duplicate =
        await PatientModel.findByNationalId(
          data.national_id,
          id
        );

      if (duplicate) {
        throw new AppError(
          'A patient with this National ID already exists',
          409
        );
      }
    }

    if (data.email) {

      const duplicate =
        await PatientModel.findByEmail(
          data.email,
          id
        );

      if (duplicate) {
        throw new AppError(
          'A patient with this email already exists',
          409
        );
      }
    }

    const updated = await PatientModel.update(
      id,
      data
    );
    
    if (!updated) {
      throw new AppError(
        'Failed to update patient',
        500
      );
    }
    
    return PatientModel.findById(id);
  }

  /**
   * Soft delete patient.
   *
   * Keeps patient record for future
   * appointments and medical history.
   */
  async deletePatient(id) {

    await this._findOrFail(id);

    const deleted = await PatientModel.softDelete(id);

    if (!deleted) {
      throw new AppError(
        'Failed to delete patient',
        500
      );
    }
    
    return {
      message: 'Patient deleted successfully'
    };
  }

}

module.exports = new PatientService();