"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";
import { NotificationToasts } from "@/components/NotificationToasts";
import { queryClient, wagmiConfig } from "@/lib/wagmi";
import { MatchMindUserProvider } from "@/lib/userProfile";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <MatchMindUserProvider>
            {children}
            <NotificationToasts />
          </MatchMindUserProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
