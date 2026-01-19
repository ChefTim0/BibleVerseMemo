import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  'https://kdizcodrnnyzxvwsilwc.supabase.co';

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaXpjb2Rybm55enh2d3NpbHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNTg5MDEsImV4cCI6MjA1MjgzNDkwMX0.FGHbtAcG12V6BzLyFdwCvQ_viT73No6hSkp4Yj-wqLo';

let supabaseInstance: SupabaseClient;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  throw new Error('Supabase initialization failed');
}

export const supabase = supabaseInstance;
