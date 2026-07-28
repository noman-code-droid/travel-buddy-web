import { createClient } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  // Using createClient instead of createPool for direct connection
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  try {
    await client.connect();
    console.log("Connecting to:", process.env.POSTGRES_URL?.substring(0, 40) + "...");
    const { rows } = await client.query('SELECT NOW()');
    console.log("✅ DATABASE CONNECTED! Current Time:", rows[0].now);
    await client.end();
  } catch (e: any) {
    console.error("❌ DATABASE FAILED:", e.message);
  }
}
test();
