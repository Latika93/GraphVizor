/**
 * Graph data structure for the social network
 * Implemented using an adjacency list
 */

class SocialGraph {
  constructor() {
    this.users = {}; // Maps user IDs to user data
    this.adjacencyList = {}; // Maps user IDs to arrays of connected user IDs
  }

  // Add a new user to the social network
  addUser(id, userData) {
    if (this.users[id]) {
      return { success: false, message: "User with this ID already exists" };
    }
    
    this.users[id] = userData;
    this.adjacencyList[id] = [];
    
    return { success: true, user: userData };
  }

  // Get a user by ID
  getUser(id) {
    return this.users[id];
  }

  // Get all users
  getAllUsers() {
    return Object.keys(this.users).map(id => ({
      id,
      ...this.users[id]
    }));
  }

  // Add a connection (edge) between two users
  addConnection(userId1, userId2) {
    // Check if both users exist
    if (!this.users[userId1] || !this.users[userId2]) {
      return { success: false, message: "One or both users don't exist" };
    }
    
    // Check if connection already exists
    if (this.adjacencyList[userId1].includes(userId2)) {
      return { success: false, message: "Connection already exists" };
    }
    
    // Add bidirectional connection (for undirected graph)
    this.adjacencyList[userId1].push(userId2);
    this.adjacencyList[userId2].push(userId1);
    
    return { success: true };
  }

  // Get all connections for a user
  getConnections(userId) {
    if (!this.adjacencyList[userId]) {
      return [];
    }
    
    return this.adjacencyList[userId];
  }

  // Get the entire graph data
  getGraphData() {
    return {
      users: this.users,
      connections: this.adjacencyList
    };
  }
}

// Create and export a singleton instance
const socialGraph = new SocialGraph();
module.exports = socialGraph; 