/**
 * Supabase client initialization for Next.js
 * Used for server-side operations only
 *
 * Uses lazy initialization to support builds without environment variables
 */

import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function initializeSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Create a dummy client if credentials are missing (for build time)
  // Real API calls will fail at runtime with a proper error message
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "⚠️  Supabase credentials not configured. API routes will fail at runtime.",
    );
    // Return a dummy client that won't crash during build
    return createClient("https://dummy.supabase.co", "dummy-key");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseInstance;
}

export const supabase = initializeSupabase();
