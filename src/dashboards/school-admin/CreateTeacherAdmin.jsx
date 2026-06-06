import React, { useState, useEffect } from 'react';
import CreateTeacher from '../../components/school/CreateTeacher';
import EditTeacherModal from '../../components/school/EditTeacherModal';
import AssignTeacherModal from '../../components/school/AssignTeacherModal';
import { teacherAPI, classAPI, subjectAPI } from '../../services/schoolApi';

const CreateTeacherAdmin = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // Fetch teachers on component mount
  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTeachers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterSubject]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterSubject) params.subjectId = filterSubject;
      
      const response = await teacherAPI.getTeachers(params);
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Failed to fetch teachers');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
  };

  const handleTeacherCreated = (newTeacher) => {
    fetchTeachers();
    setShowCreateModal(false);
  };

  const handleTeacherUpdated = () => {
    fetchTeachers();
    setShowEditModal(false);
    setSelectedTeacher(null);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also remove all assignments.')) {
      try {
        await teacherAPI.deleteTeacher(teacherId);
        alert('Teacher deleted successfully');
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Failed to delete teacher');
      }
    }
  };

  const handleRemoveAssignment = async (assignmentId, teacherName) => {
    if (window.confirm(`Remove this assignment from ${teacherName}?`)) {
      try {
        await teacherAPI.removeTeacherAssignment(assignmentId);
        alert('Assignment removed successfully');
        fetchTeachers();
      } catch (error) {
        console.error('Error removing assignment:', error);
        alert('Failed to remove assignment');
      }
    }
  };

  const handleAssignTeacher = async (assignmentData) => {
    try {
      await teacherAPI.assignTeacher(assignmentData);
      alert('Teacher assigned successfully');
      fetchTeachers();
      setShowAssignModal(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert('Failed to assign teacher');
    }
  };

  // Calculate stats
  const totalTeachers = teachers.length;
  const teachersWithAssignments = teachers.filter(t => t.assignments && t.assignments.length > 0).length;
  const classTeachers = teachers.filter(t => t.assignments?.some(a => a.isClassTeacher)).length;
  const totalAssignments = teachers.reduce((sum, t) => sum + (t.assignments?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-800 overflow-hidden">
        {/* Simple Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L40 0H0L20 20Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        {/* Banner Content */}
        <div className="relative px-6 py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              
              {/* Left Section */}
              <div className="flex-1">
                {/* Breadcrumb / Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-white/90 text-xs font-medium">Administration</span>
                </div>
                
                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Teacher Management
                </h1>
                
                {/* Description */}
                <p className="text-blue-100 text-sm md:text-base max-w-2xl">
                  Manage teacher records, assignments, and class allocations efficiently
                </p>
              </div>
              
              {/* Right Section - Stats Cards */}
              <div className="flex gap-3">
                {/* Total Teachers Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[100px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-white/70 text-xs">Total</span>
                  </div>
                  <div className="text-white text-xl font-bold">{totalTeachers}</div>
                </div>
                
                {/* With Assignments Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[100px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white/70 text-xs">Assigned</span>
                  </div>
                  <div className="text-white text-xl font-bold">{teachersWithAssignments}</div>
                </div>
                
                {/* Class Teachers Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[100px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-white/70 text-xs">Class Teachers</span>
                  </div>
                  <div className="text-white text-xl font-bold">{classTeachers}</div>
                </div>

                {/* Total Assignments Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[100px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-white/70 text-xs">Assignments</span>
                  </div>
                  <div className="text-white text-xl font-bold">{totalAssignments}</div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* Simple Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            
            {/* Create Teacher Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Teacher
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or teacher ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchTeachers()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchTeachers}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSubject('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects/Classes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No teachers found
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teacher.teacherId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {teacher.image && (
                              <img
                                src={teacher.image}
                                alt={teacher.firstName}
                                className="h-8 w-8 rounded-full mr-3 object-cover"
                              />
                            )}
                            <div>
                              <div>{teacher.firstName} {teacher.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {teacher.assignments?.map((assignment) => (
                              <div key={assignment.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded px-2 py-1">
                                <span className="text-xs">
                                  {assignment.subject?.name} - {assignment.class?.name} {assignment.arm?.name}
                                  {assignment.isClassTeacher && <span className="ml-1 text-blue-600 font-semibold">(Class Teacher)</span>}
                                </span>
                                <button
                                  onClick={() => handleRemoveAssignment(assignment.id, `${teacher.firstName} ${teacher.lastName}`)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove assignment"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {(!teacher.assignments || teacher.assignments.length === 0) && (
                              <span className="text-xs text-gray-400">No assignments</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowAssignModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Assign to Class/Subject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <CreateTeacher
          onSuccess={handleTeacherCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          onSuccess={handleTeacherUpdated}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
          }}
        />
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedTeacher && (
        <AssignTeacherModal
          teacher={selectedTeacher}
          onSuccess={handleAssignTeacher}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTeacher(null);
          }}
        />
      )}
    </div>
  );
};

export default CreateTeacherAdmin;