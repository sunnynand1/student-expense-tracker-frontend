import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { documentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.getAll();
      if (response.data.success) {
        setDocuments(response.data.data);
      } else {
        setError('Failed to fetch documents');
        toast.error('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Error fetching documents. Please try again.');
      toast.error('Error fetching documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle file change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle description change
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    
    try {
      const response = await documentsAPI.upload(formData);
      
      if (response.data.success) {
        toast.success('Document uploaded successfully');
        setFile(null);
        setDescription('');
        setShowUploadForm(false);
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Error uploading document. Please try again.');
    }
  };

  // Download document
  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await documentsAPI.download(documentId);
      
      // Create a blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Error downloading document. Please try again.');
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await documentsAPI.delete(id);
        if (response.data.success) {
          toast.success('Document deleted successfully');
          fetchDocuments();
        } else {
          toast.error(response.data.message || 'Failed to delete document');
        }
      } catch (err) {
        console.error('Error deleting document:', err);
        toast.error('Error deleting document. Please try again.');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          {showUploadForm ? 'Cancel' : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Max file size: 5MB</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter a description for this document"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setFile(null);
                  setDescription('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upload
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No documents found. Upload your first document to get started!</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => (
                  <tr key={document._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{document.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(document.fileSize)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(document.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownload(document._id, document.fileName)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(document._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

export default Documents;
