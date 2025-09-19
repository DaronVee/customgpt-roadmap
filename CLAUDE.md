# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive roadmap application for managing CustomGPT expansion projects. It's a full-stack web application with:
- **Backend**: Express.js server (Node.js) serving REST API endpoints
- **Frontend**: Vanilla JavaScript SPA with multiple view modes (Tree, Kanban, Timeline, Grid)
- **Data Storage**: JSON file-based persistence (`data/roadmap.json`)
- **Architecture**: Client-server with real-time progress tracking and hierarchical data structure

## Development Commands

### Starting the Application
```bash
# Install dependencies (run once)
npm install

# Start production server
npm start

# Start development server with auto-reload
npm run dev
```

The application runs on `http://localhost:3001` by default.

### Development Tools
- Uses `nodemon` for development auto-reload
- No build process required (vanilla JS/HTML/CSS)
- No testing framework configured

## Code Architecture

### Backend Structure (`server.js`)
- **Express.js server** with CORS and JSON middleware
- **REST API endpoints**:
  - `GET /api/roadmap` - Load roadmap data
  - `POST /api/roadmap` - Save entire roadmap
  - `PUT /api/roadmap/item/:id` - Update specific item
- **Data initialization** with comprehensive default roadmap structure
- **File-based persistence** using `fs-extra` for JSON operations

### Frontend Structure
- **`public/index.html`**: Main HTML template with header, navigation, and content areas
- **`public/roadmap.js`**: Core `RoadmapManager` class handling:
  - Data fetching and persistence
  - Multiple view rendering (Tree, Kanban, Timeline, Grid)
  - Event handling and user interactions
  - Progress calculations and UI updates
- **`public/styles.css`**: Complete styling with CSS variables for theming

### Data Model
Hierarchical structure: `roadmap` → `axes` → `pipelines/components/phases` → `tasks`

Each item has:
- `id` (UUID), `title`, `type`, `progress` (0-100), `validated` (boolean)
- Container items have arrays of child items
- Progress is calculated recursively from children

### Key Features
- **Multiple Views**: Tree (hierarchical), Kanban (status-based), Timeline (chronological), Grid (card layout)
- **Real-time Progress**: Automatic calculation and visual indicators
- **CRUD Operations**: Add/edit/delete any level of the hierarchy
- **Data Persistence**: Auto-save to backend with optimistic UI updates
- **Navigation**: Sidebar with scrollable navigation to any item

## Working with This Codebase

### Adding New Features
- Frontend logic goes in `RoadmapManager` class methods
- Backend API endpoints follow RESTful patterns
- Data structure modifications require updating both initialization and processing logic

### Key Files to Understand
- `server.js:20-208` - Default data structure and initialization
- `roadmap.js:68-87` - View switching logic
- `roadmap.js:1-41` - Data loading and API communication

### Common Tasks
- **Add new view**: Create render method in `RoadmapManager`, update `renderContent()` switch
- **Modify data structure**: Update initialization in `server.js` and processing in `roadmap.js`
- **Add API endpoint**: Follow pattern in `server.js` with error handling