import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, UserIcon } from '@heroicons/react/24/outline';
import { teamAPI } from '../services/api';
import { toast } from 'react-toastify';

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member'
  });
  const [editingId, setEditingId] = useState(null);

  // Roles
  const roles = [
    { id: 'owner', name: 'Owner' },
    { id: 'admin', name: 'Admin' },
    { id: 'member', name: 'Member' },
    { id: 'viewer', name: 'Viewer' }
  ];

  // Fetch team members
  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await teamAPI.getAll();
      if (response.data.success) {
        setTeamMembers(response.data.data);
      } else {
        setError('Failed to fetch team members');
        toast.error('Failed to fetch team members');
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Error fetching team members. Please try again.');
      toast.error('Error fetching team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing team member
        const response = await teamAPI.update(editingId, formData);
        if (response.data.success) {
          toast.success('Team member updated successfully');
          fetchTeamMembers();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to update team member');
        }
      } else {
        // Create new team member
        const response = await teamAPI.invite(formData);
        if (response.data.success) {
          toast.success('Invitation sent successfully');
          fetchTeamMembers();
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to send invitation');
        }
      }
    } catch (err) {
      console.error('Error saving team member:', err);
      toast.error('Error saving team member. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'member'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Edit team member
  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role
    });
    setEditingId(member._id);
    setShowForm(true);
  };

  // Delete team member
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        const response = await teamAPI.delete(id);
        if (response.data.success) {
          toast.success('Team member removed successfully');
          fetchTeamMembers();
        } else {
          toast.error(response.data.message || 'Failed to remove team member');
        }
      } catch (err) {
        console.error('Error removing team member:', err);
        toast.error('Error removing team member. Please try again.');
      }
    }
  };

  // Get role name
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Member';
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && teamMembers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Invite Member
            </>
          )}
        </button>
      </div>

      {/* Invite Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Team Member' : 'Invite New Member'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingId ? 'Update Member' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No team members found. Invite your first team member to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Invite Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          {member.profileImage ? (
                            <img src={member.profileImage} alt={member.name} className="h-10 w-10 rounded-full" />
                          ) : (
                            <UserIcon className="h-5 w-5 text-indigo-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {getRoleName(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(member.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
