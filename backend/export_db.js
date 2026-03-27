const { db } = require('./db');
const fs = require('fs');
const path = require('path');

function exportToMarkdown() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  let md = "# 🇬🇭 GhanaPass Database Export\n";
  md += `*Generated on: ${new Date().toLocaleString()}*\n\n`;

  for (const table of tables) {
    if (table.name === 'sqlite_sequence') continue;
    
    md += `## 📋 Table: ${table.name}\n\n`;
    const data = db.prepare(`SELECT * FROM ${table.name}`).all();
    
    if (data.length === 0) {
      md += "*Table is empty.*\n\n";
      continue;
    }

    const headers = Object.keys(data[0]);
    md += "| " + headers.join(" | ") + " |\n";
    md += "| " + headers.map(() => "---").join(" | ") + " |\n";
    
    for (const row of data) {
      md += "| " + headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === 'object') return JSON.stringify(val).substring(0, 50) + "...";
        return String(val).replace(/\|/g, '\\|').replace(/\n/g, ' ');
      }).join(" | ") + " |\n";
    }
    md += "\n---\n\n";
  }

  const exportPath = path.join(__dirname, 'GhanaPass_Database_Export.md');
  fs.writeFileSync(exportPath, md);
  console.log(`✅ Database exported to: ${exportPath}`);
  return exportPath;
}

exportToMarkdown();
