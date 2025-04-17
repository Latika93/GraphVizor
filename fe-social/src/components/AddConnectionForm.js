import React, { useState, useEffect } from 'react';
import { addConnection, getAllUsers } from '../utils/api';

const AddConnectionForm = ({ onConnectionAdded, refreshTrigger }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({
    user1: '',
    user2: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Fetch all users when component mounts or when refreshTrigger changes
  useEffect(() => {
    const fetchUsers = async () => {
      console.log('AddConnectionForm: Fetching users, refreshTrigger:', refreshTrigger);
      try {
        setFetchingUsers(true);
        const response = await getAllUsers();
        console.log('AddConnectionForm: Got users response:', response);
        if (response.success) {
          setUsers(response.users);
          console.log('AddConnectionForm: Updated users state with:', response.users);
        } else {
          setError('Failed to fetch users.');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please refresh the page.');
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger]); // Add refreshTrigger as a dependency

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setSelectedUsers({
      ...selectedUsers,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!selectedUsers.user1 || !selectedUsers.user2) {
      setError('Please select both users');
      return;
    }

    if (selectedUsers.user1 === selectedUsers.user2) {
      setError('Cannot connect a user to themselves');
      return;
    }

    try {
      setLoading(true);
      const result = await addConnection(selectedUsers.user1, selectedUsers.user2);
      
      if (result.success) {
        setSuccess('Connection added successfully!');
        setSelectedUsers({
          user1: '',
          user2: ''
        });
        
        // Notify parent component
        if (onConnectionAdded) {
          onConnectionAdded({
            user1: selectedUsers.user1,
            user2: selectedUsers.user2
          });
        }
      } else {
        setError(result.message || 'Failed to add connection');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Add Connection</h2>
      
      {fetchingUsers ? (
        <p>Loading users...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user1">User 1:</label>
            <select
              id="user1"
              name="user1"
              value={selectedUsers.user1}
              onChange={handleSelectChange}
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={`user1-${user.id}`} value={user.id}>
                  {user.name} ({user.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="user2">User 2:</label>
            <select
              id="user2"
              name="user2"
              value={selectedUsers.user2}
              onChange={handleSelectChange}
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={`user2-${user.id}`} value={user.id}>
                  {user.name} ({user.id})
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" disabled={loading || fetchingUsers}>
            {loading ? 'Adding...' : 'Add Connection'}
          </button>
          
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      )}
    </div>
  );
};

export default AddConnectionForm; 