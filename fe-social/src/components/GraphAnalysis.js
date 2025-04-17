import React, { useState, useEffect } from 'react';
import { getAllUsers, runBFS, runDFS } from '../utils/api';

// Add a function to organize BFS results by levels
const organizeLevelsByBFS = (visited, connections) => {
  const levels = [];
  const nodeToLevel = {};
  const queue = [visited[0]]; // Start with the first node (root)
  nodeToLevel[visited[0]] = 0;
  
  // First pass: determine the level of each node using BFS
  let currentIndex = 0;
  while (currentIndex < queue.length) {
    const currentNode = queue[currentIndex];
    const currentLevel = nodeToLevel[currentNode];
    
    // Ensure the level array exists
    if (!levels[currentLevel]) {
      levels[currentLevel] = [];
    }
    
    // Add node to its level
    levels[currentLevel].push(currentNode);
    
    // Add all unvisited neighbors to the queue
    const neighbors = connections[currentNode] || [];
    for (const neighbor of neighbors) {
      if (nodeToLevel[neighbor] === undefined && visited.includes(neighbor)) {
        queue.push(neighbor);
        nodeToLevel[neighbor] = currentLevel + 1;
      }
    }
    
    currentIndex++;
  }
  
  // Second pass: for any remaining nodes in visited that weren't placed in levels
  // (this can happen if the graph has disconnected components)
  for (const node of visited) {
    if (nodeToLevel[node] === undefined) {
      // Place unconnected nodes at the end
      const lastLevel = levels.length;
      if (!levels[lastLevel]) {
        levels[lastLevel] = [];
      }
      levels[lastLevel].push(node);
    }
  }
  
  return levels;
};

