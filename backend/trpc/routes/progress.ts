import * as z from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { supabase } from "../../../lib/supabase";

const verseProgressSchema = z.object({
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
  attempts: z.number(),
  correctGuesses: z.number(),
  lastPracticed: z.string(),
  completed: z.boolean(),
  started: z.boolean(),
  masteryLevel: z.number(),
  memorized: z.boolean().optional(),
});

export const progressRouter = createTRPCRouter({
  sync: protectedProcedure
    .input(z.object({
      progress: z.array(verseProgressSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;

      const progressRecords = input.progress.map(verse => ({
        user_id: userId,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        attempts: verse.attempts,
        correct_guesses: verse.correctGuesses,
        last_practiced: verse.lastPracticed,
        completed: verse.completed,
        started: verse.started,
        mastery_level: verse.masteryLevel,
        memorized: verse.memorized || false,
      }));

      const { error: progressError } = await supabase
        .from('verse_progress')
        .upsert(progressRecords, {
          onConflict: 'user_id,book,chapter,verse',
        });

      if (progressError) {
        console.error('[Progress] Error syncing progress:', progressError);
        throw progressError;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: existingReview } = await supabase
        .from('daily_reviews')
        .select('id, verses_reviewed, streak')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingReview) {
        await supabase
          .from('daily_reviews')
          .update({ verses_reviewed: existingReview.verses_reviewed + input.progress.length })
          .eq('id', existingReview.id);
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const { data: yesterdayReview } = await supabase
          .from('daily_reviews')
          .select('streak')
          .eq('user_id', userId)
          .eq('date', yesterday)
          .single();

        const newStreak = yesterdayReview ? yesterdayReview.streak + 1 : 1;

        await supabase
          .from('daily_reviews')
          .insert({
            user_id: userId,
            date: today,
            verses_reviewed: input.progress.length,
            streak: newStreak,
          });
      }

      return { success: true };
    }),

  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;
    
    const { data: progress, error } = await supabase
      .from('verse_progress')
      .select('book, chapter, verse, attempts, correct_guesses, last_practiced, completed, started, mastery_level, memorized')
      .eq('user_id', userId);

    if (error || !progress) {
      console.error('[Progress] Error fetching progress:', error);
      return [];
    }

    return progress.map((p: any) => ({
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
  }),

  updateProgress: protectedProcedure
    .input(verseProgressSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;

      const { error } = await supabase
        .from('verse_progress')
        .upsert({
          user_id: userId,
          book: input.book,
          chapter: input.chapter,
          verse: input.verse,
          attempts: input.attempts,
          correct_guesses: input.correctGuesses,
          last_practiced: input.lastPracticed,
          completed: input.completed,
          started: input.started,
          mastery_level: input.masteryLevel,
          memorized: input.memorized || false,
        }, {
          onConflict: 'user_id,book,chapter,verse',
        });

      if (error) {
        console.error('[Progress] Error updating progress:', error);
        throw error;
      }

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    const { data: allProgress } = await supabase
      .from('verse_progress')
      .select('started, memorized, completed')
      .eq('user_id', userId);

    const totalVerses = allProgress?.filter(p => p.started).length || 0;
    const memorizedVerses = allProgress?.filter(p => p.memorized).length || 0;
    const completedVerses = allProgress?.filter(p => p.completed).length || 0;

    const today = new Date().toISOString().split('T')[0];
    const { data: todayReview } = await supabase
      .from('daily_reviews')
      .select('verses_reviewed, streak')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    return {
      totalVerses,
      memorizedVerses,
      completedVerses,
      currentStreak: todayReview?.streak || 0,
      todayReviewed: todayReview?.verses_reviewed || 0,
    };
  }),
});
