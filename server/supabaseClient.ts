// Supabase client for Auth, Storage, and other Supabase features
// This client is separate from the database connection (db.ts) which uses Drizzle ORM
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL must be set. Get this from your Supabase project settings.",
  );
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_ANON_KEY must be set. Get this from your Supabase project settings.",
  );
}

// Create Supabase client for server-side operations
// Use the anon key for public operations, or service role key for admin operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Example usage for future Auth migration:
//
// Sign up:
// const { data, error } = await supabase.auth.signUp({
//   email: 'user@example.com',
//   password: 'password'
// })
//
// Sign in with OAuth (Google, GitHub, etc):
// const { data, error } = await supabase.auth.signInWithOAuth({
//   provider: 'google'
// })
//
// Get current user:
// const { data: { user } } = await supabase.auth.getUser()
//
// Storage upload:
// const { data, error } = await supabase.storage
//   .from('products')
//   .upload('image.png', file)
