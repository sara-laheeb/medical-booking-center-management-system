/**
 * Central API Router Aggregator
 * Mounts all module routes under `/api/v1/` for authentication, patients,
 * specialties, doctors, appointments, medical records, medications, pharmacy,
 * invoices, financial reports, dashboard statistics, prescriptions, and billing.
 */

const express = require("express");

const authRoutes        = require("./authRoutes");
const patientRoutes     = require("./patientRoutes");
const specialtyRoutes   = require("./specialtyRoutes");
const doctorRoutes      = require("./doctorRoutes");
const appointmentRoutes = require("./AppointmentRoute");
const recordRoutes      = require("./recordRoutes");
const medicationRoutes  = require("./Medicationroutes");
const pharmacyRoutes    = require("./Pharmacyroutes");
const invoiceRoutes     = require("./invoiceRoutes");
const financialRoutes   = require("./Financialroutes");
const dashboardRoutes   = require("./Dashboardroutes");
const prescriptionRoutes = require('./Prescriptionroutes');
const billingRoutes = require('./Billing.routes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

// Auth system
router.use("/auth", authRoutes);

// Patients systemPrescription
router.use("/patients", patientRoutes);

// Specialties system (reference data used by Doctors)
router.use("/specialties", specialtyRoutes);

// Doctors system
router.use("/doctors", doctorRoutes);

// Appointments system
router.use("/appointments", appointmentRoutes);

// Medical records system
router.use("/records", recordRoutes);

// Medications system (catalog + stock)
router.use("/medications", medicationRoutes);

// Pharmacy system (prescriptions)
router.use("/pharmacy", pharmacyRoutes);

// Invoices system
router.use("/invoices", invoiceRoutes);

// Financial system (expenses + summary report)
router.use("/financial", financialRoutes);

// Dashboard system (cross-module statistics)
router.use("/dashboard", dashboardRoutes);

router.use('/prescriptions', prescriptionRoutes);

router.use('/billing', billingRoutes);

// User Management (Permissions & Accounts — Manager only)
router.use('/users', userRoutes);

// In-App Notifications & Reminders
router.use('/notifications', notificationRoutes);

module.exports = router;