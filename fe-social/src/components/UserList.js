import React, { useState, useEffect } from 'react';
import { getAllUsers, getUserConnections } from '../utils/api';

const UserList = ({ onUserSelect, refreshTrigger, selectedUser: externalSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [internalSelectedUser, setInternalSelectedUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [animate, setAnimate] = useState(false);

  // Sync internal selectedUser with external selectedUser
  useEffect(() => {
    setInternalSelectedUser(externalSelectedUser);
  }, [externalSelectedUser]);

  // Fetch all users when component mounts or when refresh is triggered
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        if (response.success) {
          setUsers(response.users);
          setAnimate(true);
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        setError('An error occurred while fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger]);

  // Fetch connections when a user is selected
  useEffect(() => {
    if (!internalSelectedUser) {
      setConnections([]);
      return;
    }

    const fetchConnections = async () => {
      try {
        const response = await getUserConnections(internalSelectedUser.id);
        if (response.success) {
          setConnections(response.connections);
        }
      } catch (err) {
        console.error('Error fetching connections:', err);
      }
    };

    fetchConnections();
  }, [internalSelectedUser]);

  const handleUserClick = (user) => {
    const newSelected = internalSelectedUser?.id === user.id ? null : user;
    setInternalSelectedUser(newSelected);
    
    if (onUserSelect) {
      onUserSelect(newSelected);
    }
  };

  // Filter users based on search term
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.interests && user.interests.some(int => 
          int.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : users;

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get random color based on string
  const getColorForUser = (userId) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
      '#6200EA', '#0097A7', '#43A047', '#FFB300', // Material Design
      '#3949AB', '#00897B', '#C0CA33', '#8E24AA', // More MD colors
      '#5C6BC0', '#9575CD'
    ];
    
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + acc;
    }, 0);
    
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div style={{ 
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(190, 170, 129, 0.3)',
            borderTopColor: '#BEAA81',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          border: '1px solid rgba(255, 82, 82, 0.3)',
          borderRadius: '4px',
          color: '#ff5252'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (<>
    <div className="card" style={{ 
      position: 'relative',
      padding: '25px',
      borderRadius: '8px',
      boxShadow: '0 4px 12pxgba(0,0,0,0.08)',
      backgroundColor: 'white',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '500px'  // Fixed height for the entire card
    }}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        background: 'linear-gradient(to right, var(--color-beige), var(--color-dark-blue))'
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-dark-blue)' }}>
          Users in Network
          {filteredUsers.length > 0 && <span style={{ 
            marginLeft: '10px', 
            fontSize: '0.9rem', 
            backgroundColor: 'var(--color-dark-blue)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            verticalAlign: 'middle'
          }}>{filteredUsers.length}</span>}
        </h2>
      </div>
      
      <div style={{ 
        position: 'relative', 
        marginBottom: '20px' 
      }}>
        <input
          type="text"
          placeholder="Search by name, ID or interest..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px 12px 40px',
            borderRadius: '8px',
            border: '1px solid #e1e1e1',
            fontSize: '0.9rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 0 3px rgba(190, 170, 129, 0.2)';
            e.target.style.borderColor = 'var(--color-beige)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
            e.target.style.borderColor = '#e1e1e1';
          }}
        />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              padding: '5px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .user-card {
            opacity: 0;
            animation: fadeInUp 0.5s forwards;
            transform-origin: center;
            transition: all 0.3s ease;
          }
          
          .user-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          }
          
          .tag {
            display: inline-block;
            background-color: #f1f1f1;
            color: #555;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-right: 5px;
            margin-bottom: 5px;
            transition: all 0.3s ease;
          }
          
          .tag:hover {
            background-color: var(--color-beige);
            color: white;
          }
          
          .connection-item {
            opacity: 0;
            animation: fadeInUp 0.4s forwards;
          }
          
          .connection-avatar {
            transition: all 0.3s ease;
          }
          
          .connection-avatar:hover {
            transform: scale(1.1);
          }
          
          .empty-state {
            opacity: 0;
            animation: fadeInUp 0.5s forwards;
            animation-delay: 0.2s;
          }
          
          .custom-scrollbar {
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(190, 170, 129, 0.5) rgba(0, 0, 0, 0.05);
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(190, 170, 129, 0.5);
            border-radius: 4px;
            border: 2px solid transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(190, 170, 129, 0.8);
          }
        `}
      </style>
      
      {/* Flex-grow container with scrollbar */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {filteredUsers.length === 0 ? (
          <div className="empty-state" style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#777',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px', color: '#aaa' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              {searchTerm ? 'No users match your search' : 'No users have been added yet'}
            </p>
            <p style={{ fontSize: '0.9rem', maxWidth: '280px', margin: '0 auto' }}>
              {searchTerm ? 'Try a different search term' : 'Add users using the form to start building your network'}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '25px'
            }}>
              {filteredUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className={`user-card ${internalSelectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user)}
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                    padding: '20px',
                    border: '1px solid #eaeaea',
                    animationDelay: `${index * 0.05}s`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: internalSelectedUser?.id === user.id ? '0' : '5px', 
                    height: '100%', 
                    backgroundColor: getColorForUser(user.id)
                  }}></div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ 
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: getColorForUser(user.id),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      marginRight: '15px',
                      boxShadow: '0 3px 5px rgba(0,0,0,0.1)'
                    }}>
                      {getInitials(user.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 3px 0', 
                        color: '#333',
                        fontSize: '1.1rem'
                      }}>{user.name}</h3>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#777',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        {user.id}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem' }}>
                    {user.age && (
                      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#666' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Age: <strong>{user.age}</strong></span>
                      </div>
                    )}
                    
                    {user.interests && user.interests.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          Interests:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '5px' }}>
                          {user.interests.map((interest, idx) => (
                            <span key={idx} className="tag">{interest}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {internalSelectedUser?.id === user.id && (
                    <div style={{ 
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--color-dark-blue)',
                      color: 'white',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            
          </div>
        )}
      </div>
    </div>

{internalSelectedUser && (
  <div style={{ 
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: '20px',
    marginTop: '20px',
    marginBottom: '20px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
    animation: 'fadeInUp 0.5s forwards',
    border: '1px solid #eaeaea'
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '15px',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px'
    }}>
      <h3 style={{ 
        margin: 0, 
        color: 'var(--color-dark-blue)',
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-beige)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        Connections for {internalSelectedUser.name}
      </h3>
      <div style={{ 
        backgroundColor: 'var(--color-beige)',
        color: 'white',
        borderRadius: '20px',
        padding: '3px 10px',
        fontSize: '0.8rem',
        fontWeight: 'bold'
      }}>
        {connections.length} {connections.length === 1 ? 'Connection' : 'Connections'}
      </div>
    </div>
    
    {connections.length === 0 ? (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        backgroundColor: 'white',
        borderRadius: '8px',
        color: '#777'
      }} className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px', color: '#aaa' }}>
          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
        <p>No connections for this user yet</p>
        <p style={{ fontSize: '0.85rem' }}>Use the "Add Connection" form to create connections</p>
      </div>
    ) : (
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        {connections.map((conn, index) => (
          <div key={conn.id} className="connection-item" style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            minWidth: '200px',
            flexGrow: 1,
            animationDelay: `${index * 0.1}s`,
            border: '1px solid #eee'
          }}>
            <div className="connection-avatar" style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: getColorForUser(conn.id),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
              marginRight: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {getInitials(conn.name)}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: '#333' }}>{conn.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#777' }}>{conn.id}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
</>
  );
};

export default UserList; 