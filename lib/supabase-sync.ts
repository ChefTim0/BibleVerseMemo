import { supabase } from './supabase';
import type { VerseProgress } from '../types/database';

export async function syncProgressToSupabase(progress: VerseProgress[], userId: string) {
  try {
    const progressRecords = progress.map(p => ({
      user_id: userId,
      book: p.book,
      chapter: p.chapter,
      verse: p.verse,
      attempts: p.attempts,
      correct_guesses: p.correctGuesses,
      last_practiced: p.lastPracticed,
      completed: p.completed,
      started: p.started,
      mastery_level: p.masteryLevel,
      memorized: p.memorized || false,
    }));

    const { error } = await supabase
      .from('verse_progress')
      .upsert(progressRecords, {
        onConflict: 'user_id,book,chapter,verse',
      });

    if (error) throw error;
    
    console.log('Progress synced to Supabase');
  } catch (error) {
    console.error('Error syncing progress:', error);
    throw error;
  }
}

export async function loadProgressFromSupabase(userId: string): Promise<VerseProgress[]> {
  try {
    const { data, error } = await supabase
      .from('verse_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map((p: any) => ({
      book: p.book,
      chapter: p.chapter,
      verse: p.verse,
      attempts: p.attempts,
      correctGuesses: p.correct_guesses,
      lastPracticed: p.last_practiced,
      completed: p.completed,
      started: p.started,
      masteryLevel: p.mastery_level,
      memorized: p.memorized || false,
    }));
  } catch (error) {
    console.error('Error loading progress from Supabase:', error);
    return [];
  }
}

export async function updateVerseProgressInSupabase(progress: VerseProgress, userId: string) {
  try {
    console.log('[Supabase Sync] Updating verse progress:', {
      userId,
      book: progress.book,
      chapter: progress.chapter,
      verse: progress.verse,
      completed: progress.completed,
      memorized: progress.memorized,
    });

    const { error } = await supabase
      .from('verse_progress')
      .upsert({
        user_id: userId,
        book: progress.book,
        chapter: progress.chapter,
        verse: progress.verse,
        attempts: progress.attempts,
        correct_guesses: progress.correctGuesses,
        last_practiced: progress.lastPracticed,
        completed: progress.completed,
        started: progress.started,
        mastery_level: progress.masteryLevel,
        memorized: progress.memorized || false,
      }, {
        onConflict: 'user_id,book,chapter,verse',
      });

    if (error) {
      console.error('[Supabase Sync] Error updating verse progress:', error);
      throw error;
    }
    
    console.log('[Supabase Sync] Successfully updated verse progress');
  } catch (error) {
    console.error('[Supabase Sync] Error updating verse progress:', error);
    throw error;
  }
}
