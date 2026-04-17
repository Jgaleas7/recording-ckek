import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
// Create a single supabase client for interacting with your database
export const supabase = createClient(process.env.DB_HOST, process.env.SUPABASE_ANON_KEY)
