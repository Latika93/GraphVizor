# Social Network Visualization and Analysis

A web application for managing, visualizing, and analyzing social networks built with React.

## Features

### User Management

- Add and view users with personal information (name, ID, age, interests)
- Search users by name, ID, or interests
- Select users to view their connections and perform analyses

### Connection Management

- Create connections between users to build the social network
- View connections for selected users
- Visual representation of connection relationships

### Graph Analysis Tools

- **Traversal Algorithms**:
  - Breadth-First Search (BFS): Level-wise traversal with visual representation
  - Depth-First Search (DFS): Deep-path traversal with visual representation
- **Path Finding**:
  - Find shortest paths between users in the network
  - Visual display of path discovery and traversal
  - Clear indication when no path exists between selected users
- **Centrality Measures**:
  - Degree Centrality: Measure of direct connections
  - Betweenness Centrality: Measure of how often a node acts as a bridge
  - Closeness Centrality: Measure of how close a node is to all other nodes
  - Eigenvector Centrality: Measure of influence of a node in the network

### Visualization Features

- Interactive network visualization with user avatars and visual identifiers
- Color-coded user representations based on user ID
- Animation effects for traversal and path finding algorithms
- Level-wise representation for BFS showing network hierarchy
- Centrality visualization with size-scaled nodes reflecting importance

### Other Features

- Responsive UI design with modern aesthetics
- Real-time feedback and loading states
- Error handling and user notifications
- Dynamic search filtering capabilities

## Technical Implementation

- React-based frontend with custom CSS
- Stateful components with React Hooks
- API integration for data management
- Optimized rendering with animation effects
- Modular component architecture
- Advanced graph theory algorithms

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Add users through the Add User form
2. Create connections between users with the Add Connection form
3. Select a user to view their connections
4. Use Graph Analysis to run traversal algorithms
5. Use Shortest Path to find connections between users
6. Use Centrality Measures to identify important nodes in the network

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Styling**: CSS with custom color palette

## Project Structure

The project is divided into two main parts:

1. Backend (`be-social/`)

   - Express.js server with REST API
   - In-memory graph data structure
   - BFS and DFS algorithms

2. Frontend (`fe-social/`)
   - React.js components for UI
   - Axios for API calls
   - Responsive design

## How to Run

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd be-social
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the server:
   ```
   npm run dev
   ```
   The server will run on port 5000.

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd fe-social
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   The application will open in your browser at http://localhost:3000.

## Future Enhancements

- Add graph visualization using libraries like Cytoscape.js or D3.js
- Implement more advanced graph algorithms (shortest path, centrality measures)
- Add persistent storage with a database
- Enable user authentication and personal networks
