// components/school/EnrollStudentModal.jsx
import React, { useState, useEffect } from 'react';
import { classAPI, sessionAPI, termAPI } from '../../services/schoolApi';

const EnrollStudentModal = ({ student, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingArms, setFetchingArms] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [arms, setArms] = useState([]);
  const [formData, setFormData] = useState({
    studentId: student.id,
    classId: '',
    armId: '',
    sessionId: '',
    termId: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClasses();
    fetchSessions();
    fetchTerms();
  }, []);

  // When classId changes, derive arms from the already-fetched classes list
  useEffect(() => {
    if (!formData.classId) {
      setArms([]);
      return;
    }

    // classes already includes arms (listClasses includes: { arms: true })
    const selectedClass = classes.find((c) => String(c.id) === String(formData.classId));
    setArms(selectedClass?.arms ?? []);

    // Reset arm selection when class changes
    setFormData((prev) => ({ ...prev, armId: '' }));
  }, [formData.classId, classes]);

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getClasses();
      const classesData = response.data ?? response ?? [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getSessions();
      const sessionsData = response.data ?? response ?? [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await termAPI.getTerms();
      const termsData = response.data ?? response ?? [];
      setTerms(Array.isArray(termsData) ? termsData : []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTerms([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.classId)   newErrors.classId   = 'Class is required';
    if (!formData.armId)     newErrors.armId     = 'Class arm is required';
    if (!formData.sessionId) newErrors.sessionId = 'Session is required';
    if (!formData.termId)    newErrors.termId    = 'Term is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSuccess(formData);
      onClose();
    } catch (error) {
      console.error('Error enrolling student:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to enroll student' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">

        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Enroll Student: {student.firstName} {student.lastName}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId}</p>}
            </div>

            {/* Class Arm — populated from the selected class's .arms array */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Arm *</label>
              <select
                name="armId"
                value={formData.armId}
                onChange={handleChange}
                disabled={!formData.classId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Class Arm</option>
                {arms.map((arm) => (
                  <option key={arm.id} value={arm.id}>{arm.name}</option>
                ))}
              </select>
              {errors.armId && <p className="mt-1 text-sm text-red-600">{errors.armId}</p>}
              {formData.classId && arms.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">No arms available for this class</p>
              )}
            </div>

            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session *</label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
              {errors.sessionId && <p className="mt-1 text-sm text-red-600">{errors.sessionId}</p>}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <select
                name="termId"
                value={formData.termId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
              {errors.termId && <p className="mt-1 text-sm text-red-600">{errors.termId}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollStudentModal;