# Templates Feature Documentation

## Overview

The Templates page (`/templates.html`) provides curated and user-created AI coding stack templates. Users can browse popular stacks, upvote/downvote templates, and create their own.

## Files

### Core Data & Logic
- **[data/templates.js](data/templates.js)** — 12 curated starter templates (author: Dev)
  - Cursor Power User
  - Claude Code Terminal Workflow
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

- **[src/features/templates/templates.js](src/features/templates/templates.js)** — Feature module
  - Vote management (upvote/downvote with localStorage persistence)
  - Template creation and deletion
  - Sorting (highest upvotes, lowest upvotes, newest, oldest)
  - Modal form for user-submitted templates
  - Template loading (saves to SelectionsStore and navigates to Plan)

- **[src/features/templates/templates.css](src/features/templates/templates.css)** — Styling
  - Grid layout with responsive design
  - Dark mode support
  - Modal form styles
  - Minimalist voting buttons (👍👎)

- **[templates.html](templates.html)** — Page shell
  - Renders all templates in a grid
  - Controls for sorting and creating new templates
  - Integrates with dark mode and auth systems

## Features

### 1. Browse Templates
- View 12 curated starter stacks by default
- See full layer selections (IDE, LLM, Integration, Context, Agent)
- Quick "Use Template" button loads stack into Plan page

### 2. Voting System
- **Upvote** (👍) and **Downvote** (👎) buttons
- Votes persist in browser localStorage under `flowpicker-template-votes`
- Each vote increments the counter (no undo, encouraging honest feedback)
- Vote counts displayed per template

### 3. Sorting
- **Default:** Highest upvotes (sorted by total upvotes + user votes combined)
- **Options:**
  - Lowest upvotes
  - Newest first (user templates with recent `createdAt` first)
  - Oldest first
- Sort preference persists in localStorage (`flowpicker-template-sort`)

### 4. User-Created Templates
- **Create:** Click "New Template" to open modal form
- **Form fields:**
  - Template Name (required)
  - Description (required)
  - Your Name (defaults to "Anonymous")
  - "Use my current selections" checkbox (auto-fill from current Plan page stack)
- **Storage:** Saved to localStorage (`flowpicker-user-templates`)
  - Each user template gets a unique ID: `user-{timestamp}-{random}`
  - Stored alongside curated templates in grid
  - Marked with `isUserTemplate: true` flag

- **Delete:** User templates show a trash button (🗑️) for removal

### 5. Author Attribution
- All templates include an `author` field
- Curated templates authored by "Dev"
- User templates show entered author name (or "Anonymous")

## Storage Architecture

### localStorage Keys
- `flowpicker-template-votes` — JSON object of vote counts per template ID
  ```javascript
  {
    "cursor-power-user": { upvotes: 5, downvotes: 1 },
    "budget-hobbyist": { upvotes: 12, downvotes: 0 }
  }
  ```

- `flowpicker-user-templates` — JSON array of user-created templates
  ```javascript
  [
    {
      id: "user-1715567890123-abc12",
      name: "My Stack",
      description: "...",
      author: "John",
      selections: { ide: [...], llm: [...], ... },
      upvotes: 0,
      downvotes: 0,
      createdAt: 1715567890123,
      isUserTemplate: true
    }
  ]
  ```

- `flowpicker-template-sort` — Current sort mode (string)
  ```javascript
  "upvotes-high" | "upvotes-low" | "newest" | "oldest"
  ```

## Future: Database Integration

Currently templates are browser-scoped (localStorage). For multi-device sync:

1. **Create `templates` table** in [data/flowpicker.db](data/flowpicker.db):
   ```sql
   CREATE TABLE templates (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     author TEXT,
     selections JSON,
     upvotes INTEGER DEFAULT 0,
     downvotes INTEGER DEFAULT 0,
     is_user_template BOOLEAN DEFAULT 0,
     created_at INTEGER,
     created_by_email TEXT
   );
   ```

2. **Modify [src/features/templates/templates.js](src/features/templates/templates.js)** to:
   - Fetch templates from DB on page load
   - POST new templates to backend (requires auth)
   - Track votes per user (email-based, not global)

3. **Add backend endpoints**:
   - `GET /api/templates` — fetch all
   - `POST /api/templates` — create (auth required)
   - `POST /api/templates/{id}/upvote` — vote (auth required)
   - `DELETE /api/templates/{id}` — delete user template (auth required)

## Usage Examples

### Load a Template
```javascript
const template = TEMPLATES[0]; // Cursor Power User
TemplatesFeature.loadTemplate(template);
// Saves selections and navigates to index.html
```

### Create a User Template
```javascript
const newTemplate = TemplatesFeature.addUserTemplate(
  "My Custom Stack",
  "VS Code + Sonnet + Continue",
  { ide: [{id: 'vscode', name: 'VS Code'}], ... },
  "Alice"
);
```

### Vote on a Template
```javascript
TemplatesFeature.upvote('cursor-power-user');
TemplatesFeature.downvote('budget-hobbyist');
```

### Sort Templates
```javascript
TemplatesFeature.setSortMode('newest');
const sorted = TemplatesFeature.sortTemplates(allTemplates, 'newest');
```

## Styling & Dark Mode

All components respect the app's dark mode system (`[data-theme='dark']`):
- Template cards adjust background and text colors
- Vote buttons inherit theme styling
- Modal form works in light and dark modes
- Responsive grid adapts to mobile (single column on <640px)

## Accessibility

- All buttons have `aria-label` for screen readers
- Form inputs use `<label>` elements
- Modal includes backdrop click-to-close and Escape-equivalent close button
- Color-independent voting (emoji icons 👍👎 don't rely on color alone)

## Testing Checklist

- [ ] Load `/templates.html` and see 12 curated templates in a grid
- [ ] Upvote and downvote buttons increment/persist on reload
- [ ] Sorting works: highest → lowest → newest → oldest
- [ ] Click "Use Template" loads stack into Plan page (no warnings)
- [ ] Click "New Template" opens modal form
- [ ] Fill form and submit creates new template in grid
- [ ] Trash icon appears on user templates; delete works
- [ ] Dark mode toggle switches template card colors
- [ ] Mobile view (< 640px) shows single column
- [ ] Author names display correctly ("Dev" for curated, user name for custom)

## Known Limitations

- Votes are per-browser (not synced across devices)
- User templates are browser-local (not backed up)
- No duplicate prevention for template names
- No moderation or spam filtering
- Author field is self-reported (no authentication)

These limitations will be addressed when moving to database-backed storage with user authentication.
