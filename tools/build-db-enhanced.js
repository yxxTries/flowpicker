// Enhanced build script that merges new products from new-products.js
// This adds new IDEs, LLMs, Integrations, Context layers, and Agents to the database

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');
const NEW_PRODUCTS = require('../new-products.js');

// Load the original LAYERS from build-db.js by requiring the main file pattern
// For simplicity, we'll define a function to load it
function loadOriginalLayers() {
  // The original LAYERS structure is embedded in build-db.js
  // We'll merge NEW_PRODUCTS into it
  return require('./build-db.js');
}

// For this implementation, we'll merge the products into the layer structure
function mergeProducts(layerArray, layerId, newProducts) {
  const layer = layerArray.find(l => l.id === layerId);
  if (!layer || !newProducts) return;

  const startPos = layer.options.length;
  newProducts.forEach((product, i) => {
    layer.options.push(product);
  });

  console.log(`✅ Added ${newProducts.length} new ${layerId}s`);
  return startPos;
}

(async () => {
  try {
    // Note: Since we can't easily load the LAYERS from build-db.js without modifying it,
    // we'll use a different approach - directly read and parse the original db and insert new records

    const wasmBinary = fs.readFileSync(path.join(__dirname, '..', 'vendor', 'sql-wasm.wasm'));
    const SQL = await initSqlJs({ wasmBinary });

    // Load existing database
    const dbPath = path.join(__dirname, '..', 'data', 'flowpicker.db');
    const existingDb = fs.readFileSync(dbPath);
    const db = new SQL.Database(existingDb);

    console.log('📂 Loaded existing database...\n');

    // Get current max positions for each layer
    const getMaxPosition = (layerId) => {
      const result = db.exec(`SELECT MAX(position) as max_pos FROM options WHERE layer_id = '${layerId}'`);
      return result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] || 0 : 0;
    };

    const insOpt   = db.prepare('INSERT INTO options (layer_id, id, name, position) VALUES (?, ?, ?, ?)');
    const insAttr  = db.prepare('INSERT INTO option_attrs (layer_id, option_id, key, value) VALUES (?, ?, ?, ?)');

    // Add new IDEs
    if (NEW_PRODUCTS.ides) {
      let pos = getMaxPosition('ide');
      NEW_PRODUCTS.ides.forEach(ide => {
        pos++;
        insOpt.run(['ide', ide.id, ide.name, pos]);
        for (const [key, value] of Object.entries(ide)) {
          if (key === 'id' || key === 'name') continue;
          insAttr.run(['ide', ide.id, key, value == null ? null : String(value)]);
        }
      });
      console.log(`✅ Added ${NEW_PRODUCTS.ides.length} new IDEs`);
    }

    // Add new LLMs
    if (NEW_PRODUCTS.llms) {
      let pos = getMaxPosition('llm');
      NEW_PRODUCTS.llms.forEach(llm => {
        pos++;
        insOpt.run(['llm', llm.id, llm.name, pos]);
        for (const [key, value] of Object.entries(llm)) {
          if (key === 'id' || key === 'name') continue;
          insAttr.run(['llm', llm.id, key, value == null ? null : String(value)]);
        }
      });
      console.log(`✅ Added ${NEW_PRODUCTS.llms.length} new LLMs`);
    }

    // Add new Integrations
    if (NEW_PRODUCTS.integrations) {
      let pos = getMaxPosition('integration');
      NEW_PRODUCTS.integrations.forEach(integ => {
        pos++;
        insOpt.run(['integration', integ.id, integ.name, pos]);
        for (const [key, value] of Object.entries(integ)) {
          if (key === 'id' || key === 'name') continue;
          insAttr.run(['integration', integ.id, key, value == null ? null : String(value)]);
        }
      });
      console.log(`✅ Added ${NEW_PRODUCTS.integrations.length} new Integrations`);
    }

    // Add new Context layers
    if (NEW_PRODUCTS.contexts) {
      let pos = getMaxPosition('context');
      NEW_PRODUCTS.contexts.forEach(ctx => {
        pos++;
        insOpt.run(['context', ctx.id, ctx.name, pos]);
        for (const [key, value] of Object.entries(ctx)) {
          if (key === 'id' || key === 'name') continue;
          insAttr.run(['context', ctx.id, key, value == null ? null : String(value)]);
        }
      });
      console.log(`✅ Added ${NEW_PRODUCTS.contexts.length} new Context layers`);
    }

    // Add new Agents
    if (NEW_PRODUCTS.agents) {
      let pos = getMaxPosition('agent');
      NEW_PRODUCTS.agents.forEach(agent => {
        pos++;
        insOpt.run(['agent', agent.id, agent.name, pos]);
        for (const [key, value] of Object.entries(agent)) {
          if (key === 'id' || key === 'name') continue;
          insAttr.run(['agent', agent.id, key, value == null ? null : String(value)]);
        }
      });
      console.log(`✅ Added ${NEW_PRODUCTS.agents.length} new Agents`);
    }

    insOpt.free();
    insAttr.free();

    // Export updated database
    const bytes = db.export();
    fs.writeFileSync(dbPath, Buffer.from(bytes));
    console.log(`\n✨ Updated ${dbPath} (${bytes.length} bytes)`);

    // Print summary
    console.log('\n📊 SUMMARY:');
    const totalNew = (NEW_PRODUCTS.ides?.length || 0) +
                     (NEW_PRODUCTS.llms?.length || 0) +
                     (NEW_PRODUCTS.integrations?.length || 0) +
                     (NEW_PRODUCTS.contexts?.length || 0) +
                     (NEW_PRODUCTS.agents?.length || 0);
    console.log(`Total new products added: ${totalNew}`);

    db.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
