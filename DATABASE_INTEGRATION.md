# Templates Database Integration

This document explains the database integration for the templates feature. All user votes and submissions are persisted to SQLite.

## Setup

### 1. Install Dependencies

```bash
npm install better-sqlite3
npm install --save-dev concurrently
```

### 2. Initialize Database

Run the seed script to create tables and populate curated templates:

```bash
node scripts/seed-templates.js
```

This creates `data/templates.db` with:
- `users` table — stores user emails
- `templates` table — stores all templates (curated + user-created)
- `template_votes` table — tracks individual user votes (no duplicate votes per user)

### 3. Start Backend Server

```bash
npm run server
# or with frontend dev server in parallel:
npm run dev
```

The server runs on `http://localhost:3000` by default.

## API Endpoints

All endpoints return JSON. Voting and template creation require the user's email in the request body.

### List All Templates
```
GET /api/templates

Response:
[
  {
    id: "cursor-power-user",
    name: "Cursor Power User",
    description: "...",
    author: "Dev",
    selections: { ide: [...], llm: [...], ... },
    upvotes: 5,
    downvotes: 1,
    is_user_template: false,
    created_at: 1715567890,
    created_by_email: null
  },
  ...
]
```

### Create User Template
```
POST /api/templates

Body:
{
  "email": "user@example.com",
  "name": "My Custom Stack",
  "description": "VS Code + Claude",
  "author": "Alice",
  "selections": {
    "ide": [{ "id": "vscode", "name": "VS Code" }],
    "llm": [{ "id": "claude-sonnet", "name": "Claude Sonnet 4.6" }],
    ...
  }
}

Response: { id, name, description, author, selections, ... }
```

### Get Single Template
```
GET /api/templates/:id

Response: { id, name, description, ... }
```

### Delete User Template
```
DELETE /api/templates/:id

Body:
{
  "email": "user@example.com"
}

Response: { ok: true }

Note: Only the template creator (matching email) can delete.
```

### Upvote Template
```
POST /api/templates/:id/upvote

Body:
{
  "email": "user@example.com"
}

Response: { upvotes: 5, downvotes: 1 }

Behavior:
- First upvote: increments upvotes, records vote
- Upvote again: removes vote, decrements upvotes
- Previously downvoted: changes to upvote, updates both counts
```

### Downvote Template
```
POST /api/templates/:id/downvote

Body:
{
  "email": "user@example.com"
}

Response: { upvotes: 5, downvotes: 1 }

Behavior: Same as upvote but for downvotes
```

## Database Schema

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### templates
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  selections TEXT NOT NULL,          -- JSON
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_user_template BOOLEAN DEFAULT 0,
  created_by_email TEXT,              -- FK to users(email)
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_templates_created_by ON templates(created_by_email);
CREATE INDEX idx_templates_created_at ON templates(created_at);
```

### template_votes
```sql
CREATE TABLE template_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,          -- FK to templates(id)
  user_email TEXT NOT NULL,            -- FK to users(email)
  vote_type TEXT NOT NULL,             -- 'upvote' or 'downvote'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(template_id, user_email)      -- One vote per user per template
);

CREATE INDEX idx_votes_template ON template_votes(template_id);
```

## Frontend Integration

The frontend (`src/features/templates/templates.js`) automatically detects the backend:

- If running on `localhost:3000` (backend available): uses API endpoints
- Otherwise: falls back to localStorage (browser-scoped)

### Getting User Email

Email is retrieved from `window.FlowpickerAuth.getUser().email` after login.

### Example Usage

```javascript
// Render templates with database
const allTemplates = await window.TemplatesFeature.fetchAllTemplates();
const userEmail = window.FlowpickerAuth.getUser().email;
await window.TemplatesFeature.renderTemplates(allTemplates, userEmail);

// Upvote
await window.TemplatesFeature.upvote(templateId, userEmail);

