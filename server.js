const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static files with enhanced cache-busting headers
app.use(express.static('public', {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Never cache HTML files
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      // Force reload of CSS/JS files with version parameters
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Last-Modified', new Date().toUTCString());
    } else {
      // Other assets (images, fonts) can be cached briefly
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  }
}));

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'roadmap.json');

// Helper function to add status to items based on progress
const addStatusToItem = (item) => {
  if (!item.status) {
    // Set initial status based on current progress
    if (item.progress === 0) item.status = 'not_started';
    else if (item.progress < 50) item.status = 'in_progress';
    else if (item.progress < 100) item.status = 'review';
    else item.status = 'completed';
  }

  // Add default fields if missing
  if (item.progressWeight === undefined) item.progressWeight = 1;

  return item;
};

// Recursively migrate data structure
const migrateDataStructure = (item) => {
  addStatusToItem(item);

  // Process children
  if (item.axes) item.axes.forEach(migrateDataStructure);
  if (item.pipelines) item.pipelines.forEach(migrateDataStructure);
  if (item.components) item.components.forEach(migrateDataStructure);
  if (item.phases) item.phases.forEach(migrateDataStructure);
  if (item.tasks) item.tasks.forEach(migrateDataStructure);

  return item;
};

// Initialize data file if it doesn't exist
const initializeData = async () => {
  await fs.ensureDir(path.join(__dirname, 'data'));

  // Check if data file exists and migrate if needed
  if (await fs.pathExists(DATA_FILE)) {
    const existingData = await fs.readJson(DATA_FILE);
    if (!existingData.roadmap.status) {
      console.log('Migrating data structure to include status fields...');
      migrateDataStructure(existingData.roadmap);
      existingData.lastModified = new Date().toISOString();
      await fs.writeJson(DATA_FILE, existingData, { spaces: 2 });
      console.log('Data migration completed successfully');
    }
    return;
  }

  if (!await fs.pathExists(DATA_FILE)) {
    const initialData = {
      roadmap: {
        id: 'root',
        title: 'CustomGPT Expansion & Enhancement',
        type: 'root',
        progress: 0,
        status: 'not_started',
        progressWeight: 1,
        validated: false,
        axes: [
          {
            id: uuidv4(),
            title: 'Knowledge Retrieval Enhancement',
            type: 'axis',
            progress: 0,
            status: 'not_started',
            progressWeight: 1,
            validated: false,
            pipelines: [
              {
                id: uuidv4(),
                title: 'RAG Pipeline',
                type: 'pipeline',
                progress: 0,
                validated: false,
                phases: [
                  {
                    id: uuidv4(),
                    title: 'Knowledge Preparation Phase',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'Document preprocessing and cleaning', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Chunking strategies optimization', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Metadata extraction and enrichment', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Format standardization', validated: false, progress: 0 }
                    ]
                  },
                  {
                    id: uuidv4(),
                    title: 'Knowledge Ingestion Phase',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'Vector database setup and configuration', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Embedding model selection and implementation', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Indexing strategies', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Version control for knowledge updates', validated: false, progress: 0 }
                    ]
                  },
                  {
                    id: uuidv4(),
                    title: 'Pipeline-AI Connection',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'Query interface development', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Context window management', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Retrieval mechanism configuration', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Response synthesis setup', validated: false, progress: 0 }
                    ]
                  },
                  {
                    id: uuidv4(),
                    title: 'AI Assistant Optimization',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'Prompt engineering for RAG queries', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Retrieval threshold tuning', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Re-ranking mechanisms', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Fallback strategies', validated: false, progress: 0 }
                    ]
                  }
                ]
              },
              {
                id: uuidv4(),
                title: 'Knowledge Graph RAG',
                type: 'pipeline',
                progress: 0,
                validated: false,
                phases: [
                  {
                    id: uuidv4(),
                    title: 'Knowledge Preparation Phase',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'Entity extraction and recognition', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Relationship mapping', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Ontology design', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Graph schema definition', validated: false, progress: 0 }
                    ]
                  }
                ]
              },
              {
                id: uuidv4(),
                title: 'Claude Code Knowledge Base',
                type: 'pipeline',
                progress: 0,
                validated: false,
                phases: [
                  {
                    id: uuidv4(),
                    title: 'Knowledge Preparation Phase',
                    type: 'phase',
                    progress: 0,
                    validated: false,
                    tasks: [
                      { id: uuidv4(), title: 'File structure organization', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Documentation format standardization', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Code snippet cataloging', validated: false, progress: 0 },
                      { id: uuidv4(), title: 'Sub-agent knowledge segmentation', validated: false, progress: 0 }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'Tool Integration via MCP',
            type: 'axis',
            progress: 0,
            validated: false,
            components: [
              {
                id: uuidv4(),
                title: 'MCP Server Discovery & Selection',
                type: 'component',
                progress: 0,
                validated: false,
                tasks: [
                  { id: uuidv4(), title: 'Available MCP servers catalog', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Capability matrix creation', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Performance benchmarking', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Compatibility verification', validated: false, progress: 0 }
                ]
              },
              {
                id: uuidv4(),
                title: 'MCP Client Configuration',
                type: 'component',
                progress: 0,
                validated: false,
                tasks: [
                  { id: uuidv4(), title: 'Request/response patterns', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Error handling protocols', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Retry mechanisms', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Timeout configurations', validated: false, progress: 0 }
                ]
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'Custom MCP Server Development',
            type: 'axis',
            progress: 0,
            validated: false,
            phases: [
              {
                id: uuidv4(),
                title: 'API-to-MCP Bridge Creation',
                type: 'phase',
                progress: 0,
                validated: false,
                tasks: [
                  { id: uuidv4(), title: 'API specification analysis', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Endpoint mapping design', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Authentication wrapper development', validated: false, progress: 0 },
                  { id: uuidv4(), title: 'Rate limiting implementation', validated: false, progress: 0 }
                ]
              }
            ]
          }
        ]
      },
      lastModified: new Date().toISOString()
    };

    // Apply migration to ensure all items have status fields
    migrateDataStructure(initialData.roadmap);
    await fs.writeJson(DATA_FILE, initialData, { spaces: 2 });
  }
};

// Routes
app.get('/api/roadmap', async (req, res) => {
  try {
    const data = await fs.readJson(DATA_FILE);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load roadmap data' });
  }
});

app.post('/api/roadmap', async (req, res) => {
  try {
    const newData = {
      ...req.body,
      lastModified: new Date().toISOString()
    };
    await fs.writeJson(DATA_FILE, newData, { spaces: 2 });
    res.json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save roadmap data' });
  }
});

app.put('/api/roadmap/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const data = await fs.readJson(DATA_FILE);
    
    // Update logic would go here - simplified for brevity
    data.lastModified = new Date().toISOString();
    
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Start server
app.listen(PORT, async () => {
  await initializeData();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('UI improvements deployed - v3.0');
});
