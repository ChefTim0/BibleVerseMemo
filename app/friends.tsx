import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, Tabs } from 'expo-router';
import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getColors } from '../constants/colors';
import { trpc } from '../lib/trpc';
import { UserPlus, Users } from 'lucide-react-native';

export default function FriendsScreen() {
  const { theme } = useApp();
  const colors = getColors(theme);
  const { isAuthenticated } = useAuth();
  const [friendUsername, setFriendUsername] = useState('');

  const friendsQuery = trpc.social.getFriends.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addFriendMutation = trpc.social.addFriend.useMutation();
  const removeFriendMutation = trpc.social.removeFriend.useMutation();

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      await addFriendMutation.mutateAsync({ username: friendUsername.trim() });
      setFriendUsername('');
      friendsQuery.refetch();
      Alert.alert('Success', 'Friend added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add friend');
    }
  };

  const handleRemoveFriend = (friendId: string, username: string) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriendMutation.mutateAsync({ friendId });
              friendsQuery.refetch();
              Alert.alert('Success', 'Friend removed');
            } catch {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Friends', headerShown: false }} />
        <Tabs.Screen options={{ href: null }} />
        <View style={styles.emptyContainer}>
          <Users color={colors.textSecondary} size={64} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Login to view friends
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Friends', headerShown: false }} />
      <Tabs.Screen options={{ href: null }} />
      
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Friends</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={friendsQuery.isRefetching}
            onRefresh={() => {
              friendsQuery.refetch();
            }}
          />
        }
      >
        <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Friend</Text>
              <View style={[styles.addFriendCard, { backgroundColor: colors.cardBackground }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={friendUsername}
                  onChangeText={setFriendUsername}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary, opacity: addFriendMutation.isPending ? 0.6 : 1 }]}
                  onPress={handleAddFriend}
                  disabled={addFriendMutation.isPending}
                >
                  {addFriendMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <UserPlus color="#FFFFFF" size={20} />
                      <Text style={styles.addButtonText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Friends ({friendsQuery.data?.length || 0})
              </Text>
              
              {friendsQuery.isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : friendsQuery.data && friendsQuery.data.length > 0 ? (
                friendsQuery.data.map((friend) => (
                  <View key={friend.id} style={[styles.friendCard, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.friendInfo}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {friend.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.friendName, { color: colors.text }]}>{friend.username}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                      onPress={() => handleRemoveFriend(friend.id, friend.username)}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Users color={colors.textSecondary} size={48} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No friends yet. Add some above!
                  </Text>
                </View>
              )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 16,
  },

  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  addFriendCard: {
    flexDirection: 'row' as const,
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  friendCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center' as const,
  },
});
