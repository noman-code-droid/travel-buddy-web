import { createClient } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = createClient({ connectionString: process.env.POSTGRES_URL });

async function seedTable(filePath: string, type: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skipping (Not found): ${filePath}`);
    return;
  }

  console.log(`\n--- 📂 Syncing ${type.toUpperCase()}: ${path.basename(filePath)} ---`);

  let records: any[] = [];
  if (filePath.endsWith('.csv')) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    records = parse(fileContent, { columns: true, skip_empty_lines: true, relax_column_count: true });
  } else if (filePath.endsWith('.xlsx')) {
    const workbook = XLSX.readFile(filePath);
    records = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  }

  let added = 0;

  for (const record of records) {
    const name = record.Hotel_Name || record.Name || record.Event_Name || record.Route_Segment || record._key || "Unknown";
    const city = record.City || record.district || record.Region || record.Location || "Pakistan";
    const desc = record.Desc || record.Description || record.Notes || "";
    const content = `${type.toUpperCase()}: ${name} in ${city}. ${desc}`;

    try {
      await pool.query(
        `INSERT INTO travel_knowledge (content, metadata, source_type)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [content, JSON.stringify(record), type]
      );
      added++;
      process.stdout.write(`\rLoaded: ${added}/${records.length}`);
    } catch (err: any) {
      // Ignore errors for rows that already exist
    }
  }

  // Update search index
  await pool.query("UPDATE travel_knowledge SET fts_tokens = to_tsvector('english', content) WHERE fts_tokens IS NULL");
  console.log(`\n✨ Finished ${type}: ${added} rows.`);
}

async function main() {
  try {
    // Connect ONCE at the start
    await pool.connect();

    // 1. Internal Project Data
    const webDataDir = path.join(process.cwd(), 'data/raw');
    await seedTable(path.join(webDataDir, 'hotels.csv'), 'hotel');
    await seedTable(path.join(webDataDir, 'pakistan_pois.csv'), 'poi');
    await seedTable(path.join(webDataDir, 'pakistan_restaurants.csv'), 'restaurant');
    await seedTable(path.join(webDataDir, 'pakistan_road_safety_advisories.csv'), 'safety');
    await seedTable(path.join(webDataDir, 'pakistan_seasonal_events.csv'), 'event');

    // 2. Root Knowledge Data (Including Excel files)
    const ragDir = path.join(process.cwd(), '../rag knowledge');
    await seedTable(path.join(ragDir, 'pakistan_pois.xlsx'), 'poi');
    await seedTable(path.join(ragDir, 'pakistan_restaurants.xlsx'), 'restaurant');
    await seedTable(path.join(ragDir, 'pakistan_road_safety_advisories.xlsx'), 'safety');
    await seedTable(path.join(ragDir, 'pakistan_seasonal_events.xlsx'), 'event');
    await seedTable(path.join(ragDir, 'Tourist Destinations.csv'), 'poi');

    console.log(`\n🌟 AUDIT COMPLETE: ALL KNOWLEDGE SOURCES SYNCED!`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    // End connection ONCE at the very end
    await pool.end();
  }
}

main();
