# Debugging Template-to-Plan Flow

## Problem Statement
When clicking "Use Template" on the templates page and navigating to the Plan page, selections are not filling in the table.

## What We Know (✓ Verified)
- Selection data structure is correct: `{ ide: [{id, name}], llm: [...], ... }`
- localStorage serialization/deserialization works ✓
- Click handlers are properly attached to "Use Template" buttons ✓
- Code flow is logically correct ✓

## Testing Steps

### 1. Run Node.js Test (Verify Data Structure)
```bash
node debug-template-flow.js
```
**Expected:** ✓ TEST PASSED

This verifies that selections can be saved to and loaded from localStorage correctly.

### 2. Open Interactive Browser Test
1. Start the dev server: `npm run serve`
2. Navigate to: http://localhost:8000/test-full-flow.html
3. Click buttons in order:
   - "Save Template Selections" 
   - "Reload from LocalStorage"
   - "Render Table"
4. Each step should show green checkmarks and correct data

**Expected:** All steps green, all layers have selections

### 3. Check Open Browser Console
1. Open http://localhost:8000/templates.html
2. Open DevTools → Console
3. Click any "Use Template" button
4. Look for console messages starting with `[Templates]` and `[Template]`
5. Expected output:
   ```
   [Templates] Loading template: cursor-power-user
   [Templates] Selections structure: {ide: [...], llm: [...], ...}
   [Templates] Saved to localStorage, length: 280
   [Templates] Parsed back: {ide: [...], llm: [...], ...}
   [Templates] Navigating to index.html
   ```

### 4. Check Selections Were Saved
After clicking "Use Template":
1. Stay on templates.html (don't navigate away)
2. Open DevTools → Console
3. Run:
   ```javascript
   JSON.parse(localStorage.getItem('flowpicker-selections'))
   ```
4. **Expected:** Object with keys: `ide`, `llm`, `integration`, `context`, `agent`

### 5. Check Selections Load in Plan Page
1. Navigate to http://localhost:8000/index.html
2. Open DevTools → Console
3. Look for log messages starting with `[Table] Rendering with selections:`
4. Run:
   ```javascript
   window.App.state.selections
   ```
5. **Expected:** Object with keys: `ide`, `llm`, `integration`, `context`, `agent`

## Possible Issues & Solutions

### Issue: Console shows `SelectionsStore missing or no selections`
**Cause:** SelectionsStore not loaded or template.selections is undefined
**Solution:** 
- Check that `data/templates.js` is loaded before `templates.js`
- Verify all templates have a `selections` property

### Issue: Selections save to localStorage but don't load
**Cause:** localStorage cleared between pages, or key mismatch
**Solution:**
- Check that the localStorage key is `'flowpicker-selections'` (line 4 of selections-store.js)
- Make sure nothing is calling `localStorage.clear()`

### Issue: Selections load but table shows no items
**Cause:** App.state.selections is loaded but table isn't rendering them
**Solution:**
- Check console for `[Table] Rendering with selections:` message
- Verify table.render() is being called
- Check that LAYERS is properly initialized (loaded from database)

### Issue: Layer IDs don't match
**Cause:** Database has different layer IDs than templates expect
**Solution:**
- Check which layer IDs are in LAYERS:
  ```javascript
  LAYERS.map(l => l.id)
  ```
- Compare with template layer keys: `ide`, `llm`, `integration`, `context`, `agent`
- If mismatched, update data/templates.js to use correct IDs

## Manual Test: Direct Selection Setting
To directly test if the table can render selections:

1. Open http://localhost:8000/index.html
2. Open DevTools Console
3. Paste:
```javascript
window.App.state.selections = {
  ide: [{ id: 'cursor', name: 'Cursor' }],
  llm: [{ id: 'claude-sonnet', name: 'Claude Sonnet 4.6' }],
  integration: [{ id: 'cursor-built', name: 'Cursor built-in' }],
  context: [{ id: 'cursor-cb', name: '@codebase (Cursor)' }],
  agent: [{ id: 'cursor-agent', name: 'Cursor Agent Mode' }],
};
window.App.features.table.render();
```
4. Look at the table - if selections appear, the issue is in the template → localStorage → load cycle
5. If selections don't appear, the issue is in the table rendering

## Debugging Logs Added
The following files have enhanced logging for troubleshooting:

- **src/features/templates/templates.js** (loadTemplate function)
  - Logs template ID and selections structure
  - Validates each selection item has id and name
  - Shows what was saved to localStorage
  
- **src/features/table/table.js** (render function)
  - Logs `App.state.selections` at render time
  
- **src/main.js** (DOMContentLoaded)
  - Logs loaded selections from localStorage

Look for console messages prefixed with `[Templates]` or `[Table]` to trace the flow.

## Next Steps
1. Run through testing steps 1-3 above
2. Share console output from step 3 or 5
3. Try the manual test in "Manual Test: Direct Selection Setting"
4. Report which step fails first
