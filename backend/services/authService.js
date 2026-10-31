/**
 * Authentication Service
 * Manages user credential verification, password hashing, JWT token lifecycle,
 * and user profile queries.
 */

const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../config/database");
const AppError = require("../errors/AppError");

const JWT_SECRET     = process.env.JWT_SECRET     || "dev_secret_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ── Helpers ────────────────────────────────────────────────────────────────

// Sign a JWT token containing the user's id, email and role
const generateToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

// Fetch a user by id without exposing the password field, enriched with role-specific profile
// Fetch a user by id without exposing the password field, enriched with role-specific profile
const getSafeUser = async (id) => {
    // Select user attributes including contact phone number
    const [rows] = await db.query(
        "SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?",
        [id]
    );
    if (!rows[0]) return null;
    const user = rows[0];

    if (user.role === 'doctor') {
        const [docRows] = await db.query(
            `SELECT d.id AS doctor_id, d.specialty_id, d.license_number, d.consultation_fee,
                    d.bio, d.work_days, d.work_start, d.work_end, d.appointment_duration,
                    s.name AS specialty_name, s.name_ar AS specialty_name_ar, s.template_type, s.icon AS specialty_icon
             FROM doctors d
             JOIN specialties s ON d.specialty_id = s.id
             WHERE d.user_id = ?`,
            [user.id]
        );
        user.doctor = docRows[0] || null;
    } else if (user.role === 'patient') {
        const [patRows] = await db.query(
            `SELECT id AS patient_id, patient_code, first_name, last_name,
                    CONCAT(first_name, ' ', last_name) AS full_name, phone, blood_type, chronic_conditions, allergies
             FROM patients
             WHERE user_id = ? OR email = ?
             LIMIT 1`,
            [user.id, user.email]
        );
        user.patient = patRows[0] || null;
    }

    return user;
};

// ── Register ───────────────────────────────────────────────────────────────

/**
 * Register a new user with role-specific validation and account setup.
 * Patients are activated immediately and linked to a patient profile.
 * Doctors are set to pending approval (is_active = 0) until admin review.
 */
const register = async ({
    name,
    email,
    phone,
    password,
    role = "patient",
    specialty_id,
    license_number,
    verification_documents,
    notes
}) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Reject registration attempts for administrative or privileged roles
    if (['admin', 'receptionist', 'pharmacist'].includes(role)) {
        throw new AppError("Public registration is restricted to patients and doctors only", 403);
    }

    // Reject duplicate emails before hitting database constraint
    const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [cleanEmail]
    );

    if (existing.length > 0) {
        throw new AppError("This email is already registered", 409);
    }

    // Securely hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Doctor registration flow: requires active specialty and medical license
    if (role === 'doctor') {
        // Enforce the 5 approved active specialties
        const ACTIVE_SPECIALTY_IDS = [2, 4, 6, 8, 9];
        const specId = parseInt(specialty_id, 10);
        if (!ACTIVE_SPECIALTY_IDS.includes(specId)) {
            throw new AppError("Selected medical specialty is not currently eligible for registration", 400);
        }

        const cleanLicense = license_number ? license_number.trim() : '';
        if (!cleanLicense) {
            throw new AppError("Professional medical license number is required for doctor registration", 400);
        }

        // Check for duplicate doctor license number
        const [existingLicense] = await db.query(
            "SELECT id FROM doctors WHERE license_number = ?",
            [cleanLicense]
        );
        if (existingLicense.length > 0) {
            throw new AppError("A doctor with this license number already exists", 409);
        }

        // Create user with is_active = 0 (Pending admin review)
        const [userResult] = await db.query(
            "INSERT INTO users (name, email, phone, password, role, is_active) VALUES (?, ?, ?, ?, 'doctor', 0)",
            [cleanName, cleanEmail, cleanPhone, hashedPassword]
        );
        const newUserId = userResult.insertId;

        // Structured verification audit payload stored in bio
        const verificationPayload = JSON.stringify({
            status: 'pending',
            verification_documents: verification_documents || notes || 'Submitted credentials for licensing verification',
            notes: notes || null,
            submitted_at: new Date().toISOString()
        });

        // Insert pending doctor profile record
        await db.query(
            `INSERT INTO doctors (
                user_id, specialty_id, license_number, consultation_fee,
                bio, work_days, work_start, work_end, appointment_duration, is_active
            ) VALUES (?, ?, ?, 0, ?, 'sat,sun,mon,tue,wed', '09:00:00', '17:00:00', 30, 0)`,
            [newUserId, specId, cleanLicense, verificationPayload]
        );

        return {
            pending: true,
            user: {
                id: newUserId,
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                role: 'doctor',
                is_active: 0
            },
            message: 'Doctor registration request submitted successfully. Account is pending administrator approval.'
        };
    }

    // Patient registration flow: auto-activate and create linked patient profile
    const [userResult] = await db.query(
        "INSERT INTO users (name, email, phone, password, role, is_active) VALUES (?, ?, ?, ?, 'patient', 1)",
        [cleanName, cleanEmail, cleanPhone, hashedPassword]
    );
    const newUserId = userResult.insertId;

    // Parse full name into first and last name components
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0] || 'Patient';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const patientCode = `PAT-${Date.now().toString().slice(-6)}`;

    // Ensure linked patient demographic record exists
    const [existingPat] = await db.query(
        "SELECT id FROM patients WHERE user_id = ? OR email = ?",
        [newUserId, cleanEmail]
    );

    if (existingPat.length === 0) {
        await db.query(
            `INSERT INTO patients (
                first_name, last_name, patient_code, phone, email,
                status, user_id, created_by
            ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
            [firstName, lastName, patientCode, cleanPhone, cleanEmail, newUserId, newUserId]
        );
    } else {
        await db.query(
            "UPDATE patients SET user_id = ?, status = 'active' WHERE id = ?",
            [newUserId, existingPat[0].id]
        );
    }

    const user = await getSafeUser(newUserId);
    const token = generateToken(user);

    return { user, token };
};

// ── Login ──────────────────────────────────────────────────────────────────

/**
 * Authenticate credentials, verify account activation status,
 * and handle pending/rejected doctor states.
 */
const login = async ({ email, password }) => {
    const [rows] = await db.query(
        "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?",
        [email.toLowerCase().trim()]
    );

    // Constant error message for wrong email or invalid credentials
    if (rows.length === 0) {
        throw new AppError("Invalid email or password", 401);
    }

    const user = rows[0];

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    // Check account status and provide clear reason if inactive
    if (!user.is_active) {
        if (user.role === 'doctor') {
            const [docRows] = await db.query(
                "SELECT bio, is_active FROM doctors WHERE user_id = ?",
                [user.id]
            );
            const bio = docRows[0]?.bio || '';
            if (bio.includes('"status":"rejected"')) {
                throw new AppError(
                    "Your doctor registration request has been rejected. Please contact administration.",
                    403,
                    { code: 'ACCOUNT_REJECTED' }
                );
            }
            throw new AppError(
                "Your doctor account registration is pending administrator approval.",
                403,
                { code: 'ACCOUNT_PENDING' }
            );
        }
        throw new AppError("Your account has been deactivated", 403, { code: 'ACCOUNT_DEACTIVATED' });
    }

    // Enrich safe user profile and generate JWT
    const safeUser = await getSafeUser(user.id);
    const token = generateToken(safeUser);

    return { user: safeUser, token };
};

// ── Get current user ───────────────────────────────────────────────────────

const getMe = async (userId) => {
    return getSafeUser(userId);
};

module.exports = { register, login, getMe };