import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function migrate() {
  console.log("Adding youtube_videos column to activities table...");
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE activities ADD COLUMN IF NOT EXISTS youtube_videos JSONB;'
  });
  
  if (error) {
    console.error("Migration failed via RPC. You may need to add it manually in Supabase SQL Editor:", error.message);
    console.log("SQL: ALTER TABLE activities ADD COLUMN IF NOT EXISTS youtube_videos JSONB;");
  } else {
    console.log("Successfully added youtube_videos column!");
  }
}

migrate();
