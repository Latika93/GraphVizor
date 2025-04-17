import React, { useState, useEffect } from 'react';
import { runBFS } from '../utils/api';

const ShortestPath = ({ users, selectedUser: externalSelectedUser, refreshTrigger }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetUser, setTargetUser] = useState('');
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync with external selected user if provided
  useEffect(() => {
    if (externalSelectedUser) {
      setSelectedUser(externalSelectedUser);
    }
  }, [externalSelectedUser]);

  // Clear results when selected user changes
  useEffect(() => {
    setPath(null);
    setError(null);
    setTargetUser('');
  }, [selectedUser]);

  // Reset when data refreshes
  useEffect(() => {
    setPath(null);
    setError(null);
  }, [refreshTrigger]);

  const findShortestPath = async () => {
    if (!selectedUser) {
      setError('Please select a starting user');
      return;
    }

    if (!targetUser) {
      setError('Please select a target user');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await runBFS(selectedUser.id, targetUser);
      
      if (response.success) {
        if (response.targetFound && response.result.path) {
          setPath(response.result);
        } else {
          setError('No path exists between these users');
        }
      } else {
        setError(response.message || 'An error occurred while finding path');
      }
    } catch (error) {
      setError('Failed to calculate shortest path');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartUserClick = (user) => {
    setSelectedUser(user);
    setTargetUser('');
    setPath(null);
  };

  const handleTargetUserClick = (userId) => {
    setTargetUser(userId);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  // Filter out the selected user from available target users
  const availableTargetUsers = users.filter(user => 
    selectedUser && user.id !== selectedUser.id
  );

  return (
    <div className="card">
      <h2>Find Shortest Path</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Step 1: Select Starting User</p>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          {users.length > 0 ? (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => handleStartUserClick(user)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedUser?.id === user.id ? '#4285F4' : 'white',
                  color: selectedUser?.id === user.id ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: selectedUser?.id === user.id ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {user.name}
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No users available</p>
          )}
        </div>
      </div>
      
      {selectedUser && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Step 2: Select Target User</p>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            {availableTargetUsers.length > 0 ? (
              availableTargetUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleTargetUserClick(user.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: targetUser === user.id ? '#34A853' : 'white',
                    color: targetUser === user.id ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: targetUser === user.id ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {user.name}
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No other users available</p>
            )}
          </div>
        </div>
      )}
      
      <button 
        className="btn" 
        onClick={findShortestPath}
        disabled={!selectedUser || !targetUser || loading}
        style={{
          width: '100%',
          padding: '10px',
          opacity: !selectedUser || !targetUser || loading ? 0.7 : 1
        }}
      >
        {loading ? 'Finding Path...' : 'Find Shortest Path'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px 15px', 
          backgroundColor: 'rgba(220, 53, 69, 0.1)', 
          color: '#dc3545',
          borderRadius: '4px',
          border: '1px solid rgba(220, 53, 69, 0.2)'
        }}>
          {error}
        </div>
      )}
      
      {path && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3 style={{ color: '#4285F4', marginBottom: '10px' }}>
            Shortest Path Found
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'inline-block',
              backgroundColor: '#4285F4', 
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Distance: {path.distance} {path.distance === 1 ? 'connection' : 'connections'}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '5px'
            }}>
              {path.path.map((userId, index) => (
                <React.Fragment key={userId}>
                  <div style={{ 
                    padding: '8px 15px',
                    backgroundColor: 'white',
                    border: `2px solid ${userId === selectedUser.id ? '#4285F4' : userId === targetUser ? '#34A853' : '#E0E0E0'}`,
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {getUserName(userId)}
                  </div>
                  
                  {index < path.path.length - 1 && (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortestPath; 