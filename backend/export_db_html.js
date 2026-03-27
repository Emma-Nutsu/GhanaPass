const { db } = require('./db');
const fs = require('fs');
const path = require('path');

function exportToHTML() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GhanaPass Database Export</title>
    <style>
        :root {
            --primary: #183028;
            --gold: #D4A843;
            --text: #333;
            --bg: #fff;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text);
            padding: 40px;
            max-width: 1200px;
            margin: auto;
            background: #f9f9f9;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        .header h1 {
            color: var(--primary);
            margin: 0;
            font-size: 32px;
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        .table-container {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            margin-bottom: 40px;
            overflow-x: auto;
        }
        h2 {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--primary);
            border-left: 5px solid var(--gold);
            padding-left: 15px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th {
            background: #f4f7f6;
            color: var(--primary);
            font-weight: 700;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #eee;
            white-space: nowrap;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
        }
        tr:hover { background: #fdfdfd; }
        .empty {
            color: #999;
            font-style: italic;
            padding: 20px;
            text-align: center;
        }
        @media print {
            body { padding: 0; backgound: white; }
            .table-container { box-shadow: none; border: 1px solid #eee; }
            h2 { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🇬🇭 GhanaPass Registry & System Data</h1>
        <p>Official Database Export • Generated: ${new Date().toLocaleString()}</p>
    </div>
`;

  for (const table of tables) {
    if (table.name === 'sqlite_sequence' || table.name === 'sqlite_master') continue;
    
    html += `<h2>📦 Table: ${table.name}</h2>`;
    html += `<div class="table-container">`;
    
    const data = db.prepare(`SELECT * FROM ${table.name}`).all();
    
    if (data.length === 0) {
      html += `<div class="empty">No records found in this table.</div>`;
    } else {
      const headers = Object.keys(data[0]);
      html += `<table><thead><tr>`;
      headers.forEach(h => html += `<th>${h}</th>`);
      html += `</tr></thead><tbody>`;
      
      for (const row of data) {
        html += `<tr>`;
        headers.forEach(h => {
          let val = row[h];
          if (val === null || val === undefined) val = "";
          if (typeof val === 'object') val = JSON.stringify(val).substring(0, 30) + "...";
          html += `<td>${String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
        });
        html += `</tr>`;
      }
      html += `</tbody></table>`;
    }
    
    html += `</div>`;
  }

  html += `
    <div style="text-align:center; color:#888; font-size:12px; margin-top:50px;">
        &copy; ${new Date().getFullYear()} GhanaPass Identity Platform • Internal Data Export
    </div>
</body>
</html>
`;

  const exportPath = path.join(__dirname, 'GhanaPass_Database_Export.html');
  fs.writeFileSync(exportPath, html);
  console.log(`✅ Database exported to: ${exportPath}`);
}

exportToHTML();
