#!/usr/bin/env node
// Seed the templates database with curated templates from data/templates.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'templates.db');

// Load curated templates
const templatesFile = path.join(__dirname, '..', 'data', 'templates.js');
const templateCode = fs.readFileSync(templatesFile, 'utf8');

// Extract TEMPLATES array using eval (safe here since it's our own code)
let TEMPLATES;
eval(templateCode);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

try {
  // Create tables
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

  // Check if templates already exist
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM templates').get().count;
  if (existingCount > 0) {
    console.log(`✓ Database already has ${existingCount} templates, skipping seed`);
    db.close();
    process.exit(0);
  }

  // Create "Dev" user
  const devUserId = `user-dev-${Date.now()}`;
  db.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)')
    .run(devUserId, 'dev@flowpicker.local');

  // Seed curated templates
  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, name, description, author, selections, is_user_template)
    VALUES (?, ?, ?, ?, ?, 0)
  `);

  let count = 0;
  for (const template of TEMPLATES) {
    insertTemplate.run(
      template.id,
      template.name,
      template.description,
      template.author,
      JSON.stringify(template.selections)
    );
    count++;
  }

  console.log(`✓ Seeded ${count} curated templates`);
  db.close();
} catch (e) {
  console.error('✗ Failed to seed database:', e.message);
  db.close();
  process.exit(1);
}
