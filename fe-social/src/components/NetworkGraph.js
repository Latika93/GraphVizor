import React, { useState, useEffect, useRef } from 'react';
import { getGraphData } from '../utils/api';

const NetworkGraph = ({ refreshTrigger, onNodeClick }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Calculate layout using force-directed algorithm
  const [nodePositions, setNodePositions] = useState({});
  const animationRef = useRef(null);
  
  // Fetch graph data
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        console.log("Fetching graph data...");
        const response = await getGraphData();
        console.log("Graph data response:", response);
        
        if (response.success) {
          const { users, connections } = response.graphData;
          
          // Transform data into format for our custom visualization
          const nodes = Object.keys(users).map(id => ({
            id,
            name: users[id].name,
            interests: users[id].interests || [],
            age: users[id].age,
            color: stringToColor(id)
          }));
          
          console.log("Nodes:", nodes);
          
          // Create links from connections
          const links = [];
          Object.keys(connections).forEach(userId => {
            connections[userId].forEach(connectedId => {
              // Only add one link between each pair of nodes
              if (userId < connectedId) {
                links.push({
                  source: userId,
                  target: connectedId
                });
              }
            });
          });
          
          console.log("Links:", links);
          
          setGraphData({ nodes, links });
          
          // Initialize node positions randomly
          const initialPositions = {};
          nodes.forEach(node => {
            initialPositions[node.id] = {
              x: Math.random() * (dimensions.width - 100) + 50,
              y: Math.random() * (dimensions.height - 100) + 50
            };
          });
          setNodePositions(initialPositions);
        } else {
          setError('Failed to fetch graph data');
        }
      } catch (err) {
        setError('An error occurred while fetching graph data');
        console.error('Error fetching graph data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGraphData();
  }, [refreshTrigger, dimensions.width, dimensions.height]);
  
  // Update dimensions on component mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({
          width: width,
          height: 400
        });
        console.log("Updated dimensions:", width, 400);
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Add event listener
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Apply force-directed layout
  useEffect(() => {
    if (graphData.nodes.length === 0 || Object.keys(nodePositions).length === 0) {
      console.log("No nodes or positions to animate");
      return;
    }
    
    console.log("Starting force simulation");
    let positions = { ...nodePositions };
    let iteration = 0;
    const maxIterations = 50; // Limit iterations to avoid infinite loop
    
    const simulateForces = () => {
      // Stop after maxIterations
      if (iteration >= maxIterations) {
        console.log("Max iterations reached, stopping simulation");
        return;
      }
      
      iteration++;
      
      // Create a copy of positions to work with
      const newPositions = { ...positions };
      
      // Apply repulsive forces between all nodes
      for (let i = 0; i < graphData.nodes.length; i++) {
        const nodeId1 = graphData.nodes[i].id;
        
        for (let j = i + 1; j < graphData.nodes.length; j++) {
          const nodeId2 = graphData.nodes[j].id;
          
          const dx = positions[nodeId2].x - positions[nodeId1].x;
          const dy = positions[nodeId2].y - positions[nodeId1].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Repulsive force (inversely proportional to distance)
          // Increased repulsive force to make nodes farther apart (about 0.5-1cm)
          const repulsiveForce = 1000 / (distance * distance);
          
          // Apply force with normalized direction
          const forceX = (dx / distance) * repulsiveForce;
          const forceY = (dy / distance) * repulsiveForce;
          
          newPositions[nodeId1].x -= forceX;
          newPositions[nodeId1].y -= forceY;
          newPositions[nodeId2].x += forceX;
          newPositions[nodeId2].y += forceY;
        }
      }
      
      // Apply attractive forces along links
      graphData.links.forEach(link => {
        const source = link.source;
        const target = link.target;
        
        const dx = positions[target].x - positions[source].x;
        const dy = positions[target].y - positions[source].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Attractive force (proportional to distance)
        // Reduced attractive force to allow nodes to stay farther apart
        const attractiveForce = distance * 0.005;
        
        // Apply force with normalized direction
        const forceX = (dx / distance) * attractiveForce;
        const forceY = (dy / distance) * attractiveForce;
        
        newPositions[source].x += forceX;
        newPositions[source].y += forceY;
        newPositions[target].x -= forceX;
        newPositions[target].y -= forceY;
      });
      
      // Keep nodes within bounds
      Object.keys(newPositions).forEach(nodeId => {
        const margin = 40; // Increased margin to keep nodes away from edges
        newPositions[nodeId].x = Math.max(margin, Math.min(dimensions.width - margin, newPositions[nodeId].x));
        newPositions[nodeId].y = Math.max(margin, Math.min(dimensions.height - margin, newPositions[nodeId].y));
      });
      
      positions = newPositions;
      setNodePositions(newPositions);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(simulateForces);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(simulateForces);
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, dimensions]);
  
  // Draw the graph
  useEffect(() => {
    if (!canvasRef.current || graphData.nodes.length === 0 || Object.keys(nodePositions).length === 0) {
      console.log("Can't draw: missing canvas, nodes, or positions", 
        !!canvasRef.current, graphData.nodes.length, Object.keys(nodePositions).length);
      return;
    }
    
    console.log("Drawing graph on canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw links
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    graphData.links.forEach(link => {
      const sourcePos = nodePositions[link.source];
      const targetPos = nodePositions[link.target];
      
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });
    
    // Draw nodes
    graphData.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      
      if (pos) {
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const radius = isSelected || isHovered ? 15 : 12;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Add border if selected or hovered
        if (isSelected || isHovered) {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Add initials
        const initials = getInitials(node.name);
        ctx.font = '8px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, pos.x, pos.y);
        
        // Add name label if hovered
        if (isHovered) {
          const label = `${node.name} (${node.id})`;
          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          // Background for the label
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(pos.x - textWidth/2 - 5, pos.y + radius + 5, textWidth + 10, 20);
          
          // Label text
          ctx.fillStyle = '#333';
          ctx.fillText(label, pos.x, pos.y + radius + 10);
        }
      }
    });
  }, [graphData, nodePositions, selectedNode, hoveredNode, dimensions]);
  
  // Handle mouse events
  const handleMouseMove = (e) => {
    if (graphData.nodes.length === 0 || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any node
    let hovered = null;
    for (const node of graphData.nodes) {
      const pos = nodePositions[node.id];
      if (pos) {
        const dx = pos.x - x;
        const dy = pos.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= 15) {
          hovered = node.id;
          break;
        }
      }
    }
    
    setHoveredNode(hovered);
    
    // Change cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hovered ? 'pointer' : 'default';
    }
  };
  
  const handleMouseClick = (e) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      
      // Call the click handler
      const clickedNode = graphData.nodes.find(node => node.id === hoveredNode);
      if (clickedNode && onNodeClick) {
        onNodeClick(clickedNode);
      }
    } else {
      setSelectedNode(null);
    }
  };
  
  // Generate a color from a string
  const stringToColor = (str) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
      '#6200EA', '#0097A7', '#43A047', '#FFB300', // Material Design
      '#3949AB', '#00897B', '#C0CA33', '#8E24AA', // More MD colors
      '#5C6BC0', '#9575CD'
    ];
    
    const hash = str.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + acc;
    }, 0);
    
    return colors[hash % colors.length];
  };
  
  // Get initials for node labels
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '20px', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ 
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(190, 170, 129, 0.3)',
          borderTopColor: '#BEAA81',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '20px', height: '400px' }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          border: '1px solid rgba(255, 82, 82, 0.3)',
          borderRadius: '4px',
          color: '#ff5252',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="card" 
      style={{ 
        position: 'relative',
        padding: '0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: 'white',
        overflow: 'hidden',
        height: '400px'
      }}
    >
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        background: 'linear-gradient(to right, var(--color-beige), var(--color-dark-blue))'
      }}></div>
      
      <div style={{ 
        position: 'absolute',
        top: '15px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: 'var(--color-dark-blue)',
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          Network Graph
          {graphData.nodes.length > 0 && (
            <span style={{ 
              marginLeft: '10px', 
              fontSize: '0.9rem', 
              backgroundColor: 'var(--color-dark-blue)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              verticalAlign: 'middle'
            }}>
              {graphData.nodes.length} Users
            </span>
          )}
        </h2>
      </div>
      
      <div style={{ width: '100%', height: '400px' }}>
        {graphData.nodes.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            padding: '20px',
            color: '#777',
            textAlign: 'center'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: '0 0 5px 0' }}>
              No users in the network yet
            </p>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Add users and connections to visualize the network
            </p>
          </div>
        ) : (
          <canvas 
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleMouseClick}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default NetworkGraph; 