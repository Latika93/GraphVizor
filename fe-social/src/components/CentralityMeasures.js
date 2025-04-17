import React, { useState, useEffect } from 'react';
import { getAllUsers, getUserConnections } from '../utils/api';

const CentralityMeasures = () => {
  const [users, setUsers] = useState([]);
  const [networkData, setNetworkData] = useState(null);
  const [centrality, setCentrality] = useState({
    degree: {},
    betweenness: {},
    closeness: {},
    eigenvector: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMeasure, setSelectedMeasure] = useState('degree');

  // Fetch all users and build network data when component mounts
  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get all users
        const response = await getAllUsers();
        if (!response.success) {
          throw new Error('Failed to fetch users');
        }
        
        const allUsers = response.users;
        setUsers(allUsers);
        
        // Build adjacency list for the network
        const network = {};
        
        // Initialize empty adjacency lists for each user
        allUsers.forEach(user => {
          network[user.id] = [];
        });
        
        // Fetch connections for each user and populate the network
        for (const user of allUsers) {
          const connResponse = await getUserConnections(user.id);
          if (connResponse.success) {
            const connections = connResponse.connections || [];
            // Add each connection to the network
            connections.forEach(conn => {
              if (!network[user.id].includes(conn.id)) {
                network[user.id].push(conn.id);
              }
              // Ensure bidirectional connections (if connections are undirected)
              if (!network[conn.id].includes(user.id)) {
                network[conn.id].push(user.id);
              }
            });
          }
        }
        
        setNetworkData(network);
        
        // Calculate centrality measures
        calculateCentrality(network, allUsers.map(user => user.id));
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError('Failed to load network data for centrality analysis');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNetworkData();
  }, []);
  
  // Calculate all centrality measures based on network data
  const calculateCentrality = (network, userIds) => {
    if (!network || Object.keys(network).length === 0) return;
    
    const newCentrality = {
      degree: calculateDegreeCentrality(network),
      betweenness: calculateBetweennessCentrality(network, userIds),
      closeness: calculateClosenessCentrality(network, userIds),
      eigenvector: calculateEigenvectorCentrality(network, userIds)
    };
    
    setCentrality(newCentrality);
  };
  
  // Calculate degree centrality (number of direct connections)
  const calculateDegreeCentrality = (network) => {
    const result = {};
    
    Object.keys(network).forEach(userId => {
      result[userId] = network[userId].length;
    });
    
    return normalizeValues(result);
  };
  
  // Calculate betweenness centrality (how often a node is in the shortest path between other nodes)
  const calculateBetweennessCentrality = (network, userIds) => {
    const result = {};
    userIds.forEach(id => result[id] = 0);
    
    // For each pair of nodes
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const start = userIds[i];
        const end = userIds[j];
        
        // Skip if same node
        if (start === end) continue;
        
        // Find all shortest paths between start and end
        const { shortestPaths, distances } = findAllShortestPaths(network, start, end);
        
        // If no path exists, skip
        if (!shortestPaths || shortestPaths.length === 0) continue;
        
        // Count how many times each node appears in shortest paths
        userIds.forEach(nodeId => {
          if (nodeId !== start && nodeId !== end) {
            let pathsThroughNode = 0;
            
            shortestPaths.forEach(path => {
              if (path.includes(nodeId)) {
                pathsThroughNode++;
              }
            });
            
            result[nodeId] += pathsThroughNode / shortestPaths.length;
          }
        });
      }
    }
    
    return normalizeValues(result);
  };
  
  // Find all shortest paths between start and end nodes
  const findAllShortestPaths = (network, start, end) => {
    // Early check if direct connection exists
    if (network[start].includes(end)) {
      return { 
        shortestPaths: [[start, end]], 
        distances: { [start]: 0, [end]: 1 } 
      };
    }
    
    // BFS to find shortest distance to each node from start
    const distances = {};
    const queue = [start];
    const visited = new Set([start]);
    distances[start] = 0;
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      for (const neighbor of network[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          distances[neighbor] = distances[current] + 1;
        }
      }
    }
    
    // If end is not reachable, return empty
    if (distances[end] === undefined) {
      return { shortestPaths: [], distances: {} };
    }
    
    // DFS to find all paths of shortest length
    const shortestPaths = [];
    const backtrack = (currentNode, path, targetLength) => {
      // If path length would exceed the target, stop
      if (path.length > targetLength) return;
      
      // If we reached the end and path is the correct length
      if (currentNode === end && path.length - 1 === targetLength) {
        shortestPaths.push([...path]);
        return;
      }
      
      // Try all neighbors
      for (const neighbor of network[currentNode]) {
        if (!path.includes(neighbor) && distances[neighbor] === distances[currentNode] + 1) {
          path.push(neighbor);
          backtrack(neighbor, path, targetLength);
          path.pop();
        }
      }
    };
    
    backtrack(start, [start], distances[end]);
    
    return { shortestPaths, distances };
  };
  
  // Calculate closeness centrality (reciprocal of the sum of shortest distances to all other nodes)
  const calculateClosenessCentrality = (network, userIds) => {
    const result = {};
    
    userIds.forEach(userId => {
      const distances = findShortestPaths(network, userId);
      let sum = 0;
      let reachableNodes = 0;
      
      userIds.forEach(otherId => {
        if (userId !== otherId) {
          if (distances[otherId] !== undefined) {
            sum += distances[otherId];
            reachableNodes++;
          }
        }
      });
      
      // If node can reach other nodes, calculate closeness
      if (reachableNodes > 0 && sum > 0) {
        // Normalized closeness: (n-1)/N * (reachableNodes/(n-1)) * (1/sum)
        // where n is total nodes, N is reachable nodes
        result[userId] = reachableNodes / sum;
      } else {
        result[userId] = 0;
      }
    });
    
    return normalizeValues(result);
  };
  
  // Find shortest paths from start to all nodes
  const findShortestPaths = (network, start) => {
    const distances = {};
    const queue = [start];
    distances[start] = 0;
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      for (const neighbor of network[current]) {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = distances[current] + 1;
          queue.push(neighbor);
        }
      }
    }
    
    return distances;
  };
  
  // Calculate eigenvector centrality (influence of a node in the network)
  const calculateEigenvectorCentrality = (network, userIds) => {
    // Initialize centrality values with 1.0
    let centrality = {};
    userIds.forEach(id => centrality[id] = 1.0);
    
    // Power iteration to converge on eigenvector centrality
    const iterations = 100;
    const dampingFactor = 0.85;
    
    for (let i = 0; i < iterations; i++) {
      let newCentrality = {};
      userIds.forEach(id => newCentrality[id] = 0);
      
      // Update each node's centrality
      userIds.forEach(userId => {
        // Sum the centrality of all neighbors
        network[userId].forEach(neighborId => {
          newCentrality[neighborId] += centrality[userId] / network[userId].length;
        });
      });
      
      // Normalize and apply damping
      let norm = 0;
      userIds.forEach(id => {
        newCentrality[id] = dampingFactor * newCentrality[id] + (1 - dampingFactor);
        norm += newCentrality[id] * newCentrality[id];
      });
      
      norm = Math.sqrt(norm);
      
      // Update centrality
      userIds.forEach(id => {
        centrality[id] = newCentrality[id] / norm;
      });
    }
    
    return normalizeValues(centrality);
  };
  
  // Normalize values to range from 0 to 1
  const normalizeValues = (values) => {
    const normalized = { ...values };
    const allValues = Object.values(values);
    
    if (allValues.length === 0) return normalized;
    
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    
    if (maxValue === minValue) {
      Object.keys(normalized).forEach(key => {
        normalized[key] = maxValue === 0 ? 0 : 1;
      });
      return normalized;
    }
    
    Object.keys(normalized).forEach(key => {
      normalized[key] = (normalized[key] - minValue) / (maxValue - minValue);
    });
    
    return normalized;
  };
  
  // Get user name by ID
  const getUserNameById = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };
  
  // Get centrality description based on selected measure
  const getCentralityInfo = () => {
    const info = {
      degree: {
        name: 'Degree Centrality',
        description: 'Measures the number of direct connections each node has. Nodes with higher degree centrality have more direct connections.',
        color: '#4285F4' // Google blue
      },
      betweenness: {
        name: 'Betweenness Centrality',
        description: 'Measures how often a node lies on the shortest path between other nodes. Nodes with high betweenness act as bridges in the network.',
        color: '#EA4335' // Google red
      },
      closeness: {
        name: 'Closeness Centrality',
        description: 'Measures how close a node is to all other nodes in the network. Nodes with high closeness can quickly interact with many other nodes.',
        color: '#34A853' // Google green
      },
      eigenvector: {
        name: 'Eigenvector Centrality',
        description: 'Measures the influence of a node based on its connections. Nodes with high eigenvector centrality are connected to other important nodes.',
        color: '#FBBC05' // Google yellow
      }
    };
    
    return info[selectedMeasure];
  };
  
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
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Color intensity based on centrality value
  const getOpacityForValue = (value) => {
    return 0.2 + (value * 0.8); // Scale from 0.2 to 1.0
  };
  
  const centralityInfo = getCentralityInfo();
  
  // Sort users by selected centrality measure
  const sortedUsers = [...users].sort((a, b) => {
    const centralityA = centrality[selectedMeasure][a.id] || 0;
    const centralityB = centrality[selectedMeasure][b.id] || 0;
    return centralityB - centralityA;
  });
  
  return (
    <div className="card">
      <h2>Centrality Measures</h2>
      
      <div className="centrality-info" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        borderLeft: `4px solid ${centralityInfo.color}`,
        backgroundColor: `${centralityInfo.color}10`,
        borderRadius: '4px'
      }}>
        <h3 style={{ color: centralityInfo.color, marginBottom: '8px' }}>{centralityInfo.name}</h3>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{centralityInfo.description}</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="centrality-measure">Select Measure:</label>
        <select
          id="centrality-measure"
          value={selectedMeasure}
          onChange={(e) => setSelectedMeasure(e.target.value)}
          style={{ 
            borderColor: centralityInfo.color,
            boxShadow: `0 0 0 1px ${centralityInfo.color}30`
          }}
        >
          <option value="degree">Degree Centrality</option>
          <option value="betweenness">Betweenness Centrality</option>
          <option value="closeness">Closeness Centrality</option>
          <option value="eigenvector">Eigenvector Centrality</option>
        </select>
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%',
            border: '3px solid rgba(0,0,0,0.1)',
            borderTopColor: centralityInfo.color,
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : error ? (
        <div className="error" style={{ 
          marginTop: '15px',
          padding: '10px 15px',
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          border: '1px solid rgba(255, 82, 82, 0.3)',
          borderRadius: '4px',
          color: '#ff5252',
          fontSize: '0.9rem'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      ) : (
        <div className="centrality-results">
          {/* Visualization */}
          <div className="centrality-visualization" style={{ 
            marginBottom: '25px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            padding: '20px',
            overflowX: 'auto'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
              Network Visualization ({centrality[selectedMeasure] ? Object.keys(centrality[selectedMeasure]).length : 0} Users)
            </h4>
            
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              justifyContent: 'center'
            }}>
              {sortedUsers.map(user => {
                const value = centrality[selectedMeasure][user.id] || 0;
                const size = 50 + (value * 70); // Size based on centrality (50px to 120px)
                const opacity = getOpacityForValue(value);
                
                return (
                  <div key={user.id} style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px',
                    width: '120px',
                    animation: 'fadeIn 0.5s forwards',
                    animationDelay: `${0.05 * sortedUsers.indexOf(user)}s`
                  }}>
                    <div style={{ 
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: '50%',
                      backgroundColor: `${centralityInfo.color}${Math.round(opacity * 100)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      transition: 'all 0.3s ease',
                      border: `2px solid ${centralityInfo.color}`,
                      boxShadow: `0 4px 8px rgba(0,0,0,${0.05 + opacity * 0.15})`,
                      position: 'relative'
                    }}>
                      <div style={{ 
                        width: '50%',
                        height: '50%',
                        borderRadius: '50%',
                        backgroundColor: getColorForUser(user.id),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: `${size/4}px`
                      }}>
                        {getInitials(user.name)}
                      </div>
                      
                      {/* Score indicator */}
                      {value > 0 && (
                        <div style={{ 
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          padding: '5px',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${centralityInfo.color}`,
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          color: centralityInfo.color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {(value * 10).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '0.85rem',
                      fontWeight: value > 0.7 ? 'bold' : 'normal',
                      textAlign: 'center',
                      color: value > 0.7 ? centralityInfo.color : '#555'
                    }}>
                      {user.name}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: '#777',
                      opacity: 0.8
                    }}>
                      {(value * 10).toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {sortedUsers.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#777'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px', color: '#aaa' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No users available for centrality analysis</p>
                <p style={{ fontSize: '0.85rem' }}>Add users to the network to see centrality measures</p>
              </div>
            )}
          </div>
          
          {/* Table showing centrality values */}
          <div className="centrality-table-container" style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
              backgroundColor: 'white',
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: centralityInfo.color,
                  color: 'white'
                }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right' }}>Score</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center' }}>Normalized</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => {
                  const value = centrality[selectedMeasure][user.id] || 0;
                  const rank = index + 1;
                  
                  return (
                    <tr key={user.id} style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                      animation: 'fadeIn 0.3s forwards',
                      animationDelay: `${0.05 * index}s`,
                    }}>
                      <td style={{ 
                        padding: '10px 15px',
                        fontWeight: 'bold',
                        color: rank <= 3 ? centralityInfo.color : '#555'
                      }}>
                        {rank <= 3 ? (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
                            color: rank === 1 ? '#5F4B0A' : '#333',
                            fontSize: '0.75rem',
                            marginRight: '5px'
                          }}>
                            {rank}
                          </span>
                        ) : rank}
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: getColorForUser(user.id),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            marginRight: '10px'
                          }}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 15px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '500' }}>
                        {(value * 10).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                        <div style={{ 
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#eee',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%',
                            width: `${value * 100}%`,
                            backgroundColor: centralityInfo.color,
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {sortedUsers.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                No data available
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CentralityMeasures; 