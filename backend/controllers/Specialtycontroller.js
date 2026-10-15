'use strict';

const specialtyService = require('../services/Specialtyservice');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * SpecialtyController — Clean version (production style)
 *
 * • No try/catch
 * • No business logic
 * • Only request → service → response
 */
class SpecialtyController {

    getAll = asyncHandler(async (req, res) => {

        const activeOnly = req.query.active_only;
      
        const specialties = await specialtyService.getAllSpecialties(activeOnly);
      
        return ApiResponse.success(
          res,
          specialties,
          'Specialties retrieved successfully'
        );
      });

  getById = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.getSpecialtyById(req.params.id);

    return ApiResponse.success(
      res,
      specialty,
      'Specialty retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.createSpecialty(req.body);

    return ApiResponse.success(
      res,
      specialty,
      'Specialty created successfully',
      201
    );
  });

  update = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.updateSpecialty(
      req.params.id,
      req.body
    );

    return ApiResponse.success(
      res,
      specialty,
      'Specialty updated successfully'
    );
  });

  delete = asyncHandler(async (req, res) => {
    const result = await specialtyService.deleteSpecialty(req.params.id);

    return ApiResponse.success(
      res,
      result,
      result.message
    );
  });
}

module.exports = new SpecialtyController();