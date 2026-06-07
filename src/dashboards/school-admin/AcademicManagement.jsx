import React, { useState, useEffect } from 'react';
import { classAPI, classArmAPI, subjectAPI, sessionAPI, termAPI } from '../../services/schoolApi';

const AcademicManagement = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('classes');
  
  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // State for data
  const [classes, setClasses] = useState([]);
  const [classArms, setClassArms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({ name: '', description: '' });
  const [classArmForm, setClassArmForm] = useState({ name: '', classId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [termForm, setTermForm] = useState({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });

  // Helper function to convert term name to enum
  const getTermEnumValue = (termName) => {
    const termMap = {
      'first': 'FIRST_TERM',
      '1st': 'FIRST_TERM',
      'second': 'SECOND_TERM', 
      '2nd': 'SECOND_TERM',
      'third': 'THIRD_TERM',
      '3rd': 'THIRD_TERM'
    };
    
    const lowerName = termName.toLowerCase();
    for (const [key, value] of Object.entries(termMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return 'FIRST_TERM';
  };

  // Helper function to convert enum to display name
  const getTermDisplayName = (enumValue) => {
    const displayMap = {
      'FIRST_TERM': 'First Term',
      'SECOND_TERM': 'Second Term',
      'THIRD_TERM': 'Third Term'
    };
    return displayMap[enumValue] || enumValue;
  };

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch(activeTab) {
        case 'classes':
          await fetchClasses();
          break;
        case 'class-arms':
          await fetchClassArms();
          break;
        case 'subjects':
          await fetchSubjects();
          break;
        case 'sessions':
          await fetchSessions();
          break;
        case 'terms':
          await fetchTerms();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      alert('Failed to fetch classes');
    }
  };

  const fetchClassArms = async () => {
    try {
      // First fetch all classes with their arms
      const response = await classAPI.getClasses();
      setClasses(response.data || []);
      
      // Extract all arms from classes
      const allArms = [];
      response.data.forEach(classItem => {
        if (classItem.arms && classItem.arms.length > 0) {
          classItem.arms.forEach(arm => {
            allArms.push({
              ...arm,
              className: classItem.name
            });
          });
        }
      });
      setClassArms(allArms);
    } catch (error) {
      console.error('Error fetching class arms:', error);
      alert('Failed to fetch class arms');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Failed to fetch subjects');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      alert('Failed to fetch sessions');
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await termAPI.getTerms();
      setTerms(response.data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      alert('Failed to fetch terms');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // CRUD Operations for Classes
  const handleCreateClass = async () => {
    if (!classForm.name) {
      alert('Class name is required');
      return;
    }
    try {
      await classAPI.createClass(classForm);
      alert('Class created successfully');
      setShowCreateModal(false);
      setClassForm({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedItem) return;
    try {
      await classAPI.updateClass(selectedItem.id, classForm);
      alert('Class updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      setClassForm({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This will also delete all class arms.')) {
      try {
        await classAPI.deleteClass(classId);
        alert('Class deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class');
      }
    }
  };

  // CRUD Operations for Class Arms
  const handleCreateClassArm = async () => {
    if (!classArmForm.name || !classArmForm.classId) {
      alert('Class arm name and class are required');
      return;
    }
    try {
      await classArmAPI.createClassArm(classArmForm);
      alert('Class arm created successfully');
      setShowCreateModal(false);
      setClassArmForm({ name: '', classId: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating class arm:', error);
      alert('Failed to create class arm');
    }
  };

  const handleUpdateClassArm = async () => {
    if (!selectedItem) return;
    try {
      await classArmAPI.updateClassArm(selectedItem.id, classArmForm);
      alert('Class arm updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      setClassArmForm({ name: '', classId: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating class arm:', error);
      alert('Failed to update class arm');
    }
  };

  const handleDeleteClassArm = async (armId) => {
    if (window.confirm('Are you sure you want to delete this class arm?')) {
      try {
        await classArmAPI.deleteClassArm(armId);
        alert('Class arm deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting class arm:', error);
        alert('Failed to delete class arm');
      }
    }
  };

  // CRUD Operations for Subjects
  const handleCreateSubject = async () => {
    if (!subjectForm.name || !subjectForm.code) {
      alert('Subject name and code are required');
      return;
    }
    try {
      await subjectAPI.createSubject(subjectForm);
      alert('Subject created successfully');
      setShowCreateModal(false);
      setSubjectForm({ name: '', code: '', description: '' });
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject');
    }
  };

  const handleUpdateSubject = async () => {
    if (!selectedItem) return;
    try {
      await subjectAPI.updateSubject(selectedItem.id, subjectForm);
      alert('Subject updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      setSubjectForm({ name: '', code: '', description: '' });
      fetchSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectAPI.deleteSubject(subjectId);
        alert('Subject deleted successfully');
        fetchSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  // CRUD Operations for Sessions
  const handleCreateSession = async () => {
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      alert('Session name, start date, and end date are required');
      return;
    }
    try {
      await sessionAPI.createSession(sessionForm);
      alert('Session created successfully');
      setShowCreateModal(false);
      setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false });
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedItem) return;
    try {
      await sessionAPI.updateSession(selectedItem.id, sessionForm);
      alert('Session updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false });
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update session');
    }
  };

  // CRUD Operations for Terms
  const handleCreateTerm = async () => {
    if (!termForm.name || !termForm.sessionId || !termForm.startDate || !termForm.endDate) {
      alert('All term fields are required');
      return;
    }
    
    const termData = {
      ...termForm,
      name: getTermEnumValue(termForm.name)
    };
    
    try {
      await termAPI.createTerm(termData);
      alert('Term created successfully');
      setShowCreateModal(false);
      setTermForm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
      fetchTerms();
    } catch (error) {
      console.error('Error creating term:', error);
      alert('Failed to create term');
    }
  };

  const handleUpdateTerm = async () => {
    if (!selectedItem) return;
    
    const termData = {
      ...termForm,
      name: getTermEnumValue(termForm.name)
    };
    
    try {
      await termAPI.updateTerm(selectedItem.id, termData);
      alert('Term updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      setTermForm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
      fetchTerms();
    } catch (error) {
      console.error('Error updating term:', error);
      alert('Failed to update term');
    }
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    resetForms();
    setShowCreateModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
    
    switch(activeTab) {
      case 'classes':
        setClassForm({ name: item.name, description: item.description || '' });
        break;
      case 'class-arms':
        setClassArmForm({ name: item.name, classId: item.classId });
        break;
      case 'subjects':
        setSubjectForm({ name: item.name, code: item.code, description: item.description || '' });
        break;
      case 'sessions':
        setSessionForm({ 
          name: item.name, 
          startDate: item.startDate.split('T')[0], 
          endDate: item.endDate.split('T')[0], 
          isCurrent: item.isCurrent 
        });
        break;
      case 'terms':
        setTermForm({ 
          name: getTermDisplayName(item.name),
          sessionId: item.sessionId, 
          startDate: item.startDate.split('T')[0], 
          endDate: item.endDate.split('T')[0], 
          isCurrent: item.isCurrent 
        });
        break;
    }
  };

  const resetForms = () => {
    setClassForm({ name: '', description: '' });
    setClassArmForm({ name: '', classId: '' });
    setSubjectForm({ name: '', code: '', description: '' });
    setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false });
    setTermForm({ name: '', sessionId: '', startDate: '', endDate: '', isCurrent: false });
  };

  const getModalTitle = () => {
    const action = selectedItem ? 'Edit' : 'Create';
    switch(activeTab) {
      case 'classes': return `${action} Class`;
      case 'class-arms': return `${action} Class Arm`;
      case 'subjects': return `${action} Subject`;
      case 'sessions': return `${action} Session`;
      case 'terms': return `${action} Term`;
      default: return `${action} Item`;
    }
  };

  const renderModalForm = () => {
    switch(activeTab) {
      case 'classes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <input
                type="text"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Form 1, Grade 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Optional description"
              />
            </div>
          </div>
        );
      
      case 'class-arms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                value={classArmForm.classId}
                onChange={(e) => setClassArmForm({ ...classArmForm, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arm Name *</label>
              <input
                type="text"
                value={classArmForm.name}
                onChange={(e) => setClassArmForm({ ...classArmForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A, B, Blue, Red"
              />
            </div>
          </div>
        );
      
      case 'subjects':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
              <input
                type="text"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics, English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
              <input
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MATH101, ENG102"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Optional description"
              />
            </div>
          </div>
        );
      
      case 'sessions':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Name *</label>
              <input
                type="text"
                value={sessionForm.name}
                onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={sessionForm.startDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={sessionForm.endDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sessionForm.isCurrent}
                  onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Set as current session</span>
              </label>
            </div>
          </div>
        );
      
      case 'terms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
              <select
                value={termForm.sessionId}
                onChange={(e) => setTermForm({ ...termForm, sessionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Name *</label>
              <select
                value={termForm.name}
                onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Term</option>
                <option value="FIRST_TERM">First Term</option>
                <option value="SECOND_TERM">Second Term</option>
                <option value="THIRD_TERM">Third Term</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={termForm.startDate}
                  onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={termForm.endDate}
                  onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={termForm.isCurrent}
                  onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Set as current term</span>
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    if (selectedItem) {
      switch(activeTab) {
        case 'classes': handleUpdateClass(); break;
        case 'class-arms': handleUpdateClassArm(); break;
        case 'subjects': handleUpdateSubject(); break;
        case 'sessions': handleUpdateSession(); break;
        case 'terms': handleUpdateTerm(); break;
      }
    } else {
      switch(activeTab) {
        case 'classes': handleCreateClass(); break;
        case 'class-arms': handleCreateClassArm(); break;
        case 'subjects': handleCreateSubject(); break;
        case 'sessions': handleCreateSession(); break;
        case 'terms': handleCreateTerm(); break;
      }
    }
  };

  const renderClassesTab = () => (
    <div className="space-y-6">
      {classes.map((classItem) => (
        <div key={classItem.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{classItem.name}</h3>
              {classItem.description && (
                <p className="text-gray-600 mt-1">{classItem.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(classItem)}
                className="text-blue-600 hover:text-blue-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteClass(classItem.id)}
                className="text-red-600 hover:text-red-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {classItem.arms && classItem.arms.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Class Arms:</h4>
              <div className="flex flex-wrap gap-2">
                {classItem.arms.map((arm) => (
                  <div key={arm.id} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                    <span className="text-sm text-gray-700">{arm.name}</span>
                    <button
                      onClick={() => handleDeleteClassArm(arm.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderClassArmsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classArms.map((arm) => (
        <div key={arm.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{arm.name}</h3>
              <p className="text-sm text-gray-500">Class: {arm.className}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(arm)}
                className="text-blue-600 hover:text-blue-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteClassArm(arm.id)}
                className="text-red-600 hover:text-red-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
      {classArms.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No class arms found. Create your first class arm!
        </div>
      )}
    </div>
  );

  const renderSubjectsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => (
        <div key={subject.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{subject.name}</h3>
              <p className="text-sm text-gray-500">Code: {subject.code}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(subject)}
                className="text-blue-600 hover:text-blue-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteSubject(subject.id)}
                className="text-red-600 hover:text-red-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          {subject.description && (
            <p className="text-sm text-gray-600 mt-2">{subject.description}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderSessionsTab = () => (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                {session.isCurrent && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(session)}
                className="text-blue-600 hover:text-blue-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTermsTab = () => (
    <div className="space-y-4">
      {terms.map((term) => (
        <div key={term.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{getTermDisplayName(term.name)}</h3>
                {term.isCurrent && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Session: {term.session?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(term)}
                className="text-blue-600 hover:text-blue-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch(activeTab) {
      case 'classes':
        return renderClassesTab();
      case 'class-arms':
        return renderClassArmsTab();
      case 'subjects':
        return renderSubjectsTab();
      case 'sessions':
        return renderSessionsTab();
      case 'terms':
        return renderTermsTab();
      default:
        return null;
    }
  };

  // Calculate stats
  const totalClasses = classes.length;
  const totalArms = classArms.length;
  const totalSubjects = subjects.length;
  const totalSessions = sessions.length;
  const currentSession = sessions.find(s => s.isCurrent);
  const currentTerm = terms.find(t => t.isCurrent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L40 0H0L20 20Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="relative px-6 py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-white/90 text-xs font-medium">Academic Management</span>
                </div>
                
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Academic Structure
                </h1>
                
                <p className="text-blue-100 text-sm md:text-base max-w-2xl">
                  Manage classes, subjects, sessions, and terms for your school
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white/70 text-xs">Classes</div>
                  <div className="text-white text-xl font-bold">{totalClasses}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white/70 text-xs">Arms</div>
                  <div className="text-white text-xl font-bold">{totalArms}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white/70 text-xs">Subjects</div>
                  <div className="text-white text-xl font-bold">{totalSubjects}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'classes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setActiveTab('class-arms')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'class-arms'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Class Arms
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'subjects'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'terms'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Terms
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
            
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create {activeTab === 'classes' ? 'Class' : activeTab === 'class-arms' ? 'Arm' : activeTab.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* Current Session/Term Info */}
        {(currentSession || currentTerm) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {currentSession && (
                <div>
                  <span className="text-xs text-blue-700 font-medium">Current Session</span>
                  <p className="text-sm text-blue-900">{currentSession.name}</p>
                </div>
              )}
              {currentTerm && (
                <div className="pl-4 border-l border-blue-200">
                  <span className="text-xs text-blue-700 font-medium">Current Term</span>
                  <p className="text-sm text-blue-900">{getTermDisplayName(currentTerm.name)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForms();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {renderModalForm()}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForms();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicManagement;