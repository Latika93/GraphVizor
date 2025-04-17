const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const socialGraph = require('./graph');
const algorithms = require('./algorithms');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = socialGraph.getAllUsers();
    // Log for debugging
    console.log('GET /api/users response:', { success: true, users });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a new user
app.post('/api/users', (req, res) => {
  try {
    const { id, name, age, interests } = req.body;
    
    console.log('POST /api/users request:', { id, name, age, interests });
    
    if (!id || !name) {
      return res.status(400).json({ success: false, message: "ID and name are required" });
    }
    
    const result = socialGraph.addUser(id, { name, age, interests });
    
    console.log('POST /api/users response:', result);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific user
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = socialGraph.getUser(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, user: { id, ...user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a connection between users
app.post('/api/connections', (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ success: false, message: "Both user IDs are required" });
    }
    
    if (userId1 === userId2) {
      return res.status(400).json({ success: false, message: "Cannot connect a user to themselves" });
    }
    
    const result = socialGraph.addConnection(userId1, userId2);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get connections for a user
app.get('/api/users/:id/connections', (req, res) => {
  try {
    const { id } = req.params;
    const user = socialGraph.getUser(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const connectionIds = socialGraph.getConnections(id);
    const connections = connectionIds.map(connId => ({
      id: connId,
      ...socialGraph.getUser(connId)
    }));
    
    res.json({ success: true, connections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get entire graph data
app.get('/api/graph', (req, res) => {
  try {
    const graphData = socialGraph.getGraphData();
    res.json({ success: true, graphData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run BFS algorithm
app.get('/api/algorithms/bfs', (req, res) => {
  try {
    const { startUserId, targetUserId } = req.query;
    
    if (!startUserId) {
      return res.status(400).json({ success: false, message: "Start user ID is required" });
    }
    
    const result = algorithms.bfs(startUserId, targetUserId || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run DFS algorithm
app.get('/api/algorithms/dfs', (req, res) => {
  try {
    const { startUserId, targetUserId } = req.query;
    
    if (!startUserId) {
      return res.status(400).json({ success: false, message: "Start user ID is required" });
    }
    
    const result = algorithms.dfs(startUserId, targetUserId || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 