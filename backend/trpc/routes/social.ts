import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { supabase } from "../../../lib/supabase";

export const socialRouter = createTRPCRouter({
  addFriend: protectedProcedure
    .input(z.object({
      username: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      
      const { data: friend, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', input.username)
        .single();

      if (friendError || !friend) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (friend.id === userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add yourself as a friend',
        });
      }

      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${userId})`)
        .single();

      if (existingFriendship) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Friendship already exists',
        });
      }

      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friend.id,
          status: 'accepted',
        });

      if (insertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add friend',
        });
      }

      return { success: true };
    }),

  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        user_id,
        friend_id,
        profiles!friendships_friend_id_fkey(id, username),
        profiles!friendships_user_id_fkey(id, username)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error || !friendships) {
      console.error('Error fetching friends:', error);
      return [];
    }

    return friendships.map((f: any) => {
      const friendProfile = f.user_id === userId 
        ? f.profiles[0] 
        : f.profiles[1];
      
      return {
        id: friendProfile?.id || '',
        username: friendProfile?.username || 'Unknown',
        status: f.status,
        createdAt: f.created_at,
      };
    });
  }),

  getFriendProgress: protectedProcedure
    .input(z.object({
      friendId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.userId;

      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${input.friendId}),and(user_id.eq.${input.friendId},friend_id.eq.${userId})`)
        .eq('status', 'accepted')
        .single();

      if (!friendship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not friends with this user',
        });
      }

      const { data: friend } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', input.friendId)
        .single();

      const { data: verseProgress } = await supabase
        .from('verse_progress')
        .select('memorized, completed, started')
        .eq('user_id', input.friendId);

      const memorizedCount = verseProgress?.filter(vp => vp.memorized).length || 0;
      const completedCount = verseProgress?.filter(vp => vp.completed).length || 0;
      const totalVerses = verseProgress?.filter(vp => vp.started).length || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: dailyReview } = await supabase
        .from('daily_reviews')
        .select('streak')
        .eq('user_id', input.friendId)
        .eq('date', today)
        .single();

      return {
        username: friend?.username || 'Unknown',
        memorizedCount,
        completedCount,
        totalVerses,
        currentStreak: dailyReview?.streak || 0,
      };
    }),

  removeFriend: protectedProcedure
    .input(z.object({
      friendId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${input.friendId}),and(user_id.eq.${input.friendId},friend_id.eq.${userId})`);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove friend',
        });
      }

      return { success: true };
    }),
});