// Create template
const newTemplate = await window.TemplatesFeature.addUserTemplate(
  "My Stack",
  "Description",
  { ide: [...], ... },
  "Alice",
  userEmail
);
```

## Data Format Mapping

Templates can come from two sources with slightly different field names:

### Curated Templates (from data/templates.js)
```javascript
{
  id: 'cursor-power-user',
  name: 'Cursor Power User',
  description: '...',
  author: 'Dev',
  upvotes: 0,
  downvotes: 0,
  selections: { ide: [...], llm: [...], ... },
  createdAt: 0,
  isUserTemplate: false
}
```

### Database Templates
```javascript
{
  id: 'user-1715567890123-abc12',
  name: 'My Stack',
  description: '...',
  author: 'Alice',
  upvotes: 5,
  downvotes: 1,
  selections: { ide: [...], llm: [...], ... },  // JSON string in DB, parsed on fetch
  created_at: 1715567890,
  is_user_template: true,
  created_by_email: 'user@example.com'
}
```

The frontend normalizes these so `createdAt` and `created_at` both work, same for `isUserTemplate` and `is_user_template`.

## Vote Logic

Each user can vote exactly once per template. Voting is a toggle:

1. **First upvote:**
   - Increment `upvotes`
   - Create row in `template_votes` with vote_type='upvote'

2. **Upvote again (toggle off):**
   - Decrement `upvotes`
   - Delete row from `template_votes`

3. **Change vote (was downvote, now upvote):**
   - Update `template_votes.vote_type` to 'upvote'
   - Increment `upvotes`, decrement `downvotes`

Same logic applies for downvotes.

## Error Handling

### No backend available
If the server is not running, the frontend falls back to localStorage:
- Votes are per-browser, not synced
- User templates are stored locally
- No multi-device sync

### Authentication
Templates require email to create/vote. If user is not logged in:
- Frontend shows "+ New Template" button but alerts on click
- Voting without auth returns a warning (still works if email is provided)

### Authorization
- Only the user who created a template can delete it (checked via email)
- Upvotes/downvotes are per-user (UNIQUE constraint on template_id + user_email)

## Running in Production

1. **Use a proper database host** (e.g., Supabase, Railway, fly.io)
   - Modify `server.js` to use a connection string instead of local file

2. **Require authentication**
   - Add JWT token validation to all endpoints
   - Verify token contains the user's email

3. **Add rate limiting**
   - Limit votes per IP/user per time period
   - Limit template creation per user per day

4. **Add moderation**
   - Review user templates before publishing
   - Delete spam/inappropriate content
   - Ban users who violate policies

Example production database URL:
```javascript
const db = new Database(process.env.DATABASE_URL);
```

## Testing

### Seed test data
```bash
node scripts/seed-templates.js
```

### List templates via API
```bash
curl http://localhost:3000/api/templates | jq '.'
```

### Create a template
```bash
curl -X POST http://localhost:3000/api/templates \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "name": "Test Stack",
    "description": "Test",
    "author": "Test User",
    "selections": {"ide": [], "llm": [], "integration": [], "context": [], "agent": []}
  }'
```

### Vote on a template
```bash
curl -X POST http://localhost:3000/api/templates/cursor-power-user/upvote \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com"}'
```

## Troubleshooting

### "Failed to fetch from database, using local templates"
- The backend server is not running
- Start with `npm run server` on port 3000
- Check that `data/templates.db` exists and is readable

### Votes not persisting across page reloads
- Check that backend is running (`npm run server`)
- Verify email is being sent in requests
- Check browser console for fetch errors

### Database locked errors
- SQLite with WAL mode allows multiple readers
- If "database is locked": another process has exclusive lock
- Check for orphaned Node processes: `lsof +D data/`

### Templates not showing after creation
- Verify POST response includes the new template
- Check that email matches when trying to delete/vote
- Seeds only create 12 curated templates; user templates are created via API

## Limitations

- Email-based auth (no unique user IDs per account system)
- Single-node server (no clustering or replication)
- File-based SQLite (scales to ~10K templates, then consider Postgres)

## Future Enhancements

1. **Migrate to Postgres** for production scale
2. **Add user authentication** (OAuth/JWT) to prevent spoofing
3. **Template versioning** (allow editing with history)
4. **Comments on templates** (discussion/feedback)
5. **Template collections** (curated groups)
6. **Trending templates** (time-weighted popularity)
7. **Template categories** (budget, agentic, private, etc.)
