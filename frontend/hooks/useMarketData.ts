"use client";

import { useQuery } from "@tanstack/react-query";
import { getIndexedMarkets, IndexedMarket } from "@/lib/indexer";

export function useMarketData() {
  return useQuery({
    queryKey: ["matchmind-markets"],
    queryFn: async () => {
      try {
        const chainData = await getIndexedMarkets();
        return chainData;
      } catch {
        return [];
      }
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
    initialData: [] as IndexedMarket[]
  });
}
