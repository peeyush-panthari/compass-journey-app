import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function checkSchema() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching activities:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns found in activities record:', Object.keys(data[0]));
  } else {
    console.log('Activities table exists but is empty or record not found.');
  }
}

checkSchema();
