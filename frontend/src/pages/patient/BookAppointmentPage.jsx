/**
 * Guided Patient Appointment Booking Page
 * ----------------------------------------------------
 * Step-by-step guided appointment booking flow:
 * 1. Medical Specialty Selection (Active approved specialties)
 * 2. Doctor Selection
 * 3. Schedule Date & Real Time Slot Availability
 * 4. Clinical Visit Details (Chief Complaint, Visit Type, Notes)
 * 5. Review & Submit Request (Atomic backend concurrency protection)
 * 6. Confirmation Screen with Booking Code & Status
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import specialtyService from '../../services/specialtyService';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';

import Card from '../../components/common/Card';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Skeleton from '../../components/common/Skeleton';

import {
  CalendarIcon,
  ClockIcon,
  StethoscopeIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ShieldIcon,
  AlertCircleIcon,
} from '../../components/icons';

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Step state: 1: Specialty, 2: Doctor, 3: Date & Slot, 4: Details, 5: Review, 6: Success
  const [step, setStep] = useState(1);

  // Form selection state
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [visitType, setVisitType] = useState('new');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // Data fetching state
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState(null);

  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Confirmed created appointment state
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Helper date: Today & Min Date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch approved active specialties
  const loadSpecialties = useCallback(async () => {
    setLoadingSpecialties(true);
    setError(null);
    try {
      const res = await specialtyService.getAll({ active_only: 1 });
      // Only keep the 5 active complex specialties
      const approvedIds = [2, 4, 6, 8, 9];
      const filtered = (res.data || []).filter((s) => approvedIds.includes(s.id));
      setSpecialties(filtered);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل التخصصات الطبية' : 'Failed to load specialties'));
    } finally {
      setLoadingSpecialties(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  // Load doctors when specialty is selected
  const handleSelectSpecialty = async (spec) => {
    setSelectedSpecialty(spec);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setError(null);
    setLoadingDoctors(true);
    setStep(2);

    try {
      const res = await doctorService.getAll({ specialty_id: spec.id, is_active: 1, limit: 50 });
      setDoctors(res.data || []);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل قائمة الأطباء' : 'Failed to load doctors'));
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Select doctor and proceed to schedule step
  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate(todayStr);
    setSelectedSlot(null);
    setError(null);
    setStep(3);
  };

  // Fetch real slot availability when date or doctor changes
  const loadDoctorSlots = useCallback(
    async (docId, date) => {
      if (!docId || !date) return;
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const res = await doctorService.getAvailability(docId, date);
        setAvailability(res.data || null);
      } catch (err) {
        setError(err.message || (isAr ? 'فشل تحميل جدول المواعيد المتاحة' : 'Failed to load doctor slots'));
        setAvailability(null);
      } finally {
        setLoadingSlots(false);
      }
    },
    [isAr]
  );

  useEffect(() => {
    if (step === 3 && selectedDoctor?.id && selectedDate) {
      loadDoctorSlots(selectedDoctor.id, selectedDate);
    }
  }, [step, selectedDoctor, selectedDate, loadDoctorSlots]);

  // Submit appointment request with concurrency protection
  const handleSubmitBooking = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setError(isAr ? 'يرجى اختيار الطبيب والتاريخ والوقت' : 'Please select doctor, date, and time slot');
      return;
    }
    if (!chiefComplaint.trim()) {
      setError(isAr ? 'يرجى كتابة سبب الزيارة أو الشكوى الرئيسية' : 'Please enter chief complaint or reason for visit');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        visit_type: visitType,
        chief_complaint: chiefComplaint.trim(),
        notes: notes.trim() || undefined,
      };

      const res = await appointmentService.create(payload);
      setCreatedAppointment(res.data || res);
      setStep(6); // Success confirmation
    } catch (err) {
      if (err.statusCode === 409 || err.message?.includes('already has an appointment')) {
        setError(
          isAr
            ? 'تم حجز هذا الوقت للتو من قبل مريض آخر! يرجى اختيار وقت آخر متاح.'
            : 'This time slot was just booked by another patient! Please select another available slot.'
        );
        // Refresh availability
        loadDoctorSlots(selectedDoctor.id, selectedDate);
        setStep(3);
      } else {
        setError(err.message || (isAr ? 'فشل إرسال طلب الحجز' : 'Failed to submit appointment request'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: isAr ? 'التخصص' : 'Specialty' },
    { num: 2, label: isAr ? 'الطبيب' : 'Doctor' },
    { num: 3, label: isAr ? 'الموعد' : 'Schedule' },
    { num: 4, label: isAr ? 'البيانات' : 'Details' },
    { num: 5, label: isAr ? 'المراجعة' : 'Review' },
  ];

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', maxWidth: 860, margin: '0 auto', paddingBottom: 'var(--sp-10)' }}>
      {/* Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(13, 148, 136, 0.12))',
          borderColor: 'rgba(13, 148, 136, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon width={14} height={14} />
            {isAr ? 'بوابة المرضى — حجز موعد جديد' : 'Patient Portal — Book an Appointment'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'حجز موعد طبي إلكتروني' : 'Book a Medical Appointment'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? 'اختر التخصص، الطبيب المختص، والوقت المناسب لك لتقديم طلب الموعد'
              : 'Select your specialty, doctor, and preferred time to submit your booking request'}
          </p>
        </div>

        <Link to="/app/my-appointments">
          <Button variant="outline" size="sm">
            <span>{isAr ? 'عرض مواعيدي' : 'My Appointments'}</span>
          </Button>
        </Link>
      </div>

      {/* Stepper Wizard Progress Bar */}
      {step <= 5 && (
        <div
          className="card pad"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 18px',
          }}
        >
          {stepsHeader.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: isCurrent || isCompleted ? 1 : 0.45,
                  cursor: isCompleted ? 'pointer' : 'default',
                }}
                onClick={() => isCompleted && setStep(s.num)}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isCompleted
                      ? 'var(--brand)'
                      : isCurrent
                      ? 'var(--brand)'
                      : 'var(--bg-surface-alt)',
                    color: isCompleted || isCurrent ? '#fff' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--brand)' : 'var(--ink)',
                  }}
                >
                  {s.label}
                </span>
                {s.num < 5 && (
                  <span style={{ color: 'var(--text-tertiary)', marginInlineStart: 8 }}>
                    {isAr ? '‹' : '›'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Error Alert */}
      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* STEP 1: SELECT SPECIALTY */}
      {step === 1 && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StethoscopeIcon width={18} height={18} />
              <span>{isAr ? 'الخطوة 1: اختر التخصص الطبي' : 'Step 1: Choose Medical Specialty'}</span>
            </div>
          }
        >
          {loadingSpecialties ? (
            <div className="stack" style={{ gap: 12 }}>
              <Skeleton variant="text" height={24} width="40%" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                <Skeleton variant="card" height={100} />
                <Skeleton variant="card" height={100} />
                <Skeleton variant="card" height={100} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {specialties.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => handleSelectSpecialty(spec)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--r-md)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: 24 }}>
                    {spec.id === 2 ? '🦷' : spec.id === 4 ? '👁️' : spec.id === 6 ? '🧪' : spec.id === 8 ? '🩻' : '🦴'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                    {isAr ? spec.name_ar : spec.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {isAr ? 'عيادات متخصصة وأطباء معتمدون' : 'Specialized clinics & verified doctors'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: SELECT DOCTOR */}
      {step === 2 && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StethoscopeIcon width={18} height={18} />
                <span>
                  {isAr ? `الخطوة 2: اختر الطبيب — ${selectedSpecialty?.name_ar}` : `Step 2: Choose Doctor — ${selectedSpecialty?.name}`}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStep(1)}>
                {isAr ? '← تغيير التخصص' : '← Change Specialty'}
              </Button>
            </div>
          }
        >
          {loadingDoctors ? (
            <div className="stack" style={{ gap: 12 }}>
              <Skeleton variant="card" height={90} />
              <Skeleton variant="card" height={90} />
            </div>
          ) : doctors.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
              {isAr ? 'لا يوجد أطباء متاحون حالياً في هذا التخصص.' : 'No active doctors available in this specialty right now.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--r-md)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand)';
                    e.currentTarget.style.background = 'var(--brand-soft)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--brand)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {doc.full_name ? doc.full_name.charAt(0) : 'D'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                        {doc.full_name}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {isAr ? doc.specialty_name_ar : doc.specialty_name_en} · 📜 {doc.license_number}
                      </div>
                      {doc.work_days && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          🗓 {isAr ? 'أيام الدوام:' : 'Days:'} {doc.work_days.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)' }}>
                      {Number(doc.consultation_fee || 0).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      ⏱ {doc.appointment_duration || 30} {isAr ? 'دقيقة' : 'mins'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: SELECT DATE & TIME SLOT */}
      {step === 3 && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockIcon width={18} height={18} />
                <span>
                  {isAr ? `الخطوة 3: حدد اليوم والوقت — د. ${selectedDoctor?.full_name}` : `Step 3: Schedule with Dr. ${selectedDoctor?.full_name}`}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStep(2)}>
                {isAr ? '← تغيير الطبيب' : '← Change Doctor'}
              </Button>
            </div>
          }
        >
          <div className="stack" style={{ gap: 20 }}>
            {/* Date Picker Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                {isAr ? 'اختر تاريخ الموعد:' : 'Select Appointment Date:'}
              </label>
              <input
                type="date"
                className="input"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: 'auto', minWidth: 180, fontWeight: 600 }}
              />
            </div>

            {/* Availability Slots Grid */}
            {loadingSlots ? (
              <div className="stack" style={{ gap: 10 }}>
                <Skeleton variant="text" height={20} width="35%" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </div>
              </div>
            ) : !availability?.isWorkDay ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-surface-alt)',
                  border: '1px dashed var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>🗓️</div>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {isAr ? 'الطبيب غير متاح في هذا اليوم' : 'Doctor is not scheduled on this day'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {isAr ? 'أيام العمل الرسمية للطبيب:' : 'Official work days:'}{' '}
                  <strong>{selectedDoctor?.work_days?.toUpperCase()}</strong>.
                </div>
              </div>
            ) : availability.slots.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-secondary)' }}>
                {isAr ? 'لا توجد فترات عمل محددة لهذا اليوم.' : 'No working shifts configured for this day.'}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {isAr ? 'الأوقات المتاحة للحجز (المدة لكل موعد 30 دقيقة):' : 'Available Time Slots (30 min duration):'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: 8 }}>
                  {availability.slots.map((slot) => {
                    const isSelected = selectedSlot?.start_time === slot.start_time;
                    const cleanStart = slot.start_time?.substring(0, 5);
                    const cleanEnd = slot.end_time?.substring(0, 5);

                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 'var(--r-sm)',
                          border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border)',
                          background: isSelected
                            ? 'var(--brand)'
                            : slot.available
                            ? 'var(--bg-surface)'
                            : 'var(--bg-surface-alt)',
                          color: isSelected
                            ? '#fff'
                            : slot.available
                            ? 'var(--ink)'
                            : 'var(--text-tertiary)',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          fontWeight: 700,
                          fontSize: 12.5,
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <span>{cleanStart}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>
                          {slot.available ? `${cleanStart}–${cleanEnd}` : slot.reason === 'past' ? (isAr ? 'منتهي' : 'Past') : (isAr ? 'محجوز' : 'Booked')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Proceed to Details Button */}
            {selectedSlot && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <Button variant="primary" onClick={() => setStep(4)}>
                  <span>{isAr ? 'متابعة إلى تفاصيل الزيارة ←' : 'Continue to Visit Details →'}</span>
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* STEP 4: VISIT DETAILS */}
      {step === 4 && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldIcon width={18} height={18} />
                <span>{isAr ? 'الخطوة 4: سبب الزيارة والشكوى الرئيسية' : 'Step 4: Visit Details & Chief Complaint'}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStep(3)}>
                {isAr ? '← تغيير الوقت' : '← Change Time'}
              </Button>
            </div>
          }
        >
          <div className="stack" style={{ gap: 16 }}>
            {/* Visit Type */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                {isAr ? 'نوع الزيارة:' : 'Visit Type:'}
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'new', label: isAr ? 'كشف جديد' : 'New Consultation' },
                  { id: 'follow_up', label: isAr ? 'مراجعة / استشارة سابقة' : 'Follow-up' },
                  { id: 'emergency', label: isAr ? 'حالة مستعجلة' : 'Urgent' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setVisitType(type.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--r-sm)',
                      border: visitType === type.id ? '2px solid var(--brand)' : '1px solid var(--border)',
                      background: visitType === type.id ? 'var(--brand-soft)' : 'var(--bg-surface)',
                      color: visitType === type.id ? 'var(--brand)' : 'var(--ink)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                {isAr ? 'سبب الزيارة أو الشكوى الطبية (مطلوب):' : 'Reason for Visit / Chief Complaint (Required):'}
              </label>
              <textarea
                className="input"
                rows={3}
                required
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: ألم في الأسنان السفلية منذ يومين، أو فحص دوري للنظر...'
                    : 'e.g. Mild pain in lower right tooth for two days, routine eye check...'
                }
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                {isAr ? 'ملاحظات إضافية للطبيب أو الاستقبال (اختياري):' : 'Additional Notes (Optional):'}
              </label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'أي معلومات مساعدة أخرى...' : 'Any previous visits or specific requests...'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                variant="primary"
                disabled={!chiefComplaint.trim()}
                onClick={() => setStep(5)}
              >
                <span>{isAr ? 'مراجعة وتأكيد الطلب ←' : 'Review & Confirm →'}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {step === 5 && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleIcon width={18} height={18} />
                <span>{isAr ? 'الخطوة 5: مراجعة وإرسال طلب الحجز' : 'Step 5: Review & Submit Booking'}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStep(4)}>
                {isAr ? '← تعديل' : '← Edit'}
              </Button>
            </div>
          }
        >
          <div className="stack" style={{ gap: 18 }}>
            {/* Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                padding: '16px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'المريض:' : 'Patient:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{user?.name}</div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'التخصص الطبي:' : 'Specialty:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {isAr ? selectedSpecialty?.name_ar : selectedSpecialty?.name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'الطبيب:' : 'Doctor:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brand)' }}>
                  {selectedDoctor?.full_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'تاريخ الموعد:' : 'Date:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {selectedDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'الوقت المحجوز:' : 'Time Slot:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {selectedSlot?.start_time?.substring(0, 5)} – {selectedSlot?.end_time?.substring(0, 5)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{isAr ? 'أجور الاستشارة:' : 'Fee:'}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {Number(selectedDoctor?.consultation_fee || 0).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'الشكوى الرئيسية:' : 'Chief Complaint:'}</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', marginTop: 2 }}>{chiefComplaint}</div>
            </div>

            {/* Hybrid Booking Approval Notice */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 18 }}>ℹ️</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>
                {isAr
                  ? 'سيتم إرسال هذا الطلب إلى موظف الاستقبال في مجمع فيتا الطبي لمراجعته واعتماده. ستتلقى إشعاراً داخل البوابة فور تأكيد الموعد.'
                  : 'This booking request will be received by Vita Medical Complex front desk for review and confirmation. You will receive an in-app notification once confirmed.'}
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="outline" onClick={() => setStep(4)} disabled={submitting}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleSubmitBooking} disabled={submitting}>
                {submitting
                  ? isAr
                    ? 'جاري إرسال الطلب...'
                    : 'Submitting...'
                  : isAr
                  ? '✓ تأكيد وإرسال طلب الموعد'
                  : '✓ Confirm & Submit Request'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: CONFIRMATION SUCCESS */}
      {step === 6 && createdAppointment && (
        <Card>
          <div style={{ textAlign: 'center', padding: '30px 16px' }} className="stack">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
              {isAr ? 'تم إرسال طلب الموعد بنجاح!' : 'Appointment Request Submitted Successfully!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 500, margin: '0 auto' }}>
              {isAr
                ? 'تم تسجيل طلبك وحجزه بنجاح، وهو الآن قيد مراجعة موظف الاستقبال لتأكيده.'
                : 'Your booking has been received and is currently pending receptionist review.'}
            </p>

            {/* Appointment Badge Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 'var(--r-full)',
                background: 'var(--brand-soft)',
                color: 'var(--brand)',
                fontWeight: 800,
                fontSize: 16,
                margin: '16px auto',
              }}
            >
              <span>{createdAppointment.appointment_code}</span>
              <Badge variant="pending">{isAr ? 'قيد المراجعة' : 'Pending Review'}</Badge>
            </div>

            {/* Details snippet */}
            <div
              style={{
                maxWidth: 450,
                margin: '0 auto',
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border)',
                textAlign: isAr ? 'right' : 'left',
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <div>
                <strong>{isAr ? 'الطبيب:' : 'Doctor:'}</strong> {selectedDoctor?.full_name} (
                {isAr ? selectedSpecialty?.name_ar : selectedSpecialty?.name})
              </div>
              <div>
                <strong>{isAr ? 'التاريخ والوقت:' : 'Date & Time:'}</strong> {selectedDate} ·{' '}
                {selectedSlot?.start_time?.substring(0, 5)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <Link to="/app/my-appointments">
                <Button variant="primary">
                  <span>{isAr ? 'عرض مواعيدي' : 'View My Appointments'}</span>
                </Button>
              </Link>
              <Link to="/app">
                <Button variant="outline">
                  <span>{isAr ? 'العودة للرئيسية' : 'Return to Dashboard'}</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
