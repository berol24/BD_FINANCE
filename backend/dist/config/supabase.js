import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables. Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
}
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
//# sourceMappingURL=supabase.js.map