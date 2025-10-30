// supabaseClient.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Your actual Supabase URL and anon key
const supabaseUrl = 'https://wsssggnrfxdldeoahvso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzc3NnZ25yZnhkbGRlb2FodnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzkyMDMsImV4cCI6MjA3NzQxNTIwM30.N7UvKcH0VZKFezrVKOBPWR6vrOtmuyZR1e3sGxZtGoQ';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);