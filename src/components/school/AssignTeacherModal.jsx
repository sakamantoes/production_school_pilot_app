// components/school/AssignTeacherModal.jsx
import React, { useState, useEffect } from 'react';
import { classAPI, subjectAPI } from '../../services/schoolApi';

const AssignTeacherModal = ({ teacher, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [arms, setArms] = useState([]);
  const [formData, setFormData] = useState({
    teacherId: teacher.id,
    classId: '',
    armId: '',
    subjectId: '',
    isClassTeacher: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      fetchClassArms(formData.classId);
    }
  }, [formData.classId]);

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClassArms = async (classId) => {
    try {
      const response = await classAPI.getClasses(classId);
      const selectedClass = response.data?.find(c => c.id === classId);
      setArms(selectedClass?.arms || []);
    } catch (error) {
      console.error('Error fetching class arms:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.armId) newErrors.armId = 'Class arm is required';
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
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
    } catch (error) {
      console.error('Error assigning teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Assign Teacher: {teacher.firstName} {teacher.lastName}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Arm *</label>
              <select
                name="armId"
                value={formData.armId}
                onChange={handleChange}
                disabled={!formData.classId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Class Arm</option>
                {arms.map((arm) => (
                  <option key={arm.id} value={arm.id}>{arm.name}</option>
                ))}
              </select>
              {errors.armId && <p className="mt-1 text-sm text-red-600">{errors.armId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isClassTeacher"
                id="isClassTeacher"
                checked={formData.isClassTeacher}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isClassTeacher" className="ml-2 block text-sm text-gray-700">
                Make this teacher the class teacher (homeroom teacher)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Assigning...' : 'Assign Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTeacherModal;