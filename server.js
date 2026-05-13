// Simple backend server for Flowpicker templates API
// Provides REST endpoints for template CRUD, voting, and auth

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'templates.db');

// Initialize database
let db;
function initDb() {
  db = new Database(DB_PATH, { verbose: console.log });
  db.pragma('journal_mode = WAL');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      author TEXT,
      selections TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      is_user_template BOOLEAN DEFAULT 0,
      created_by_email TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY(created_by_email) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS template_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      vote_type TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(template_id, user_email),
      FOREIGN KEY(template_id) REFERENCES templates(id),
      FOREIGN KEY(user_email) REFERENCES users(email)
    );

    CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by_email);
    CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
    CREATE INDEX IF NOT EXISTS idx_votes_template ON template_votes(template_id);
  `);
}

// Helper: parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Helper: respond
function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// Helper: get or create user
function getOrCreateUser(email) {
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  let user = stmt.get(email);
  if (!user) {
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(id, email);
    user = { id };
  }
  return user;
}

// API Routes
const routes = {
  'GET /api/templates': (req, res) => {
    const stmt = db.prepare(`
      SELECT * FROM templates ORDER BY created_at DESC
    `);
    const templates = stmt.all();
    respond(res, 200, templates.map(t => ({
      ...t,
      selections: JSON.parse(t.selections)
    })));
  },

  'POST /api/templates': async (req, res) => {
    try {
      const { name, description, author, selections, email } = await parseBody(req);

      if (!name || !description || !selections || !email) {
        return respond(res, 400, { error: 'Missing required fields' });
      }

      getOrCreateUser(email);

      const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const stmt = db.prepare(`
        INSERT INTO templates (id, name, description, author, selections, is_user_template, created_by_email)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `);
      stmt.run(id, name, description, author || 'Anonymous', JSON.stringify(selections), email);

      respond(res, 201, { id, name, description, author, selections });
    } catch (e) {
      console.error(e);
      respond(res, 500, { error: 'Failed to create template' });
    }
  },

  'GET /api/templates/:id': (req, res, match) => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    const template = stmt.get(match[1]);
    if (!template) return respond(res, 404, { error: 'Template not found' });
    respond(res, 200, {
      ...template,
      selections: JSON.parse(template.selections)
    });
  },

  'DELETE /api/templates/:id': async (req, res, match) => {
    try {
      const { email } = await parseBody(req);
      if (!email) return respond(res, 400, { error: 'Email required' });

      const stmt = db.prepare('SELECT * FROM templates WHERE id = ? AND created_by_email = ?');
      const template = stmt.get(match[1], email);
      if (!template) return respond(res, 403, { error: 'Unauthorized or template not found' });

      db.prepare('DELETE FROM template_votes WHERE template_id = ?').run(match[1]);
      db.prepare('DELETE FROM templates WHERE id = ?').run(match[1]);

      respond(res, 200, { ok: true });
    } catch (e) {
      console.error(e);
      respond(res, 500, { error: 'Failed to delete template' });
    }
  },

  'POST /api/templates/:id/upvote': async (req, res, match) => {
    try {
      const { email } = await parseBody(req);
      if (!email) return respond(res, 400, { error: 'Email required' });

      const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(match[1]);
      if (!template) return respond(res, 404, { error: 'Template not found' });

      getOrCreateUser(email);

      // Check for existing vote
      const existing = db.prepare(
        'SELECT vote_type FROM template_votes WHERE template_id = ? AND user_email = ?'
      ).get(match[1], email);

      if (existing) {
        if (existing.vote_type === 'upvote') {
          // Remove upvote
          db.prepare('DELETE FROM template_votes WHERE template_id = ? AND user_email = ?')
            .run(match[1], email);
          db.prepare('UPDATE templates SET upvotes = upvotes - 1 WHERE id = ?').run(match[1]);
        } else {
          // Change downvote to upvote
          db.prepare('UPDATE template_votes SET vote_type = ? WHERE template_id = ? AND user_email = ?')
            .run('upvote', match[1], email);
          db.prepare('UPDATE templates SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?')
            .run(match[1]);
        }
      } else {
        // Add new upvote
        db.prepare('INSERT INTO template_votes (template_id, user_email, vote_type) VALUES (?, ?, ?)')
          .run(match[1], email, 'upvote');
        db.prepare('UPDATE templates SET upvotes = upvotes + 1 WHERE id = ?').run(match[1]);
      }

      const updated = db.prepare('SELECT upvotes, downvotes FROM templates WHERE id = ?').get(match[1]);
      respond(res, 200, updated);
    } catch (e) {
      console.error(e);
      respond(res, 500, { error: 'Failed to upvote' });
    }
  },

  'POST /api/templates/:id/downvote': async (req, res, match) => {
    try {
      const { email } = await parseBody(req);
      if (!email) return respond(res, 400, { error: 'Email required' });

      const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(match[1]);
      if (!template) return respond(res, 404, { error: 'Template not found' });

      getOrCreateUser(email);

      // Check for existing vote
      const existing = db.prepare(
        'SELECT vote_type FROM template_votes WHERE template_id = ? AND user_email = ?'
      ).get(match[1], email);

      if (existing) {
        if (existing.vote_type === 'downvote') {
          // Remove downvote
          db.prepare('DELETE FROM template_votes WHERE template_id = ? AND user_email = ?')
            .run(match[1], email);
          db.prepare('UPDATE templates SET downvotes = downvotes - 1 WHERE id = ?').run(match[1]);
        } else {
          // Change upvote to downvote
          db.prepare('UPDATE template_votes SET vote_type = ? WHERE template_id = ? AND user_email = ?')
            .run('downvote', match[1], email);
          db.prepare('UPDATE templates SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?')
            .run(match[1]);
        }
      } else {
        // Add new downvote
        db.prepare('INSERT INTO template_votes (template_id, user_email, vote_type) VALUES (?, ?, ?)')
          .run(match[1], email, 'downvote');
        db.prepare('UPDATE templates SET downvotes = downvotes + 1 WHERE id = ?').run(match[1]);
      }

      const updated = db.prepare('SELECT upvotes, downvotes FROM templates WHERE id = ?').get(match[1]);
      respond(res, 200, updated);
    } catch (e) {
      console.error(e);
      respond(res, 500, { error: 'Failed to downvote' });
    }
  },
};

// Request handler
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.writeHead(204).end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const key = `${method} ${pathname}`;

  // Try exact match
  if (routes[key]) {
    return routes[key](req, res);
  }

  // Try parameterized routes
  for (const routeKey in routes) {
    const [routeMethod, routePath] = routeKey.split(' ');
    if (routeMethod !== method) continue;

    const routeParts = routePath.split('/');
    const pathParts = pathname.split('/');
    if (routeParts.length !== pathParts.length) continue;

    const match = [];
    let isMatch = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        match.push(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      return routes[routeKey](req, res, match);
    }
  }

  // Static file serving (for development)
  if (pathname === '/' || pathname.match(/\.html$/)) {
    const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        const contentType = filePath.endsWith('.html') ? 'text/html' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start server
try {
  initDb();
  server.listen(PORT, () => {
    console.log(`Flowpicker API server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  GET  /api/templates              - List all templates');
    console.log('  POST /api/templates              - Create new template (auth required)');
    console.log('  GET  /api/templates/:id          - Get template by ID');
    console.log('  DELETE /api/templates/:id        - Delete user template (auth required)');
    console.log('  POST /api/templates/:id/upvote   - Upvote template (auth required)');
    console.log('  POST /api/templates/:id/downvote - Downvote template (auth required)');
  });
} catch (e) {
  console.error('Failed to start server:', e);
  process.exit(1);
}
