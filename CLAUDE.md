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
- **Auto-Deploy**: Configured from `master` branch on GitHub

## ⚠️ CRITICAL DEPLOYMENT WORKFLOW

**ALWAYS FOLLOW THIS SYSTEMATIC DEPLOYMENT PROCESS:**

### 1. Remember: This is NOT a Local App
- The app is **DEPLOYED on Railway**, not running locally
- Changes made locally are **NOT visible** until pushed to GitHub
- Railway auto-deploys from the `master` branch within 2-3 minutes

### 2. Development & Testing Workflow
```bash
# For local testing only (optional):
npm start  # Runs on http://localhost:3001

# DO NOT confuse local testing with production deployment!
```

### 3. Systematic Deployment Process
**MANDATORY STEPS after making any code changes:**

```bash
# Step 1: Check what changed
git status
git diff

# Step 2: Stage all changes
git add .

# Step 3: Verify staged changes
git status

# Step 4: Create descriptive commit
git commit -m "$(cat <<'EOF'
Brief description of changes made

- Specific improvement 1
- Specific improvement 2
- Specific improvement 3

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Step 5: Push to trigger Railway deployment
git push origin master

# Step 6: Wait 2-3 minutes, then verify at:
# https://customgpt-roadmap-production.up.railway.app
```

### 4. Deployment Verification Checklist
- [ ] Code changes committed and pushed to GitHub
- [ ] Railway deployment triggered (check GitHub commits)
- [ ] Wait 2-3 minutes for Railway build completion
- [ ] Test changes on production URL
- [ ] Verify mobile responsiveness if UI changes were made

### 5. Common Deployment Mistakes to Avoid
- ❌ **NEVER** assume local changes are live without deployment
- ❌ **NEVER** test only locally and assume production works
- ❌ **NEVER** forget to push after making changes
- ❌ **NEVER** skip the verification step on the live URL
- ✅ **ALWAYS** follow the systematic 6-step deployment process above

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

### Current Progress Indicators (v3.0 - Enhanced UX)
The application features a modern, fully accessible progress visualization system:

**Main Axes (Level 1)**:
- **Circular Progress Rings**: Beautiful SVG-based circular indicators showing completion percentage
- **Inline Editing**: Smooth inline editor replaces prompt dialogs for better UX
- **Touch Optimized**: 44px minimum touch targets for mobile accessibility
- **Keyboard Navigation**: Full keyboard support with Enter/Space activation

**Pipelines/Phases (Level 2-3)**:
- **Horizontal Progress Bars**: Clean, compact bars with gradient styling
- **Right-aligned Layout**: Progress indicators positioned on the right for clean text alignment
- **Inline Editing**: Click/keyboard activation opens positioned inline editor
- **Touch Targets**: Enhanced for mobile with proper hit areas

**Tasks (Level 4)**:
- **Smart Progress Dots**: Color-coded status indicators with pseudo-elements for touch
  - Gray: Not started (0% progress)
  - Blue with glow: In progress (1-99% progress)
  - Green with checkmark: Completed (100% progress)
- **Accessibility**: Full ARIA labels and keyboard navigation support

### Mobile & Accessibility (v3.0)
- **Mobile-Responsive Sidebar**: Slides in/out with overlay on mobile devices
- **Touch Optimization**: All interactive elements meet 44px minimum requirements
- **ARIA Compliance**: Comprehensive screen reader support with proper labels
- **Keyboard Navigation**: Complete keyboard accessibility with focus indicators
- **High Contrast**: Supports prefers-contrast and prefers-reduced-motion
- **Skeleton Loading**: Beautiful loading states for better perceived performance

### Layout & Responsive Design
- **Mobile-First**: Responsive design that works perfectly on all devices
- **Flexbox Structure**: Properly aligned with consistent 8px spacing grid
- **Visual Hierarchy**: Clear differentiation between hierarchy levels
- **Focus Management**: Visible focus indicators for keyboard users

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