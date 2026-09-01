import { createClient } from '@vercel/postgres';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 1. Load all available API keys
const apiKeys = Object.keys(process.env)
  .filter(key => key.startsWith('GOOGLE_GENERATIVE_AI_API_KEY'))
  .map(key => process.env[key] || '')
  .filter(Boolean);

if (apiKeys.length === 0) {
  console.error("❌ No API keys found in .env.local!");
  process.exit(1);
}

const dbConfig = { connectionString: process.env.POSTGRES_URL };
let currentKeyIndex = 0;

async function seedTable(filePath: string, type: string) {
  if (!fs.existsSync(filePath)) return;
  console.log(`\n--- 🚀 Syncing ${type.toUpperCase()}: ${path.basename(filePath)} ---`);

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
    const name = record.Hotel_Name || record.Name || record.Event_Name || record.Route_Segment || "Info";
    const city = record.City || record.Location || record.district || "Pakistan";
    const desc = record.Description || record.Desc || record.Notes || "";
    const content = `${type.toUpperCase()}: ${name} in ${city}. ${desc}`;

    let success = false;
    while (!success) {
      try {
        // Rotate Key for every single record to balance the load
        const currentKey = apiKeys[currentKeyIndex];
        const genAI = new GoogleGenerativeAI(currentKey);
        const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

        // 1. Get Embedding
        const result = await embedModel.embedContent(content);
        const vector = result.embedding.values;

        // 2. Save to DB
        const client = createClient(dbConfig);
        await client.connect();
        await client.query(
          `INSERT INTO travel_knowledge (content, metadata, embedding, source_type)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (content) DO NOTHING`,
          [content, JSON.stringify(record), `[${vector.join(',')}]`, type]
        );
        await client.end();

        added++;
        process.stdout.write(`\r✅ Progress: ${added}/${records.length} (Key ${currentKeyIndex + 1})`);

        // Move to next key for next record
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        success = true;

      } catch (err: any) {
        if (err.message.includes('429')) {
          console.log(`\n🛑 Key ${currentKeyIndex + 1} limited. Switching...`);
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          // If we cycled through all keys and still hit limits, take a 10s breather
          if (currentKeyIndex === 0) await new Promise(r => setTimeout(r, 10000));
        } else {
          console.error(`\n❌ Error on Key ${currentKeyIndex + 1}: ${err.message}`);
          success = true; // Skip record on non-rate-limit errors
        }
      }
    }
  }
}

async function main() {
  console.log(`🔑 Initialized with ${apiKeys.length} active keys.`);
  try {
    const webDataDir = path.join(process.cwd(), 'data/raw');
    const ragDir = path.join(process.cwd(), '../rag knowledge');

    const files = [
      [path.join(webDataDir, 'hotels.csv'), 'hotel'],
      [path.join(webDataDir, 'pakistan_pois.csv'), 'poi'],
      [path.join(webDataDir, 'pakistan_restaurants.csv'), 'restaurant'],
      [path.join(webDataDir, 'pakistan_road_safety_advisories.csv'), 'safety'],
      [path.join(webDataDir, 'pakistan_seasonal_events.csv'), 'event'],
      [path.join(ragDir, 'pakistan_pois.xlsx'), 'poi'],
      [path.join(ragDir, 'pakistan_restaurants.xlsx'), 'restaurant'],
      [path.join(ragDir, 'pakistan_road_safety_advisories.xlsx'), 'safety'],
      [path.join(ragDir, 'pakistan_seasonal_events.xlsx'), 'event'],
      [path.join(ragDir, 'Tourist Destinations.csv'), 'poi']
    ];

    for (const [f, t] of files) await seedTable(f, t);
    console.log(`\n🌟 SYNC COMPLETE! Your RAG system is fully loaded.`);
  } catch (err: any) {
    console.error("Main error:", err.message);
  }
}

main();
