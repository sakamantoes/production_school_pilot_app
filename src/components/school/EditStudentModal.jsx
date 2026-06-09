// components/school/EditStudentModal.jsx
import React, { useState, useEffect } from 'react';
import { studentAPI, classAPI, sessionAPI, termAPI } from '../../services/schoolApi';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Key, 
  BookOpen, 
  AlertTriangle, 
  Trash2,
  RefreshCw,
  UserX,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = {
  PROFILE: 'profile',
  DANGER: 'danger',
};

// ─── Small reusable field wrapper ────────────────────────────────────────────
const Field = ({ label, error, children, required = false, icon: Icon }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      {children}
    </div>
    {error && (
      <div className="flex items-center space-x-1 mt-1">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )}
  </div>
);

const Input = ({ icon: Icon, error, className = '', ...props }) => (
  <input
    {...props}
    className={`
      w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200
      ${Icon ? 'pl-9' : 'pl-3'}
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
      }
      ${className}
    `}
  />
);

const Select = ({ icon: Icon, error, children, className = '', ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
    )}
    <select
      {...props}
      className={`
        w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 appearance-none
        ${Icon ? 'pl-9' : 'pl-3'}
        ${error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
        }
        ${className}
      `}
    >
      {children}
    </select>
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
  const [deleteType,    setDeleteType]    = useState('soft');
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
      errs.email = 'Please enter a valid email address';
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
      if (!payload.password) delete payload.password;
      await studentAPI.updateStudent(student.id, payload);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
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
    if (!enrollForm.classId)   errs.classId   = 'Please select a class';
    if (!enrollForm.armId)     errs.armId     = 'Please select a class arm';
    if (!enrollForm.sessionId) errs.sessionId = 'Please select an academic session';
    if (!enrollForm.termId)    errs.termId    = 'Please select a term';
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
      setEnrollSuccess('Student enrolled successfully!');
      setTimeout(() => setEnrollSuccess(''), 3000);
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
        await studentAPI.deleteStudent(student.id);
      } else {
        await studentAPI.permanentlyDeleteStudent(student.id);
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

  const tabClass = (tab) =>
    `px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      activeTab === tab
        ? 'bg-blue-50 text-blue-700 shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-5 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {student.user?.firstName ?? student.firstName} {student.user?.lastName ?? student.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Student ID: {student.studentId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 pt-3 flex gap-2 flex-shrink-0 bg-white">
          <button className={tabClass(TABS.PROFILE)} onClick={() => setActiveTab(TABS.PROFILE)}>
            Edit Profile
          </button>
          
          <button 
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === TABS.DANGER
                ? 'bg-red-50 text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-red-700 hover:bg-red-50'
            }`}
            onClick={() => setActiveTab(TABS.DANGER)}
          >
            Danger Zone
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          
          {/* PROFILE TAB */}
          {activeTab === TABS.PROFILE && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required icon={User} error={profileErrors.firstName}>
                  <Input
                    name="firstName"
                    icon={User}
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    placeholder="Enter first name"
                    error={profileErrors.firstName}
                  />
                </Field>
                <Field label="Last Name" required icon={User} error={profileErrors.lastName}>
                  <Input
                    name="lastName"
                    icon={User}
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    placeholder="Enter last name"
                    error={profileErrors.lastName}
                  />
                </Field>
              </div>

              <Field label="Email Address" required icon={Mail} error={profileErrors.email}>
                <Input
                  name="email"
                  type="email"
                  icon={Mail}
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="student@example.com"
                  error={profileErrors.email}
                />
              </Field>

              <Field label="Phone Number" icon={Phone} error={profileErrors.phone}>
                <Input
                  name="phone"
                  icon={Phone}
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="+1 234 567 8900"
                  error={profileErrors.phone}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Student ID" required icon={BookOpen} error={profileErrors.studentId}>
                  <Input
                    name="studentId"
                    icon={BookOpen}
                    value={profileForm.studentId}
                    onChange={handleProfileChange}
                    placeholder="STU-2024-001"
                    error={profileErrors.studentId}
                  />
                </Field>
                <Field label="Admission Year" required icon={Calendar} error={profileErrors.admissionYear}>
                  <Input
                    name="admissionYear"
                    type="number"
                    icon={Calendar}
                    min="1900"
                    max={new Date().getFullYear()}
                    value={profileForm.admissionYear}
                    onChange={handleProfileChange}
                    placeholder="2024"
                    error={profileErrors.admissionYear}
                  />
                </Field>
              </div>

              <Field label="New Password" icon={Key} error={profileErrors.password}>
                <Input
                  name="password"
                  type="password"
                  icon={Key}
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Leave blank to keep current"
                  error={profileErrors.password}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </Field>

              {profileErrors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{profileErrors.submit}</span>
                </div>
              )}
              
              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-in slide-in-from-top-1">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{profileSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                >
                  {profileLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ENROLL TAB */}
          {activeTab === TABS.ENROLL && (
            <form onSubmit={handleEnrollSubmit} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Enroll this student in a class for the current academic session. 
                    The student will be added to the selected class arm.
                  </p>
                </div>
              </div>

              <Field label="Academic Session" required icon={Calendar} error={enrollErrors.sessionId}>
                <Select
                  name="sessionId"
                  icon={Calendar}
                  value={enrollForm.sessionId}
                  onChange={handleEnrollChange}
                  error={enrollErrors.sessionId}
                >
                  <option value="">Select session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name || `${session.startYear} - ${session.endYear}`}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Term" required error={enrollErrors.termId}>
                <Select
                  name="termId"
                  value={enrollForm.termId}
                  onChange={handleEnrollChange}
                  error={enrollErrors.termId}
                >
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Class" required icon={BookOpen} error={enrollErrors.classId}>
                <Select
                  name="classId"
                  icon={BookOpen}
                  value={enrollForm.classId}
                  onChange={handleEnrollChange}
                  error={enrollErrors.classId}
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Class Arm" required error={enrollErrors.armId}>
                <Select
                  name="armId"
                  value={enrollForm.armId}
                  onChange={handleEnrollChange}
                  error={enrollErrors.armId}
                  disabled={!enrollForm.classId}
                >
                  <option value="">Select arm</option>
                  {arms.map((arm) => (
                    <option key={arm.id} value={arm.id}>
                      {arm.name}
                    </option>
                  ))}
                </Select>
                {!enrollForm.classId && arms.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Please select a class first</p>
                )}
              </Field>

              {enrollErrors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{enrollErrors.submit}</span>
                </div>
              )}
              
              {enrollSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-in slide-in-from-top-1">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{enrollSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                >
                  {enrollLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Enroll Student
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
         
          {/* DANGER ZONE TAB */}
          {activeTab === TABS.DANGER && (
            <div className="space-y-6">
              
              {/* Activate Section */}
              {isInactive && (
                <div className="border border-green-300 rounded-xl p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 mb-1">Reactivate Account</h3>
                      <p className="text-sm text-green-700 mb-3">
                        This student's account is currently deactivated. Reactivating will restore their login access.
                      </p>
                      <button
                        onClick={handleActivate}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                      >
                        {deleteLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Reactivate Student
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Soft Delete Section */}
              <div className="border border-orange-300 rounded-xl p-5 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <UserX className="w-5 h-5 text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 mb-1">Deactivate Account</h3>
                    <p className="text-sm text-orange-700 mb-3">
                      Disables the student's login access while keeping all their data — enrollments, results,
                      attendance, and payments — intact. This action can be reversed.
                    </p>
                    <button
                      onClick={() => { setDeleteType('soft'); setShowDeleteConfirm(true); setDeleteError(''); }}
                      disabled={isInactive || deleteLoading}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate Student
                    </button>
                    {isInactive && (
                      <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Account is already deactivated.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hard Delete Section */}
              <div className="border border-red-300 rounded-xl p-5 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-1">Permanently Delete Student</h3>
                    <p className="text-sm text-red-700 mb-3">
                      <strong className="font-semibold">⚠️ This cannot be undone.</strong> The student account and all associated data
                      (enrollments, results, attendance, payments) will be permanently removed from the system.
                    </p>
                    <button
                      onClick={() => { setDeleteType('hard'); setShowDeleteConfirm(true); setDeleteError(''); }}
                      disabled={deleteLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Permanently Delete
                    </button>
                  </div>
                </div>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{deleteError}</span>
                </div>
              )}

              {/* Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${deleteType === 'soft' ? 'bg-orange-100' : 'bg-red-100'}`}>
                        {deleteType === 'soft' ? (
                          <UserX className={`w-5 h-5 ${deleteType === 'soft' ? 'text-orange-600' : 'text-red-600'}`} />
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {deleteType === 'soft' ? 'Confirm Deactivation' : 'Confirm Permanent Deletion'}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">
                      {deleteType === 'soft'
                        ? `Type "${student.user?.firstName ?? student.firstName}" to confirm deactivation:`
                        : `Type "${student.user?.firstName ?? student.firstName}" to confirm permanent deletion:`}
                    </p>
                    
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={student.user?.firstName ?? student.firstName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                      autoFocus
                    />
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteLoading || deleteConfirm !== (student.user?.firstName ?? student.firstName)}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-all duration-200 font-medium ${
                          deleteType === 'soft'
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {deleteLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                            Processing...
                          </>
                        ) : (
                          deleteType === 'soft' ? 'Confirm Deactivate' : 'Confirm Delete'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;