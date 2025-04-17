import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AddUserForm from './components/AddUserForm';
import AddConnectionForm from './components/AddConnectionForm';
import UserList from './components/UserList';
import GraphAnalysis from './components/GraphAnalysis';
import NetworkGraph from './components/NetworkGraph';
import ShortestPath from './components/ShortestPath';
import CentralityMeasures from './components/CentralityMeasures';
import { getAllUsers } from './utils/api';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);

  // Handlers
  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConnectionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Graph Analysis can also update the selected user
  const handleStartUserSelect = (userId, users) => {
    if (!userId) {
      setSelectedUser(null);
      return;
    }
    
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleAddUser = (user) => {
    setUsers([...users, user]);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddConnection = (connection) => {
    setConnections([...connections, connection]);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleRemoveUser = (user) => {
    const newUsers = users.filter(u => u.id !== user.id);
    setUsers(newUsers);
    setRefreshTrigger(prev => prev + 1);
  };

  // Add a function to refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch users when component mounts or refresh triggered
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        if (response.success) {
          setUsers(response.users);
        } else {
          console.error('Error fetching users:', response.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [refreshTrigger]);

  return (
    <div className="App">
      <Header />
      
      <div className="container">
        <div className="main-content">
          <div className="column">
            <UserList 
              users={users} 
              onSelectUser={handleSelectUser} 
              selectedUser={selectedUser} 
              onRemoveUser={handleRemoveUser}
            />
            <AddUserForm onAddUser={handleAddUser} />
          </div>
          <div className="column">
            <NetworkGraph 
              users={users}
              connections={connections}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
            />
            <AddConnectionForm 
              users={users}
              onAddConnection={handleAddConnection}
              selectedUser={selectedUser}
            />
          </div>
          <div className="column">
            <GraphAnalysis 
              selectedUser={selectedUser}
              users={users}
              connections={connections}
              onStartUserSelect={handleStartUserSelect}
            />
            <ShortestPath 
              users={users}
              selectedUser={selectedUser}
              refreshTrigger={refreshTrigger}
              onUserSelect={handleSelectUser}
            />
            <CentralityMeasures />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 