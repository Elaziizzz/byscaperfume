import { createClient } from '@supabase/supabase-js'

// Hardcode the correct URL and key to bypass Vercel env var cache/typo issues
const supabaseUrl = 'https://hmnbcfmpvkzbpjtrnmwt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbmJjZm1wdmt6YnBqdHJubXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0Mjc2OTMsImV4cCI6MjEwMjAwMzY5M30.0UyRnaaUe-JTafRiUIGTf-XEXixbCNiNgydZqewwzxk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
