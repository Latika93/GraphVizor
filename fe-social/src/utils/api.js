import axios from 'axios';

const API_URL = 'https://graphvizor.onrender.com/api';
// const API_URL = 'http://localhost:5000/api';

// User related API calls
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

// Connection related API calls
export const addConnection = async (userId1, userId2) => {
  try {
    const response = await axios.post(`${API_URL}/connections`, { userId1, userId2 });
    return response.data;
  } catch (error) {
    console.error('Error adding connection:', error);
    throw error;
  }
};

export const getUserConnections = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}/connections`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching connections for user ${userId}:`, error);
    throw error;
  }
};

// Graph data related API calls
export const getGraphData = async () => {
  try {
    const response = await axios.get(`${API_URL}/graph`);
    return response.data;
  } catch (error) {
    console.error('Error fetching graph data:', error);
    throw error;
  }
};

// Algorithm related API calls
export const runBFS = async (startUserId, targetUserId = null) => {
  try {
    const url = targetUserId 
      ? `${API_URL}/algorithms/bfs?startUserId=${startUserId}&targetUserId=${targetUserId}`
      : `${API_URL}/algorithms/bfs?startUserId=${startUserId}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error running BFS algorithm:', error);
    throw error;
  }
};

export const runDFS = async (startUserId, targetUserId = null) => {
  try {
    const url = targetUserId 
      ? `${API_URL}/algorithms/dfs?startUserId=${startUserId}&targetUserId=${targetUserId}`
      : `${API_URL}/algorithms/dfs?startUserId=${startUserId}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error running DFS algorithm:', error);
    throw error;
  }
};

// Mock database for users and connections
let users = [];
let connections = {};

// Utility function to simulate API request delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get all users
export const getAllUsersMock = async () => {
  // Simulate network delay
  await delay(600);
  
  return {
    success: true,
    users: [...users]
  };
};

// Get specific user by ID
export const getUserByIdMock = async (userId) => {
  // Simulate network delay
  await delay(300);
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return {
      success: false,
      message: `User with ID ${userId} not found`
    };
  }
  
  return {
    success: true,
    user
  };
};

// Add a new user
export const addUserMock = async (userData) => {
  // Simulate network delay
  await delay(800);
  
  // Check if user ID already exists
  if (users.some(u => u.id === userData.id)) {
    return {
      success: false,
      message: 'User ID already exists'
    };
  }
  
  // Add user to the database
  users.push(userData);
  
  // Initialize connections entry for this user
  connections[userData.id] = [];
  
  return {
    success: true,
    user: userData
  };
};

// Get connections for a specific user
export const getUserConnectionsMock = async (userId) => {
  // Simulate network delay
  await delay(500);
  
  // Check if user exists
  if (!users.some(u => u.id === userId)) {
    return {
      success: false,
      message: `User with ID ${userId} not found`
    };
  }
  
  // Get the connection IDs for this user
  const connectionIds = connections[userId] || [];
  
  // Map connection IDs to user objects
  const connectionUsers = connectionIds.map(id => {
    return users.find(u => u.id === id);
  }).filter(Boolean);
  
  return {
    success: true,
    connections: connectionUsers
  };
};

// Run BFS algorithm
export const runBFSMock = async (startUserId, targetUserId = null) => {
  // Simulate network delay
  await delay(1000);
  
  // Check if start user exists
  if (!users.some(u => u.id === startUserId)) {
    return {
      success: false,
      message: `Start user with ID ${startUserId} not found`
    };
  }
  
  // Check if target user exists (if provided)
  if (targetUserId && !users.some(u => u.id === targetUserId)) {
    return {
      success: false,
      message: `Target user with ID ${targetUserId} not found`
    };
  }
  
  // BFS algorithm
  const visited = [];
  const queue = [startUserId];
  const parent = {};
  let found = false;
  
  while (queue.length > 0 && !found) {
    const current = queue.shift();
    
    if (!visited.includes(current)) {
      visited.push(current);
      
      if (current === targetUserId) {
        found = true;
        break;
      }
      
      // Get connections for current user
      const currentConnections = connections[current] || [];
      
      // Add unvisited connections to the queue
      for (const connId of currentConnections) {
        if (!visited.includes(connId) && !queue.includes(connId)) {
          queue.push(connId);
          parent[connId] = current;
        }
      }
    }
  }
  
  // If target is specified, reconstruct path
  let path = null;
  let distance = 0;
  
  if (targetUserId && found) {
    path = [targetUserId];
    let current = targetUserId;
    
    while (current !== startUserId) {
      current = parent[current];
      path.unshift(current);
    }
    
    distance = path.length - 1;
  }
  
  return {
    success: true,
    result: {
      visited,
      path,
      distance
    }
  };
};

// Run DFS algorithm
export const runDFSMock = async (startUserId, targetUserId = null) => {
  // Simulate network delay
  await delay(1000);
  
  // Check if start user exists
  if (!users.some(u => u.id === startUserId)) {
    return {
      success: false,
      message: `Start user with ID ${startUserId} not found`
    };
  }
  
  // Check if target user exists (if provided)
  if (targetUserId && !users.some(u => u.id === targetUserId)) {
    return {
      success: false,
      message: `Target user with ID ${targetUserId} not found`
    };
  }
  
  const visited = [];
  const parent = {};
  let found = false;
  
  // DFS recursive function
  const dfs = (userId) => {
    visited.push(userId);
    
    if (userId === targetUserId) {
      found = true;
      return;
    }
    
    const userConnections = connections[userId] || [];
    
    for (const connId of userConnections) {
      if (!visited.includes(connId) && !found) {
        parent[connId] = userId;
        dfs(connId);
      }
    }
  };
  
  dfs(startUserId);
  
  // If target is specified, reconstruct path
  let path = null;
  let distance = 0;
  
  if (targetUserId && found) {
    path = [targetUserId];
    let current = targetUserId;
    
    while (current !== startUserId) {
      current = parent[current];
      path.unshift(current);
    }
    
    distance = path.length - 1;
  }
  
  return {
    success: true,
    result: {
      visited,
      path,
      distance
    }
  };
}; 