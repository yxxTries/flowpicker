# Flowpicker Templates - Complete Implementation Guide

This guide covers the full database-backed templates implementation with user voting, template creation, and sorting.

## What Was Built

### ✅ Client-Side Features (Browser)
- **Templates Grid:** 12 curated starter stacks + user-created templates
- **Minimalist Voting:** 👍 upvote / 👎 downvote buttons (toggle-based)
- **Smart Sorting:** Default highest upvotes, with options for lowest/newest/oldest
- **Template Creation:** Modal form to create new templates from current stack or blank
- **Template Management:** Delete own templates with confirmation
- **Dark Mode Support:** Full theming integration
- **Responsive Design:** Mobile-optimized grid layout

### ✅ Server-Side Features (Backend API)
- **REST API:** 6 endpoints for templates CRUD and voting
- **SQLite Database:** Persistent storage with WAL mode for concurrency
- **Vote Tracking:** Per-user voting with toggle support (vote again to remove)
- **User Management:** Email-based user tracking (no separate auth needed)
- **Data Validation:** Required fields, authorization checks

### ✅ Auto-Detection
- Frontend automatically detects backend availability
- Falls back to localStorage if backend unavailable
- Transparent to the user

## Installation & Setup

### 1. Install Node Dependencies

```bash
npm install
```

This installs:
- `better-sqlite3` — SQLite driver
- `concurrently` — run multiple npm scripts in parallel
- Plus existing dev dependencies (Vitest, Playwright, http-server)

### 2. Initialize Database

Seed the database with curated templates:

```bash
node scripts/seed-templates.js
```

Output:
```
✓ Seeded 12 curated templates
```

This creates:
- `data/templates.db` (SQLite database)
- `users` table
- `templates` table (12 curated + any user-created)
- `template_votes` table

### 3. Run Backend & Frontend

**Option A: Start both in parallel**
```bash
npm run dev
```

**Option B: Start separately**
```bash
# Terminal 1 - Backend API (port 3000)
npm run server

# Terminal 2 - Frontend dev server (port 8000)
npm run serve
```

### 4. Test in Browser

Navigate to: `http://localhost:8000/templates.html`

You should see:
- 12 curated template cards in a grid
- "+ New Template" button and sort dropdown
- Upvote/downvote buttons on each template
- All working with database persistence (not just localStorage)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│               Browser (Frontend)                │
│                                                  │
│  templates.html                                 │
│      ↓                                           │
│  src/features/templates/templates.js            │
│      ↓                                           │
│  (Check for backend @ localhost:3000)           │
│      ├─ Backend available → Fetch API           │
│      └─ Not available     → Use localStorage    │
└─────────────────────────────────────────────────┘
              ↓ (HTTP REST)
┌─────────────────────────────────────────────────┐
│           Backend Server (server.js)            │
│                                                  │
│  http.createServer()  (port 3000)              │
│      ↓                                           │
│  Router (6 endpoints)                           │
│      ↓                                           │
│  GET  /api/templates          ─┐               │
│  POST /api/templates          ─┤               │
│  GET  /api/templates/:id      ─┼→ SQLite DB    │
│  DELETE /api/templates/:id    ─┤               │
│  POST /api/templates/:id/upvote ─┤               │
│  POST /api/templates/:id/downvote─┘               │
└─────────────────────────────────────────────────┘
              ↓ (better-sqlite3)
┌─────────────────────────────────────────────────┐
│        SQLite Database (data/templates.db)      │
│                                                  │
│  users (id, email, created_at)                 │
│  templates (id, name, selections, votes, ...) │
│  template_votes (user, template, type)        │
└─────────────────────────────────────────────────┘
```

## Key Implementation Details

### Frontend Flow: Upvoting

```
User clicks 👍 button
    ↓
templates.js: upvote(templateId, userEmail)
    ↓
(If backend available)
  POST /api/templates/:id/upvote { email }
    ↓
  Server increments upvotes, records vote in DB
    ↓
  Return { upvotes: 5, downvotes: 1 }
    ↓
Re-render grid with new vote count
    ↓
Result persists across page reloads ✓
```

### Server Vote Logic

```
First upvote:
  INSERT into template_votes (id, email, 'upvote')
  UPDATE templates SET upvotes = upvotes + 1

Click upvote again (toggle off):
  DELETE from template_votes
  UPDATE templates SET upvotes = upvotes - 1

Change vote (was downvote, now upvote):
  UPDATE template_votes SET vote_type = 'upvote'
  UPDATE templates SET upvotes = upvotes + 1, downvotes = downvotes - 1
```

### Creating User Templates

```
User clicks "+ New Template"
    ↓
Modal form opens
    ↓
User fills: name, description, author, (optional) use current stack
    ↓
Submit
    ↓
POST /api/templates {
  email: "user@example.com",
  name: "My Stack",
  author: "Alice",
  selections: { ide: [...], llm: [...], ... }
}
    ↓
Server:
  1. Create user entry if doesn't exist
  2. Insert new template with is_user_template=1
  3. Return { id, name, ... }
    ↓
Frontend re-fetches templates
    ↓
