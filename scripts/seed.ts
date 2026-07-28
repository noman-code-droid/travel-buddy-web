import { createClient } from '@vercel/postgres';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const pool = createClient({ connectionString: process.env.POSTGRES_URL });
const DELAY_MS = 1000;

async function seedTable(filePath: string, type: string) {
  if (!fs.existsSync(filePath)) return;
  console.log(`\n--- 🧠 Semantic Syncing ${type.toUpperCase()}: ${path.basename(filePath)} ---`);

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

    try {
      const result = await embedModel.embedContent(content);
      const vector = result.embedding.values;

      await pool.query(
        `INSERT INTO travel_knowledge (content, metadata, embedding, source_type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (content) DO UPDATE SET embedding = $3`,
        [content, JSON.stringify(record), `[${vector.join(',')}]`, type]
      );

      added++;
      process.stdout.write(`\rProgress: ${added}/${records.length}`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err: any) {
      if (err.message.includes('429')) await new Promise(r => setTimeout(r, 10000));
    }
  }
}

async function main() {
  await pool.connect();
  try {
    const webDataDir = path.join(process.cwd(), 'data/raw');
    const ragDir = path.join(process.cwd(), '../rag knowledge');

    const internalFiles = [
      ['hotels.csv', 'hotel'], ['pakistan_pois.csv', 'poi'], ['pakistan_restaurants.csv', 'restaurant'],
      ['pakistan_road_safety_advisories.csv', 'safety'], ['pakistan_seasonal_events.csv', 'event']
    ];

    const externalFiles = [
      ['pakistan_pois.xlsx', 'poi'], ['pakistan_restaurants.xlsx', 'restaurant'],
      ['pakistan_road_safety_advisories.xlsx', 'safety'], ['pakistan_seasonal_events.xlsx', 'event'],
      ['Tourist Destinations.csv', 'poi']
    ];

    for (const [f, t] of internalFiles) await seedTable(path.join(webDataDir, f), t);
    for (const [f, t] of externalFiles) await seedTable(path.join(ragDir, f), t);

    console.log(`\n🌟 ALL KNOWLEDGE SOURCES SEMANTICALLY SYNCED!`);
  } finally {
    await pool.end();
  }
}

main();
