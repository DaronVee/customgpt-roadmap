# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive roadmap application for managing CustomGPT expansion projects. It's a full-stack web application with:
- **Backend**: Express.js server (Node.js) serving REST API endpoints
- **Frontend**: Vanilla JavaScript SPA with multiple view modes (Tree, Kanban, Timeline, Grid)
- **Data Storage**: JSON file-based persistence (`data/roadmap.json`)
- **Architecture**: Client-server with real-time progress tracking and hierarchical data structure
- **Deployment**: Auto-deployed to Railway.app with GitHub integration

## Live Application
- **Production URL**: https://customgpt-roadmap-production.up.railway.app
- **Repository**: https://github.com/DaronVee/customgpt-roadmap
- **Auto-Deploy**: Configured from `main` branch on GitHub

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

### Deployment Configuration
- **Platform**: Railway.app
- **Configuration File**: `railway.json`
- **Builder**: Nixpacks (automatic Node.js detection)
- **Auto-Deploy**: Enabled from GitHub main branch
- **Restart Policy**: On failure with max 10 retries

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
- **Modern Progress System**: Clean, intuitive progress indicators with click-to-edit functionality
- **CRUD Operations**: Add/edit/delete any level of the hierarchy
- **Data Persistence**: Auto-save to backend with optimistic UI updates
- **Navigation**: Sidebar with scrollable navigation to any item
- **Expand/Collapse**: Full hierarchy folding support for clean organization

## UI Design & Progress System

### Current Progress Indicators (v2.0)
The application features a modern, multi-tiered progress visualization system:

**Main Axes (Level 1)**:
- **Circular Progress Rings**: Beautiful SVG-based circular indicators showing completion percentage
- **Click-to-edit**: Direct progress editing via prompt dialog
- **Hover Effects**: Smooth scaling animations on interaction

**Pipelines/Phases (Level 2-3)**:
- **Horizontal Progress Bars**: Clean, compact bars with gradient styling
- **Right-aligned Layout**: Progress indicators positioned on the right for clean text alignment
- **Interactive**: Click to edit progress with input validation (0-100%)

**Tasks (Level 4)**:
- **Smart Progress Dots**: Color-coded status indicators
  - Gray: Not started (0% progress)
  - Blue with glow: In progress (1-99% progress)
  - Green with checkmark: Completed (100% progress)
- **Minimal Footprint**: Small, unobtrusive but informative

### Layout & Alignment
- **Flexbox-based Structure**: All items properly aligned with consistent spacing
- **Hierarchical Indentation**: Clear visual hierarchy with appropriate nesting
- **Text Alignment**: Clean left-aligned text with right-aligned progress indicators
- **Responsive Design**: Scales appropriately across different screen sizes

### Future UI Improvements (Planned)
The UI system is designed for extensibility and will be enhanced with:
- Advanced progress visualization options
- Customizable themes and color schemes
- Enhanced interaction patterns
- Mobile-optimized touch interfaces
- Accessibility improvements

### Technical Implementation
- **SVG Progress Rings**: Custom circular progress using stroke-dasharray
- **CSS Animations**: Smooth transitions for all interactive elements
- **Event Handling**: Proper event propagation and click management
- **Real-time Updates**: Immediate visual feedback with backend persistence

## Working with This Codebase

### Adding New Features
- Frontend logic goes in `RoadmapManager` class methods
- Backend API endpoints follow RESTful patterns
- Data structure modifications require updating both initialization and processing logic

### Key Files to Understand
- `server.js:20-208` - Default data structure and initialization
- `roadmap.js:68-87` - View switching logic
- `roadmap.js:1-41` - Data loading and API communication
- `roadmap.js:479-509` - Progress editing system (`editProgress`, `updateProgress`)
- `roadmap.js:100-225` - Modern progress indicator rendering
- `styles.css:900-1049` - Progress visualization CSS (circular rings, bars, dots)

### Common Tasks
- **Add new view**: Create render method in `RoadmapManager`, update `renderContent()` switch
- **Modify data structure**: Update initialization in `server.js` and processing in `roadmap.js`
- **Add API endpoint**: Follow pattern in `server.js` with error handling