New template appears at top (newest first by default)
```

## File Structure

```
flowpicker/
├── data/
│   ├── templates.js              # 12 curated templates (data only)
│   └── templates.db              # SQLite DB (created after npm run seed-templates)
│
├── scripts/
│   └── seed-templates.js         # Populate DB with curated templates
│
├── src/features/templates/
│   ├── templates.js              # Feature module (voting, CRUD, sorting)
│   └── templates.css             # Grid, cards, form, modal styling
│
├── server.js                     # REST API server (port 3000)
├── templates.html                # Templates page shell
├── package.json                  # Dependencies + npm scripts
├── DATABASE_INTEGRATION.md       # Database schema & API docs
└── IMPLEMENTATION_GUIDE.md       # This file
```

## Testing Checklist

### Setup
- [ ] `npm install` completes without errors
- [ ] `node scripts/seed-templates.js` outputs "✓ Seeded 12 curated templates"
- [ ] `data/templates.db` file exists

### Backend
- [ ] `npm run server` starts without errors on port 3000
- [ ] `curl http://localhost:3000/api/templates | jq '.length'` returns `12`
- [ ] Can POST new template, GET it back
- [ ] Can upvote, vote count increments
- [ ] Upvoting again (toggle) decrements count

### Frontend
- [ ] `npm run serve` starts on port 8000
- [ ] Navigate to `http://localhost:8000/templates.html`
- [ ] All 12 templates render in grid
- [ ] "+ New Template" button is visible
- [ ] Sort dropdown works (switch between sort modes)
- [ ] Upvote button: click → count increments
- [ ] Reload page → vote persists (✓ using DB, ✗ if using localStorage)
- [ ] Create new template → appears in grid
- [ ] Delete user template → gone from grid
- [ ] Dark mode toggle works
- [ ] Mobile view (< 640px) shows single column

### Auth Integration
- [ ] Log in on site (auth modal)
- [ ] Email appears in "by Dev" author lines
- [ ] Create template while logged in → your email is used
- [ ] Logout, then try to create → alerts "must be logged in"
- [ ] Vote without logging in → works (email optional for now)

## Common Issues & Fixes

### "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3
# On Windows, may need Visual Studio Build Tools
# Or use: npm install --save-dev windows-build-tools
```

### "EADDRINUSE: address already in use :::3000"
Another process is using port 3000. Either:
- Kill the process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`
- Change port in `server.js` and frontend endpoint
- Wait and try again

### "Failed to fetch from database, using local templates"
Backend not running on port 3000. Start it:
```bash
npm run server
```

### Votes not persisting across reloads
- Check backend is running (`npm run server`)
- Check browser console for fetch errors
- Verify email is being sent in requests
- Check `data/templates.db` permissions

### "database is locked"
SQLite file is write-locked by another process:
```bash
# Find process
lsof data/templates.db
# Kill it
kill -9 <PID>
```

### Template creation fails silently
- Check user is logged in (email required)
- Check browser console for error messages
- Verify `selections` object has correct shape
- Check server logs

## Environment Variables (Optional)

Edit `server.js` to support environment config:

```javascript
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'templates.db');
```

Then:
```bash
PORT=3001 npm run server
DB_PATH=/var/lib/flowpicker.db npm run server
```

## Performance Notes

- SQLite with WAL mode: supports ~20 concurrent readers
- Suitable for ~10K templates before performance degrades
- For >10K templates or >100 req/sec: migrate to PostgreSQL
- Voting is O(1) per-template (indexed on template_id, user_email)

## Security Considerations

### Current (Development)
- Email-based auth (self-reported, no verification)
- No rate limiting
- No input sanitization beyond JSON parse

### Production Requirements
1. **Authentication:** Integrate with proper auth (OAuth, JWT)
2. **Rate Limiting:** Limit votes/template creation per user per time
3. **Input Validation:** Sanitize template names/descriptions
4. **CORS:** Restrict to specific domains
5. **Moderation:** Review/delete user templates
6. **HTTPS:** Encrypt in transit

Example production starter:
```javascript
// server.js additions
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## Next Steps

1. **Test in browser** — follow the checklist above
2. **Try creating a template** — make sure form works
3. **Vote and reload** — verify persistence
4. **Check database** — inspect with DB Browser for SQLite:
   ```bash
   # Open GUI
   dbrowser data/templates.db
   # Or query via sqlite3 CLI
   sqlite3 data/templates.db "SELECT * FROM templates LIMIT 5;"
   ```
5. **Deploy** — see DATABASE_INTEGRATION.md "Running in Production"

## Rollback to localStorage-Only

If you want to revert to browser-only (no backend):

1. Stop the server
2. Edit `src/features/templates/templates.js`:
   ```javascript
   const USE_DB = false; // Force localStorage mode
   ```
3. Reload page — votes/templates use localStorage

## Additional Resources

- [DATABASE_INTEGRATION.md](DATABASE_INTEGRATION.md) — Schema, API, troubleshooting
- [TEMPLATES_FEATURE.md](TEMPLATES_FEATURE.md) — Feature overview
- [TEMPLATES_IMPLEMENTATION_SUMMARY.md](TEMPLATES_IMPLEMENTATION_SUMMARY.md) — Visual walkthrough

## Getting Help

If something isn't working:

1. Check browser console (F12 → Console tab)
2. Check server terminal for errors
3. Verify database file exists: `ls data/templates.db`
4. Test API directly:
   ```bash
   curl http://localhost:3000/api/templates
   curl -X POST http://localhost:3000/api/templates \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","name":"Test","description":"Test","author":"Test","selections":{}}'
   ```
5. Check git log for recent changes: `git log --oneline -10`
