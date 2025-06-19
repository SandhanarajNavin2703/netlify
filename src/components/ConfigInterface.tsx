import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Interviewer {
  id?: string;
  name: string;
  email: string;
  designation: string;
  expertise: string[];
  available: boolean;
}

interface JobRole {
  id?: string;
  job_description: string;
  job_id: string;
  job_role_name: string;
  years_of_experience_needed: string;
}

type ActiveTab = 'interviewers' | 'jobs';

const ConfigInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('interviewers');
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<Omit<Interviewer, 'id'>>({
    name: '',
    email: '',
    designation: '',
    expertise: [],
    available: true
  });
  const [jobFormData, setJobFormData] = useState<Omit<JobRole, 'id'>>({
    job_description: '',
    job_id: '',
    job_role_name: '',
    years_of_experience_needed: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch interviewers from Firestore
  const fetchInterviewers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'interviewers'));
      const interviewersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Interviewer[];
      setInterviewers(interviewersList);
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    }
  };

  // Fetch job roles from Firestore
  const fetchJobRoles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobRolesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobRole[];
      setJobRoles(jobRolesList);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  useEffect(() => {
    fetchInterviewers();
    fetchJobRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'interviewers') {
        if (editingId) {
          await updateDoc(doc(db, 'interviewers', editingId), formData);
        } else {
          await addDoc(collection(db, 'interviewers'), formData);
        }
        setFormData({
          name: '',
          email: '',
          designation: '',
          expertise: [],
          available: true
        });
        fetchInterviewers();
      } else {
        if (editingId) {
          await updateDoc(doc(db, 'jobs', editingId), jobFormData);
        } else {
          await addDoc(collection(db, 'jobs'), jobFormData);
        }
        setJobFormData({
          job_description: '',
          job_id: '',
          job_role_name: '',
          years_of_experience_needed: ''
        });
        fetchJobRoles();
      }
      setEditingId(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, activeTab === 'interviewers' ? 'interviewers' : 'jobs', id));
        if (activeTab === 'interviewers') {
          fetchInterviewers();
        } else {
          fetchJobRoles();
        }
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };
  const startEdit = (item: Interviewer | JobRole) => {
    setEditingId(item.id || null);
    if ('name' in item) {
      setFormData({
        name: item.name,
        email: item.email,
        designation: item.designation,
        expertise: item.expertise,
        available: item.available
      });
    } else {
      setJobFormData({
        job_description: item.job_description,
        job_id: item.job_id,
        job_role_name: item.job_role_name,
        years_of_experience_needed: item.years_of_experience_needed
      });
    }
  };

  // Pagination logic
  const getCurrentItems = (items: any[]) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil((activeTab === 'interviewers' ? interviewers.length : jobRoles.length) / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const currentInterviewers = getCurrentItems(interviewers);
  const currentJobs = getCurrentItems(jobRoles);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="p-6 overflow-y-auto flex-1">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('interviewers')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'interviewers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Manage Interviewers
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'jobs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Manage Job Roles
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'interviewers' ? 'Manage Interviewers' : 'Manage Job Roles'}
          </h2>
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === 'interviewers' ? 'Interviewer' : 'Job Role'}
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingId) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'interviewers' ? (
                // Interviewers Form
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expertise (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.expertise?.join(', ')}
                      onChange={(e) => setFormData(prev => ({ ...prev, expertise: e.target.value?.split(',').map(item => item.trim()) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Java, Spring, React..."
                      required
                    />
                  </div>
                </div>
              ) : (
                // Job Roles Form
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Role Name
                    </label>
                    <input
                      type="text"
                      value={jobFormData.job_role_name}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, job_role_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {/* hiding for now */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job ID
                    </label>
                    <input
                      type="text"
                      value={jobFormData.job_id}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, job_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience Needed
                    </label>
                    <input
                      type="text"
                      value={jobFormData.years_of_experience_needed}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, years_of_experience_needed: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3-5 years"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={jobFormData.job_description}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, job_description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                    if (activeTab === 'interviewers') {
                      setFormData({
                        name: '',
                        email: '',
                        designation: '',
                        expertise: [],
                        available: true
                      });
                    } else {
                      setJobFormData({
                        job_description: '',
                        job_id: '',
                        job_role_name: '',
                        years_of_experience_needed: ''
                      });
                    }
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} {activeTab === 'interviewers' ? 'Interviewer' : 'Job Role'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'interviewers' ? (
            // Interviewers Table
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInterviewers.map((interviewer) => (
                  <tr key={interviewer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{interviewer.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interviewer.email || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{interviewer.designation || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {interviewer?.expertise?.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${interviewer.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {interviewer.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(interviewer)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(interviewer.id!)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Job Roles Table
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                  {/* hiding for now */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.job_role_name}</td>
                    {/* hiding for now */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.job_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.years_of_experience_needed}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-md truncate">{job.job_description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(job)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id!)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 px-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, activeTab === 'interviewers' ? interviewers.length : jobRoles.length)} of {activeTab === 'interviewers' ? interviewers.length : jobRoles.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`px-3 py-1 rounded ${currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigInterface;