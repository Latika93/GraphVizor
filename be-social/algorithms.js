/**
 * Graph traversal algorithms for social network analysis
 */

const socialGraph = require('./graph');

/**
 * Breadth-First Search (BFS) implementation
 * @param {string} startUserId - The ID of the user to start the search from
 * @param {string} targetUserId - Optional: The ID of the user to search for
 * @returns {Object} - Result of the BFS traversal
 */
function bfs(startUserId, targetUserId = null) {
  // Check if the start user exists
  if (!socialGraph.getUser(startUserId)) {
    return { success: false, message: "Start user doesn't exist" };
  }
  
  // If target is specified, check if it exists
  if (targetUserId && !socialGraph.getUser(targetUserId)) {
    return { success: false, message: "Target user doesn't exist" };
  }
  
  const visited = {};
  const queue = [{ id: startUserId, distance: 0, path: [startUserId] }];
  const result = {
    visited: [],
    path: null,
    distance: null
  };
  
  // Mark the start user as visited
  visited[startUserId] = true;
  
  while (queue.length > 0) {
    const current = queue.shift();
    result.visited.push(current.id);
    
    // If we're searching for a specific user and found them
    if (targetUserId && current.id === targetUserId) {
      result.path = current.path;
      result.distance = current.distance;
      break;
    }
    
    // Process all neighbors
    const connections = socialGraph.getConnections(current.id);
    for (const neighborId of connections) {
      if (!visited[neighborId]) {
        visited[neighborId] = true;
        queue.push({
          id: neighborId,
          distance: current.distance + 1,
          path: [...current.path, neighborId]
        });
      }
    }
  }
  
  return {
    success: true,
    result,
    targetFound: targetUserId ? result.path !== null : null
  };
}

/**
 * Depth-First Search (DFS) implementation
 * @param {string} startUserId - The ID of the user to start the search from
 * @param {string} targetUserId - Optional: The ID of the user to search for
 * @returns {Object} - Result of the DFS traversal
 */
function dfs(startUserId, targetUserId = null) {
  // Check if the start user exists
  if (!socialGraph.getUser(startUserId)) {
    return { success: false, message: "Start user doesn't exist" };
  }
  
  // If target is specified, check if it exists
  if (targetUserId && !socialGraph.getUser(targetUserId)) {
    return { success: false, message: "Target user doesn't exist" };
  }
  
  const visited = {};
  const result = {
    visited: [],
    path: null
  };
  
  // If we found the target during DFS
  let foundTarget = false;
  let targetPath = [];
  
  // Recursive DFS function
  function dfsRecursive(userId, path) {
    // Mark current user as visited
    visited[userId] = true;
    result.visited.push(userId);
    
    // If we're searching for a specific user and found them
    if (targetUserId && userId === targetUserId && !foundTarget) {
      foundTarget = true;
      targetPath = [...path];
      result.path = targetPath;
      return;
    }
    
    // Process all neighbors
    const connections = socialGraph.getConnections(userId);
    for (const neighborId of connections) {
      if (!visited[neighborId] && !foundTarget) {
        dfsRecursive(neighborId, [...path, neighborId]);
      }
    }
  }
  
  // Start DFS from the start user
  dfsRecursive(startUserId, [startUserId]);
  
  return {
    success: true,
    result,
    targetFound: targetUserId ? foundTarget : null
  };
}

module.exports = {
  bfs,
  dfs
}; 