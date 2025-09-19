# CustomGPT Expansion Roadmap - Interactive UI

## Overview
This is a comprehensive, interactive roadmap application for managing your CustomGPT expansion project. It features multiple views (Tree, Kanban, Timeline, Grid), progress tracking, and full CRUD capabilities.

## Features
- **Multiple Views**: 
  - Tree View: Hierarchical structure with collapsible sections
  - Kanban View: Organize items by status (Not Started, In Progress, Review, Completed)
  - Timeline View: Visual timeline of project phases
  - Grid View: Card-based overview with statistics

- **Progress Tracking**:
  - Overall project progress
  - Individual item progress with visual indicators
  - Validation checkboxes for completed items
  - Real-time progress calculation

- **Interactive Editing**:
  - Add/Edit/Delete axes, pipelines, phases, and tasks
  - Drag-and-drop support (in Kanban view)
  - Inline validation toggles
  - Progress sliders for precise tracking

- **Data Management**:
  - Automatic saving to backend
  - Export/Import functionality
  - Persistent storage using JSON file

## Installation & Deployment

### 🌐 Live Application
**Production URL**: https://customgpt-roadmap-production.up.railway.app

### Local Development

1. **Prerequisites**:
   - Node.js (v14 or higher)
   - npm or yarn

2. **Installation**:
   ```bash
   # Clone the repository
   git clone https://github.com/DaronVee/customgpt-roadmap.git
   cd customgpt-roadmap

   # Install dependencies
   npm install
   ```

3. **Running the Application**:
   ```bash
   # Start the development server
   npm run dev
   # OR start production server
   npm start

   # The application will be available at http://localhost:3001
   ```

### 🚀 Auto-Deployment (Railway)

This application is configured for automatic deployment on Railway:

- **Repository**: https://github.com/DaronVee/customgpt-roadmap
- **Live URL**: https://customgpt-roadmap-production.up.railway.app
- **Auto-Deploy**: Enabled from `main` branch

#### How Auto-Deployment Works:
1. Push changes to the `main` branch on GitHub
2. Railway automatically detects the changes
3. Builds and deploys the new version using Nixpacks
4. Application updates within minutes

#### Railway Configuration (`railway.json`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Alternative Deployment Options

#### Deploy to Heroku

1. Create a `Procfile`:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   heroku create your-roadmap-app
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

#### Docker Deployment

1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. Build and run:
   ```bash
   docker build -t roadmap-app .
   docker run -p 3001:3001 roadmap-app
   ```

## Usage

### Adding Items
1. Click "Add Axis" to create a new top-level axis
2. Use the "+" button next to any item to add sub-items
3. Click on any item to edit its details

### Tracking Progress
1. Click on tasks/items to open the edit modal
2. Use the progress slider to set completion percentage
3. Check the validation box to mark items as complete

### Switching Views
- Use the tabs at the top of the roadmap area to switch between views
- Each view offers a different perspective on your project

### Navigation
- Use the sidebar for quick navigation to different axes
- Expand/Collapse all items using the toolbar buttons
- Search functionality (coming in next version)

## Data Structure

The application uses a hierarchical data structure:

```javascript
{
  roadmap: {
    id: "root",
    title: "CustomGPT Expansion & Enhancement",
    axes: [
      {
        id: "unique-id",
        title: "Knowledge Retrieval Enhancement",
        progress: 0-100,
        validated: true/false,
        pipelines: [
          {
            id: "unique-id",
            title: "RAG Pipeline",
            phases: [
              {
                id: "unique-id",
                title: "Knowledge Preparation",
                tasks: [
                  {
                    id: "unique-id",
                    title: "Task name",
                    progress: 0-100,
                    validated: true/false
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## API Endpoints

- `GET /api/roadmap` - Retrieve the current roadmap
- `POST /api/roadmap` - Save the entire roadmap
- `PUT /api/roadmap/item/:id` - Update a specific item

## Customization

### Styling
Modify `public/styles.css` to customize the appearance. The app uses CSS variables for easy theming:

```css
:root {
  --primary-color: #6366f1;
  --success-color: #10b981;
  /* etc... */
}
```

### Adding New Views
To add a new view, update `roadmap.js`:

1. Add a new render method (e.g., `renderCustomView()`)
2. Update the `renderContent()` switch statement
3. Add a new tab button in the HTML

## Troubleshooting

### Server won't start
- Ensure port 3001 is not in use
- Check Node.js version compatibility

### Data not persisting
- Verify write permissions for the `data` directory
- Check server logs for errors

### UI not updating
- Clear browser cache
- Check browser console for JavaScript errors

## Future Enhancements
- Real-time collaboration
- User authentication
- Advanced filtering and search
- Gantt chart view
- Integration with project management tools
- Notifications and reminders
- Comments and attachments

## License
MIT

## Support
For issues or questions, please create an issue in the repository.
