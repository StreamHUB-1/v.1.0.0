// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Nanti ganti dengan URL dan Anon Key dari dashboard project Supabase kamu
const supabaseUrl = 'https://oeesnwwhousxegyhfxjp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZXNud3dob3VzeGVneWhmeGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjYzNTksImV4cCI6MjA4NzI0MjM1OX0.GQBNn6uNDp8nRcPa9SaEYvSCl8FxoSihpU18cDWxK14';

export const supabase = createClient(supabaseUrl, supabaseKey);