const GraphAnalysis = ({ selectedUser, refreshTrigger, onStartUserSelect }) => {
  const [users, setUsers] = useState([]);
  const [startUser, setStartUser] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [algorithm, setAlgorithm] = useState('bfs');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationStep, setAnimationStep] = useState(0);
  const [graphData, setGraphData] = useState(null);
  const [bfsLevels, setBfsLevels] = useState([]);
  
  // Fetch all users when component mounts or when refreshTrigger changes
  useEffect(() => {
    const fetchUsers = async () => {
      console.log('GraphAnalysis: Fetching users, refreshTrigger:', refreshTrigger);
      try {
        const response = await getAllUsers();
        console.log('GraphAnalysis: Got users response:', response);
        if (response.success) {
          setUsers(response.users);
          console.log('GraphAnalysis: Updated users state with:', response.users);
        } else {
          setError('Failed to fetch users for analysis');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users for analysis');
      }
    };

    fetchUsers();
  }, [refreshTrigger]); // Add refreshTrigger as a dependency
   
  // Update startUser when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setStartUser(selectedUser.id);
    } else {
      setStartUser('');
    }
    setTargetUser('');
    setResults(null);
  }, [selectedUser]);
  
  // Animation effect for results
  useEffect(() => {
    if (results) {
      setAnimationStep(0);
      const totalSteps = results.visited.length;
      
      const intervalId = setInterval(() => {
        setAnimationStep(prev => {
          const nextStep = prev + 1;
          if (nextStep >= totalSteps) {
            clearInterval(intervalId);
          }
          return nextStep;
        });
      }, 800);
      
      return () => clearInterval(intervalId);
    }
  }, [results]);

  // Add handler for startUser changes
  const handleStartUserChange = (e) => {
    const newStartUserId = e.target.value;
    setStartUser(newStartUserId);
    
    // Notify parent component
    if (onStartUserSelect) {
      onStartUserSelect(newStartUserId, users);
    }
  };

  // Add a function to extract connections from results
  const extractConnections = (visitedNodes) => {
    const connections = {};
    
    // Initialize connections for each node
    visitedNodes.forEach(node => {
      connections[node] = [];
    });
    
    // Add connections based on the traversal order (simplified approach)
    for (let i = 1; i < visitedNodes.length; i++) {
      const currentNode = visitedNodes[i];
      let parentFound = false;
      
      // Find the first previous node that could be the parent
      for (let j = 0; j < i; j++) {
        const potentialParent = visitedNodes[j];
        // In a real app, you would check if there's a real connection
        // This is a simplified approach assuming BFS traversal order
        connections[potentialParent].push(currentNode);
        parentFound = true;
        break;
      }
      
      // If no parent found, it's a disconnected node
      if (!parentFound && visitedNodes.length > 0) {
        // Connect to the first node as a fallback
        connections[visitedNodes[0]].push(currentNode);
      }
    }
    
    return connections;
  };

  // Update handleRunAlgorithm to calculate levels for BFS
  const handleRunAlgorithm = async () => {
    if (!startUser) {
      setError('Please select a starting user');
      return;
    }
    
    setError('');
    setResults(null);
    setAnimationStep(0);
    setBfsLevels([]);
    setLoading(true);
    
    try {
      let response;
      
      if (algorithm === 'bfs') {
        response = await runBFS(startUser, targetUser || null);
      } else {
        response = await runDFS(startUser, targetUser || null);
      }
      
      if (response.success) {
        setResults(response.result);
        
        // For BFS, organize nodes by level
        if (algorithm === 'bfs' && response.result.visited.length > 0) {
          const connections = extractConnections(response.result.visited);
          const levels = organizeLevelsByBFS(response.result.visited, connections);
          setBfsLevels(levels);
        } else {
          setBfsLevels([]);
        }
        
        // Check if a path was requested but not found
        if (targetUser && (!response.result.path || response.result.path.length === 0)) {
          setError(`No path exists between ${getUserNameById(startUser)} and ${getUserNameById(targetUser)}`);
        }
      } else {
        setError(response.message || 'Failed to run algorithm');
      }
    } catch (err) {
      setError('An error occurred while running the algorithm');
    } finally {
      setLoading(false);
    }
  };
  
  // Find user name by ID
  const getUserNameById = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  // Get algorithm information based on selected algorithm
  const getAlgorithmInfo = () => {
    if (algorithm === 'bfs') {
      return {
        name: 'Breadth-First Search',
        description: 'BFS explores all neighbors at the current depth level before moving to nodes at the next depth level. It finds the shortest path in unweighted graphs.',
        color: '#4285F4' // Google blue
      };
    } else {
      return {
        name: 'Depth-First Search',
        description: 'DFS explores as far as possible along each branch before backtracking. It\'s useful for topological sorting and finding connected components.',
        color: '#34A853' // Google green
      };
    }
  };
  
  const algorithmInfo = getAlgorithmInfo();
  
  return (
    <div className="card">
      <h2>Graph Analysis</h2>
      
      <div className="algorithm-info" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        borderLeft: `4px solid ${algorithmInfo.color}`,
        backgroundColor: `${algorithmInfo.color}10`,
        borderRadius: '4px'
      }}>
        <h3 style={{ color: algorithmInfo.color, marginBottom: '8px' }}>{algorithmInfo.name}</h3>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{algorithmInfo.description}</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="algorithm">Select Algorithm:</label>
        <select
          id="algorithm"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          style={{ 
            borderColor: algorithmInfo.color,
            boxShadow: `0 0 0 1px ${algorithmInfo.color}30`
          }}
        >
          <option value="bfs">Breadth-First Search (BFS)</option>
          <option value="dfs">Depth-First Search (DFS)</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="start-user">Start User:</label>
        <select
          id="start-user"
          value={startUser}
          onChange={handleStartUserChange}
          style={{ 
            borderColor: '#BEAA81',
            boxShadow: '0 0 0 1px rgba(190, 170, 129, 0.3)'
          }}
        >
          <option value="">Select a start user</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.id})
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="target-user">Target User (Optional):</label>
        <select
          id="target-user"
          value={targetUser}
          onChange={(e) => setTargetUser(e.target.value)}
          style={{ 
            borderColor: '#BEAA81',
            boxShadow: '0 0 0 1px rgba(190, 170, 129, 0.3)'
          }}
        >
          <option value="">None (traverse entire network)</option>
          {users.filter(user => user.id !== startUser).map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.id})
            </option>
          ))}
        </select>
      </div>
      
      <button 
        onClick={handleRunAlgorithm} 
        disabled={loading || !startUser}
        style={{ 
          backgroundColor: algorithmInfo.color,
          padding: '10px 20px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        }}
      >
        {loading ? (
          <span className="spinner" style={{ 
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            borderTopColor: '#fff',
            animation: 'spin 1s ease-in-out infinite',
            marginRight: '8px',
            verticalAlign: 'middle'
          }}></span>
        ) : null}
        {loading ? 'Running...' : `Run ${algorithmInfo.name}`}
      </button>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .node-highlight {
            animation: pulse 1s infinite;
          }
          .path-segment {
            opacity: 0;
            animation: fadeIn 0.5s forwards;
          }
          .visited-node {
            transition: all 0.5s ease;
          }
        `}
      </style>
      
      {error && (
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
      )}
      
      {results && (
        <div className="results" style={{ 
          marginTop: '30px',
          opacity: 0,
          animation: 'fadeIn 0.5s forwards',
          animationDelay: '0.2s'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ 
              margin: 0,
              color: algorithmInfo.color,
              position: 'relative'
            }}>
              Analysis Results
              <span style={{ 
                position: 'absolute',
                bottom: '-3px',
                left: '0',
                width: '40px',
                height: '3px',
                backgroundColor: algorithmInfo.color
              }}></span>
            </h3>
            
            {targetUser && results.path && (
              <div style={{ 
                backgroundColor: algorithm === 'bfs' ? '#4285F4' : '#34A853',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                Distance: {results.distance} {results.distance === 1 ? 'step' : 'steps'}
              </div>
            )}
          </div>
          
          <div className="result-card" style={{ 
            background: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            marginTop: '10px',
            border: `1px solid ${algorithmInfo.color}30`
          }}>
            <div className="visualization" style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              overflowX: 'auto'
            }}>
              <h4 style={{ 
                marginTop: 0,
                marginBottom: '15px',
                color: '#333',
                fontSize: '1rem'
              }}>
                Traversal Visualization
              </h4>
              
              {algorithm === 'bfs' && bfsLevels.length > 0 ? (
                // BFS Level-wise visualization
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {bfsLevels.map((level, levelIndex) => (
                    <div key={levelIndex} style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: animationStep >= level[0] ? 1 : 0.3,
                      transition: 'opacity 0.5s ease',
                    }}>
                      <div style={{ 
                        backgroundColor: '#E8EAF6', 
                        padding: '5px 12px', 
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: '#3F51B5',
                        marginBottom: '10px'
                      }}>
                        Level {levelIndex}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        justifyContent: 'center',
                        gap: '15px',
                        padding: '10px',
                        backgroundColor: `rgba(66, 133, 244, ${0.1 * (levelIndex + 1)})`,
                        borderRadius: '8px',
                        width: '100%'
                      }}>
                        {level.map((userId, nodeIndex) => {
                          // Find the index of this user in the visited array
                          const visitedIndex = results.visited.indexOf(userId);
                          
                          return (
                            <div 
                              key={nodeIndex}
                              className={`visited-node ${visitedIndex <= animationStep ? 'node-highlight' : ''}`}
                              style={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: visitedIndex <= animationStep ? 
                                  (userId === startUser ? '#BEAA81' : 
                                    (userId === targetUser ? algorithmInfo.color : '#fff')) : 
                                  '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: visitedIndex <= animationStep ? 
                                  (userId === startUser || userId === targetUser ? 'white' : '#333') : 
                                  '#999',
                                boxShadow: visitedIndex <= animationStep ? 
                                  (userId === startUser || userId === targetUser ? 
                                    '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)') : 
                                  'none',
                                opacity: visitedIndex <= animationStep ? 1 : 0.5,
                                transition: 'all 0.5s ease',
                                position: 'relative',
                                zIndex: 2
                              }}
                            >
                              {getUserNameById(userId).split(' ')[0]}
                              {visitedIndex <= animationStep && (
                                <div style={{ 
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: algorithmInfo.color,
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 3
                                }}>
                                  {visitedIndex + 1}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Standard DFS linear visualization (unchanged)
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                  padding: '0 10px'
                }}>
                  {results.visited.map((userId, index) => (
                    <React.Fragment key={index}>
                      <div 
                        className={`visited-node ${index <= animationStep ? 'node-highlight' : ''}`}
                        style={{ 
                          minWidth: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: index <= animationStep ? 
                            (userId === startUser ? '#BEAA81' : 
                              (userId === targetUser ? algorithmInfo.color : '#ddd')) : 
                            '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: index <= animationStep ? 
                            (userId === startUser || userId === targetUser ? 'white' : '#333') : 
                            '#999',
                          boxShadow: index <= animationStep ? 
                            (userId === startUser || userId === targetUser ? 
                              '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)') : 
                            'none',
                          opacity: index <= animationStep ? 1 : 0.5,
                          transition: 'all 0.5s ease',
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {getUserNameById(userId).split(' ')[0]}
                        {index <= animationStep && (
                          <div style={{ 
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: algorithmInfo.color,
                            color: 'white',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 3
                          }}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                      
                      {index < results.visited.length - 1 && (
                        <div 
                          className={index < animationStep ? 'path-segment' : ''}
                          style={{ 
                            height: '2px',
                            backgroundColor: index < animationStep ? 
                              algorithm === 'bfs' ? '#4285F4' : '#34A853' : 
                              '#ddd',
                            flexGrow: 1,
                            margin: '0 5px',
                            opacity: index < animationStep ? 1 : 0.3,
                            animationDelay: `${index * 0.2}s`,
                            zIndex: 1
                          }}
                        ></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            
            <div className="info-columns" style={{ 
              display: 'grid',
              gridTemplateColumns: targetUser && results.path ? '1fr 1fr' : '1fr',
              gap: '20px'
            }}>
              <div>
                <h4 style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  color: '#333',
                  fontSize: '1rem',
                  marginTop: 0,
                  marginBottom: '10px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={algorithmInfo.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                  </svg>
                  Visited Users (in order)
                </h4>
                <ol style={{ 
                  paddingLeft: '20px',
                  margin: '0',
                  color: '#555',
                  lineHeight: '1.8'
                }}>
                  {results.visited.map((userId, index) => (
                    <li key={index} style={{ 
                      opacity: index <= animationStep ? 1 : 0.3,
                      transform: index <= animationStep ? 'translateX(0)' : 'translateX(-10px)',
                      transition: 'all 0.3s ease',
                      transitionDelay: `${index * 0.1}s`,
                      backgroundColor: userId === startUser ? 
                        'rgba(190, 170, 129, 0.1)' : 
                        (userId === targetUser ? `${algorithmInfo.color}10` : 'transparent'),
                      padding: '3px 6px',
                      borderRadius: '3px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ 
                        fontWeight: userId === startUser || userId === targetUser ? 'bold' : 'normal',
                        color: userId === startUser ? '#BEAA81' : 
                          (userId === targetUser ? algorithmInfo.color : '#555')
                      }}>
                        {getUserNameById(userId)} <span style={{ opacity: 0.7 }}>({userId})</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {targetUser && (
                <div>
                  <h4 style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#333',
                    fontSize: '1rem',
                    marginTop: 0,
                    marginBottom: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={algorithmInfo.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="8 12 12 16 16 12"></polyline>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                    </svg>
                    Path to Target
                  </h4>
                  
                  {results.path && results.path.length > 0 ? (
                    <ol style={{ 
                      paddingLeft: '20px',
                      margin: '0',
                      color: '#555',
                      lineHeight: '1.8'
                    }}>
                      {results.path.map((userId, index) => (
                        <li key={index} className="path-segment" style={{ 
                          animationDelay: `${0.5 + index * 0.2}s`,
                          backgroundColor: userId === startUser ? 
                            'rgba(190, 170, 129, 0.1)' : 
                            (userId === targetUser ? `${algorithmInfo.color}10` : 'rgba(240, 240, 240, 0.5)'),
                          padding: '4px 8px',
                          borderRadius: '3px',
                          marginBottom: '4px',
                          position: 'relative'
                        }}>
                          <span style={{ 
                            fontWeight: userId === startUser || userId === targetUser ? 'bold' : 'normal',
                            color: userId === startUser ? '#BEAA81' : 
                              (userId === targetUser ? algorithmInfo.color : '#555')
                          }}>
                            {getUserNameById(userId)} <span style={{ opacity: 0.7 }}>({userId})</span>
                          </span>
                          
                          {index < results.path.length - 1 && (
                            <div style={{ 
                              position: 'absolute',
                              left: '10px',
                              bottom: '-14px',
                              color: algorithm === 'bfs' ? '#4285F4' : '#34A853',
                              fontSize: '1.2rem',
                              lineHeight: 1
                            }}>↓</div>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                      borderRadius: '6px',
                      border: '1px solid rgba(244, 67, 54, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#F44336' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span style={{ fontWeight: 'bold' }}>No Path Found</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                        There is no connection path between <strong>{getUserNameById(startUser)}</strong> and <strong>{getUserNameById(targetUser)}</strong> in the network.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphAnalysis; 