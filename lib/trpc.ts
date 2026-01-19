import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppRouter } from "../backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn(
      "EXPO_PUBLIC_RORK_API_BASE_URL is missing, using fallback",
    );
    return "https://api.rork.com"; // fallback temporaire
  }

  return url;
};


export const createTRPCClient = () => trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await AsyncStorage.getItem('@auth_token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export const trpcClient = createTRPCClient();
