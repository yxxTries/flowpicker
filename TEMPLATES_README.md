# 🎯 Flowpicker Templates Feature

**A complete, database-backed templates system for sharing AI coding stacks.**

## Quick Start (3 Steps)

```bash
# 1️⃣ Install
npm install

# 2️⃣ Initialize Database
node scripts/seed-templates.js

# 3️⃣ Run
npm run dev
```

Then open: **http://localhost:8000/templates.html**

## What You Get

### 📋 12 Curated Templates
- Cursor Power User (most popular)
- Claude Code Terminal
- GitHub Copilot Classic
- Windsurf All-In
- Open-Source / Privacy-First
- Budget / Hobbyist
- JetBrains Enterprise
- Aider Pair-Programming
- Cline Autonomous
- Devin Delegation
- Long-Context Refactor
- Mobile / Apple Native

### 💾 Database-Backed
- SQLite with REST API
- Persistent votes across devices
- User-created templates
- Email-based tracking

### 🗳️ Voting System
```
Click 👍 upvote
Click 👎 downvote
Click again to remove
↓
Counts persist in database ✓
```

### ➕ Create Templates
1. Click "+ New Template"
2. Fill form (name, description, author)
3. Optionally capture current selections
4. Submit → appears in grid

### 🔄 Smart Sorting
- **Highest upvotes** (default)
- Lowest upvotes
- Newest first
- Oldest first

### 📱 Responsive & Themeable
- Mobile-optimized grid
- Dark mode support
- Keyboard accessible

## Files Overview

```
data/templates.js              ← 12 curated template data
data/templates.db              ← SQLite database (created by seed)

src/features/templates/
  ├── templates.js             ← Feature module (voting, API, sorting)
  └── templates.css            ← Styling

server.js                       ← REST API server (Node.js)
templates.html                 ← Page shell

TEMPLATES_FINAL_SUMMARY.md     ← Full feature guide
DATABASE_INTEGRATION.md        ← Schema & API reference
IMPLEMENTATION_GUIDE.md        ← Setup & testing
```

## API Endpoints

```
GET    /api/templates                  List all
POST   /api/templates                  Create new (auth: email)
GET    /api/templates/:id              Get one
DELETE /api/templates/:id              Delete (auth: email)
POST   /api/templates/:id/upvote       Vote up (auth: email)
POST   /api/templates/:id/downvote     Vote down (auth: email)
```

## Architecture

```
Browser                Backend             Database
templates.html   ──→  server.js  ──→  templates.db
     ↓                    ↓
 Render grid      Auto-detect backend
 Show votes       Fetch/vote/create
 Vote/create      Persist to SQLite
```

## Testing

### Browser Test
1. Open http://localhost:8000/templates.html
2. See 12 template cards
3. Click 👍 → count increments
4. Reload → count persists ✓
5. Create template → appears in grid ✓
6. Delete template → gone ✓

### API Test
```bash
# List templates
curl http://localhost:3000/api/templates | jq '.length'

# Upvote
curl -X POST http://localhost:3000/api/templates/cursor-power-user/upvote \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com"}'

# Create
curl -X POST http://localhost:3000/api/templates \
  -H 'Content-Type: application/json' \
  -d '{"email":"bob@example.com","name":"My Stack","description":"Test","author":"Bob","selections":{}}'
```

### Database Test
```bash
sqlite3 data/templates.db "SELECT id, name, upvotes FROM templates LIMIT 5;"
```

## Troubleshooting

### "Failed to fetch from database"
→ Start backend: `npm run server`

### "Cannot find module 'better-sqlite3'"
→ Install: `npm install`

### Port 3000 already in use
→ Kill process: `lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9`

## Features Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Browse templates | ✅ | 12 curated |
| Upvote/downvote | ✅ | Toggle-based, persistent |
| Create templates | ✅ | Modal form, optional auto-fill |
| Delete templates | ✅ | Only own templates |
| Sorting | ✅ | 4 modes, preference saved |
| Dark mode | ✅ | Full support |
| Mobile responsive | ✅ | Single-column <640px |
| Database persistence | ✅ | SQLite REST API |
| Auto-fallback | ✅ | localStorage if backend down |
| Email-based auth | ✅ | Lightweight, upgradeable |
| Comments | ❌ | Future |
| Moderation | ❌ | Future |
| Collections | ❌ | Future |

## Production Checklist

- [ ] `npm install` runs without errors
- [ ] `node scripts/seed-templates.js` succeeds
- [ ] `npm run server` starts on port 3000
- [ ] `npm run serve` starts on port 8000
- [ ] Fetch API works: `curl http://localhost:3000/api/templates`
- [ ] Templates grid renders with 12 items
- [ ] Upvote button works and persists
- [ ] Create template form works
- [ ] Delete button works on user templates
- [ ] Sorting dropdown works
- [ ] Dark mode toggle works
- [ ] Mobile layout responsive

## Next Steps

1. ✅ **Run:** `npm run dev`
2. ✅ **Test:** Check all boxes above
3. ✅ **Customize:** Edit template descriptions, add more
4. ✅ **Deploy:** Push to production server
5. ✅ **Monitor:** Track votes, new templates
6. ✅ **Iterate:** Collect feedback, add features

## Documentation

- **[TEMPLATES_FINAL_SUMMARY.md](TEMPLATES_FINAL_SUMMARY.md)** ← Start here for complete overview
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** ← Setup, architecture, testing
- **[DATABASE_INTEGRATION.md](DATABASE_INTEGRATION.md)** ← Schema, API reference, production
- **[TEMPLATES_FEATURE.md](TEMPLATES_FEATURE.md)** ← Feature details, future enhancements

## Stack

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js HTTP, REST API
- **Database:** SQLite3 with WAL mode
- **Deployment:** npm scripts, git, npm dependencies

## Scale

- ✅ MVP: Works great with 12-100 templates
- ✅ Growth: Scales to ~10K templates with SQLite
- ⚠️ Enterprise: Migrate to PostgreSQL + Redis for millions

## Success Metrics

- All 12 templates load ✅
- Votes persist ✅
- Can create templates ✅
- Mobile responsive ✅
- Dark mode works ✅
- API endpoints functional ✅
- Database persists data ✅

## License

Same as Flowpicker project.

---

**Ready to use!** Run `npm run dev` and start at http://localhost:8000/templates.html 🚀
