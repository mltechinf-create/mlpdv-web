import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tgwzcicfihnquocdlzxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd3pjaWNmaWhucXVvY2RsenhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjAyODMsImV4cCI6MjA3OTgzNjI4M30.Z0h0k5yseYMYy6mqtcFZt_3X8w26OCP3QvzsuZvuzew'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
