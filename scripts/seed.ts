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

const DELAY_MS = 1000; // 1 second delay to stay safe on free tier

async function seedTable(filePath: string, type: string) {
  if (!fs.existsSync(filePath)) return;
  console.log(`\n--- 🧠 Semantic Syncing ${type.toUpperCase()} ---`);

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
    const name = record.Hotel_Name || record.Name || record.Event_Name || "Info";
    const city = record.City || record.Location || "Pakistan";
    const content = `${type.toUpperCase()}: ${name} in ${city}. ${record.Description || record.Desc || ""}`;

    try {
      // 1. Generate Embedding
      const result = await embedModel.embedContent(content);
      const vector = result.embedding.values;

      // 2. Insert with Vector
      await pool.query(
        `INSERT INTO travel_knowledge (content, metadata, embedding, source_type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (content) DO UPDATE SET embedding = $3`,
        [content, JSON.stringify(record), `[${vector.join(',')}]`, type]
      );

      added++;
      process.stdout.write(`\rProgress: ${added}/${records.length}`);

      // Delay to avoid rate limits
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err: any) {
      if (err.message.includes('429')) {
        console.log("\n⚠️ Rate limit hit. Waiting 10s...");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }
}

async function main() {
  await pool.connect();
  try {
    // Sync all files
    const webDataDir = path.join(process.cwd(), 'data/raw');
    await seedTable(path.join(webDataDir, 'hotels.csv'), 'hotel');
    await seedTable(path.join(webDataDir, 'pakistan_pois.csv'), 'poi');

    console.log(`\n🌟 SEMANTIC SYNC COMPLETE!`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
