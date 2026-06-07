// components/school/EditStudentModal.jsx
import React, { useState, useEffect } from 'react';
import { studentAPI, classAPI, sessionAPI, termAPI } from '../../services/schoolApi';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = {
  PROFILE:  'profile',
  ENROLL:   'enroll',
  DANGER:   'danger',
};

// ─── Small reusable field wrapper ────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const EditStudentModal = ({ student, onSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    firstName:     student.user?.firstName     ?? student.firstName     ?? '',
    lastName:      student.user?.lastName      ?? student.lastName      ?? '',
    email:         student.user?.email         ?? student.email         ?? '',
    phone:         student.user?.phone         ?? student.phone         ?? '',
    studentId:     student.studentId           ?? '',
    admissionYear: student.admissionYear       ?? '',
    password:      '',
  });
  const [profileErrors,  setProfileErrors]  = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // ── Enroll state ───────────────────────────────────────────────────────────
  const [classes,  setClasses]  = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms,    setTerms]    = useState([]);
  const [arms,     setArms]     = useState([]);
  const [enrollForm, setEnrollForm] = useState({
    studentId: student.id,
    classId:   '',
    armId:     '',
    sessionId: '',
    termId:    '',
  });
  const [enrollErrors,  setEnrollErrors]  = useState({});
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState('');

  // ── Danger state ───────────────────────────────────────────────────────────
  const [deleteType,    setDeleteType]    = useState('soft'); // 'soft' | 'hard'
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError,   setDeleteError]   = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Fetch reference data when Enroll tab is active ────────────────────────
  useEffect(() => {
    if (activeTab === TABS.ENROLL) {
      fetchClasses();
      fetchSessions();
      fetchTerms();
    }
  }, [activeTab]);

  // Derive arms from selected class (no extra API call needed)
  useEffect(() => {
    if (!enrollForm.classId) {
      setArms([]);
      return;
    }
    const selectedClass = classes.find((c) => String(c.id) === String(enrollForm.classId));
    setArms(selectedClass?.arms ?? []);
    setEnrollForm((prev) => ({ ...prev, armId: '' }));
  }, [enrollForm.classId, classes]);

  const fetchClasses = async () => {
    try {
      const res = await classAPI.getClasses();
      const data = res.data ?? res ?? [];
      setClasses(Array.isArray(data) ? data : []);
    } catch { setClasses([]); }
  };

  const fetchSessions = async () => {
    try {
      const res = await sessionAPI.getSessions();
      const data = res.data ?? res ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
  };

  const fetchTerms = async () => {
    try {
      const res = await termAPI.getTerms();
      const data = res.data ?? res ?? [];
      setTerms(Array.isArray(data) ? data : []);
    } catch { setTerms([]); }
  };

  // ── Profile handlers ───────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    setProfileSuccess('');
  };

  const validateProfile = () => {
    const errs = {};
    if (!profileForm.firstName.trim()) errs.firstName = 'First name is required';
    if (!profileForm.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!profileForm.email.trim())     errs.email     = 'Email is required';
    if (profileForm.email && !/\S+@\S+\.\S+/.test(profileForm.email))
      errs.email = 'Invalid email address';
    if (!profileForm.studentId.trim()) errs.studentId = 'Student ID is required';
    if (!profileForm.admissionYear)    errs.admissionYear = 'Admission year is required';
    if (profileForm.password && profileForm.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true);
    setProfileSuccess('');
    try {
      const payload = { ...profileForm };
      if (!payload.password) delete payload.password; // don't send empty password
      await studentAPI.updateStudent(student.id, payload);
      setProfileSuccess('Student profile updated successfully.');
      onSuccess?.('update');
    } catch (err) {
      setProfileErrors({ submit: err.response?.data?.message || 'Failed to update student' });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Enroll handlers ────────────────────────────────────────────────────────
  const handleEnrollChange = (e) => {
    const { name, value } = e.target;
    setEnrollForm((prev) => ({ ...prev, [name]: value }));
    if (enrollErrors[name]) setEnrollErrors((prev) => ({ ...prev, [name]: '' }));
    setEnrollSuccess('');
  };

  const validateEnroll = () => {
    const errs = {};
    if (!enrollForm.classId)   errs.classId   = 'Class is required';
    if (!enrollForm.armId)     errs.armId     = 'Class arm is required';
    if (!enrollForm.sessionId) errs.sessionId = 'Session is required';
    if (!enrollForm.termId)    errs.termId    = 'Term is required';
    return errs;
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    const errs = validateEnroll();
    if (Object.keys(errs).length) { setEnrollErrors(errs); return; }

    setEnrollLoading(true);
    setEnrollSuccess('');
    try {
      await studentAPI.enrollStudent(enrollForm);
      setEnrollSuccess('Student enrolled successfully.');
      onSuccess?.('enroll');
    } catch (err) {
      setEnrollErrors({ submit: err.response?.data?.message || 'Failed to enroll student' });
    } finally {
      setEnrollLoading(false);
    }
  };

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      if (deleteType === 'soft') {
        await studentAPI.deleteStudent(student.id);          // DELETE /students/:id/deactivate
      } else {
        await studentAPI.permanentlyDeleteStudent(student.id); // DELETE /students/:id
      }
      onSuccess?.(deleteType === 'soft' ? 'deactivate' : 'delete');
      onClose();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleActivate = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await studentAPI.activateStudent(student.id);
      onSuccess?.('activate');
      onClose();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to activate student');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isInactive = student.user?.isActive === false;

  // ── Shared tab button style ────────────────────────────────────────────────
  const tabClass = (tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Modal header ── */}
        <div className="border-b px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {student.user?.firstName ?? student.firstName} {student.user?.lastName ?? student.lastName}
            </h2>
            <p className="text-sm text-gray-500">Student ID: {student.studentId}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b px-6 flex gap-1 flex-shrink-0">
          <button className={tabClass(TABS.PROFILE)} onClick={() => setActiveTab(TABS.PROFILE)}>
            Edit Profile
          </button>
          <button className={tabClass(TABS.ENROLL)} onClick={() => setActiveTab(TABS.ENROLL)}>
            Enroll / Re-enroll
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === TABS.DANGER
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-red-500'
            }`}
            onClick={() => setActiveTab(TABS.DANGER)}
          >
            Danger Zone
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ════════════════ PROFILE TAB ════════════════ */}
          {activeTab === TABS.PROFILE && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" error={profileErrors.firstName}>
                  <input
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
                <Field label="Last Name *" error={profileErrors.lastName}>
                  <input
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
              </div>

              <Field label="Email *" error={profileErrors.email}>
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <Field label="Phone" error={profileErrors.phone}>
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Student ID *" error={profileErrors.studentId}>
                  <input
                    name="studentId"
                    value={profileForm.studentId}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
                <Field label="Admission Year *" error={profileErrors.admissionYear}>
                  <input
                    name="admissionYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={profileForm.admissionYear}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
              </div>

              <Field label="New Password (leave blank to keep current)" error={profileErrors.password}>
                <input
                  name="password"
                  type="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              {profileErrors.submit && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {profileErrors.submit}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                  {profileSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ════════════════ ENROLL TAB ════════════════ */}
          {activeTab === TABS.ENROLL && (
            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                Enrolling will create or update this student's placement for the selected session.
                One enrollment per session is allowed.
              </p>

              {/* Class */}
              <Field label="Class *" error={enrollErrors.classId}>
                <select
                  name="classId"
                  value={enrollForm.classId}
                  onChange={handleEnrollChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </Field>

              {/* Arm — derived from selected class, no extra request */}
              <Field label="Class Arm *" error={enrollErrors.armId}>
                <select
                  name="armId"
                  value={enrollForm.armId}
                  onChange={handleEnrollChange}
                  disabled={!enrollForm.classId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Class Arm</option>
                  {arms.map((arm) => (
                    <option key={arm.id} value={arm.id}>{arm.name}</option>
                  ))}
                </select>
                {enrollForm.classId && arms.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">No arms available for this class</p>
                )}
              </Field>

              {/* Session */}
              <Field label="Academic Session *" error={enrollErrors.sessionId}>
                <select
                  name="sessionId"
                  value={enrollForm.sessionId}
                  onChange={handleEnrollChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>

              {/* Term */}
              <Field label="Term *" error={enrollErrors.termId}>
                <select
                  name="termId"
                  value={enrollForm.termId}
                  onChange={handleEnrollChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Term</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>

              {enrollErrors.submit && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {enrollErrors.submit}
                </div>
              )}
              {enrollSuccess && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                  {enrollSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {enrollLoading ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          )}

          {/* ════════════════ DANGER ZONE TAB ════════════════ */}
          {activeTab === TABS.DANGER && (
            <div className="space-y-6">

              {/* ── Activate (if deactivated) ── */}
              {isInactive && (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-1">Reactivate Account</h3>
                  <p className="text-sm text-green-700 mb-3">
                    This student's account is currently deactivated. Reactivating will restore their login access.
                  </p>
                  <button
                    onClick={handleActivate}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
                  >
                    {deleteLoading ? 'Activating...' : 'Reactivate Student'}
                  </button>
                </div>
              )}

              {/* ── Soft delete (deactivate) ── */}
              <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-orange-800 mb-1">Deactivate Account</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Disables the student's login access while keeping all their data — enrollments, results,
                  attendance, and payments — intact. This action can be reversed.
                </p>
                <button
                  onClick={() => { setDeleteType('soft'); setShowDeleteConfirm(true); setDeleteError(''); }}
                  disabled={isInactive || deleteLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Deactivate Student
                </button>
                {isInactive && (
                  <p className="mt-2 text-xs text-orange-600">Account is already deactivated.</p>
                )}
              </div>

              {/* ── Hard delete ── */}
              <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-1">Permanently Delete Student</h3>
                <p className="text-sm text-red-700 mb-3">
                  <strong>This cannot be undone.</strong> The student account and all associated data
                  (enrollments, results, attendance, payments) will be permanently removed from the system.
                </p>
                <button
                  onClick={() => { setDeleteType('hard'); setShowDeleteConfirm(true); setDeleteError(''); }}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm transition-colors"
                >
                  Permanently Delete
                </button>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {deleteError}
                </div>
              )}

              {/* ── Confirmation prompt ── */}
              {showDeleteConfirm && (
                <div className="border-2 border-red-500 rounded-lg p-4 bg-white">
                  <h3 className="font-bold text-red-700 mb-2">
                    {deleteType === 'soft' ? 'Confirm Deactivation' : 'Confirm Permanent Deletion'}
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    {deleteType === 'soft'
                      ? `Type the student's first name to confirm deactivation:`
                      : `Type the student's first name to confirm permanent deletion:`}
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={student.user?.firstName ?? student.firstName}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={
                        deleteLoading ||
                        deleteConfirm !== (student.user?.firstName ?? student.firstName)
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                      {deleteLoading
                        ? 'Processing...'
                        : deleteType === 'soft' ? 'Confirm Deactivate' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>{/* end scrollable body */}
      </div>
    </div>
  );
};

export default EditStudentModal;