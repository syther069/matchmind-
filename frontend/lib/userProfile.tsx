"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PositionSide = "FOLLOW" | "FADE";

export type RecordedPosition = {
  id: string;
  matchId: string;
  match: string;
  side: PositionSide;
  amount: string;
  txHash: `0x${string}`;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: "position" | "mint" | "profile" | "system";
};

export type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
  kind: "position" | "mint" | "profile";
};

export type UserProfile = {
  username: string;
  avatar?: string;
  predictionPassMinted: boolean;
  positions: RecordedPosition[];
  updatedAt?: string;
};

type CreateNotification = Omit<NotificationItem, "id" | "createdAt" | "read"> & {
  activity?: Omit<ActivityItem, "id" | "createdAt">;
};

type MatchMindUserContextValue = {
  profile: UserProfile;
  notifications: NotificationItem[];
  activity: ActivityItem[];
  toasts: NotificationItem[];
  unreadCount: number;
  updateProfile: (profile: Pick<UserProfile, "username" | "avatar">) => void;
  mintPredictionPass: () => void;
  recordPosition: (position: Omit<RecordedPosition, "id" | "createdAt">) => void;
  pushNotification: (notification: CreateNotification) => void;
  markAllNotificationsRead: () => void;
  dismissToast: (id: string) => void;
};

const profileKey = "matchmind.profile.v1";
const notificationKey = "matchmind.notifications.v1";
const activityKey = "matchmind.activity.v1";

const defaultProfile: UserProfile = {
  username: "MatchMind Trader",
  predictionPassMinted: false,
  positions: []
};

const defaultActivity: ActivityItem[] = [
  {
    id: "seed-position",
    label: "Position Recorded",
    detail: "User followed Brazil vs Argentina - 0.05 OKB",
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    kind: "position"
  },
  {
    id: "seed-mint",
    label: "Prediction Pass Minted",
    detail: "User minted Prediction Pass",
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    kind: "mint"
  },
  {
    id: "seed-profile",
    label: "Profile Updated",
    detail: "User updated profile",
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    kind: "profile"
  }
];

const defaultNotifications: NotificationItem[] = [
  {
    id: "seed-notice-position",
    title: "Position Recorded",
    body: "FOLLOW - Brazil vs Argentina\n0.05 OKB\nTx: 0xcde6...b563",
    createdAt: defaultActivity[0].createdAt,
    read: false,
    kind: "position"
  },
  {
    id: "seed-notice-mint",
    title: "Prediction Pass Minted",
    body: "Prediction Pass ownership recorded locally.",
    createdAt: defaultActivity[1].createdAt,
    read: false,
    kind: "mint"
  },
  {
    id: "seed-notice-profile",
    title: "Profile Updated",
    body: "MatchMind Trader updated profile.",
    createdAt: defaultActivity[2].createdAt,
    read: false,
    kind: "profile"
  }
];

const MatchMindUserContext = createContext<MatchMindUserContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function MatchMindUserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>(defaultActivity);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(readStorage(profileKey, defaultProfile));
    setNotifications(readStorage(notificationKey, defaultNotifications));
    setActivity(readStorage(activityKey, defaultActivity));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(profileKey, JSON.stringify(profile));
  }, [hydrated, profile]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(notificationKey, JSON.stringify(notifications.slice(0, 40)));
  }, [hydrated, notifications]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(activityKey, JSON.stringify(activity.slice(0, 40)));
  }, [activity, hydrated]);

  function pushNotification(notification: CreateNotification) {
    const createdAt = new Date().toISOString();
    const item: NotificationItem = {
      id: createId("notice"),
      createdAt,
      read: false,
      ...notification
    };

    setNotifications((current) => [item, ...current].slice(0, 40));
    setToasts((current) => [item, ...current].slice(0, 3));

    const activityEntry = notification.activity;
    if (activityEntry) {
      setActivity((current) => [
        {
          id: createId("activity"),
          createdAt,
          ...activityEntry
        },
        ...current
      ].slice(0, 40));
    }
  }

  function updateProfile(nextProfile: Pick<UserProfile, "username" | "avatar">) {
    const username = nextProfile.username.trim() || defaultProfile.username;
    setProfile((current) => ({
      ...current,
      username,
      avatar: nextProfile.avatar,
      updatedAt: new Date().toISOString()
    }));
    pushNotification({
      title: "Profile Updated",
      body: `${username} is ready for X Cup judging.`,
      kind: "profile",
      activity: {
        label: "Profile Updated",
        detail: `${username} updated profile`,
        kind: "profile"
      }
    });
  }

  function mintPredictionPass() {
    setProfile((current) => ({ ...current, predictionPassMinted: true }));
    pushNotification({
      title: "Prediction Pass Minted",
      body: "Prediction Pass ownership recorded locally.",
      kind: "mint",
      activity: {
        label: "NFT Minted",
        detail: `${profile.username} minted Prediction Pass`,
        kind: "mint"
      }
    });
  }

  function recordPosition(position: Omit<RecordedPosition, "id" | "createdAt">) {
    const createdAt = new Date().toISOString();
    const recorded: RecordedPosition = {
      id: createId("position"),
      createdAt,
      ...position
    };

    setProfile((current) => ({
      ...current,
      positions: [recorded, ...current.positions].slice(0, 60)
    }));

    pushNotification({
      title: "Position Recorded",
      body: `${position.side} - ${position.match}\n${position.amount} OKB\nTx: ${position.txHash.slice(0, 6)}...${position.txHash.slice(-4)}`,
      kind: "position",
      activity: {
        label: "Position Recorded",
        detail: `${profile.username} ${position.side === "FOLLOW" ? "followed" : "faded"} ${position.match} - ${position.amount} OKB`,
        kind: "position"
      }
    });
  }

  function markAllNotificationsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  const value = useMemo(
    () => ({
      profile,
      notifications,
      activity,
      toasts,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      updateProfile,
      mintPredictionPass,
      recordPosition,
      pushNotification,
      markAllNotificationsRead,
      dismissToast
    }),
    [activity, notifications, profile, toasts]
  );

  return <MatchMindUserContext.Provider value={value}>{children}</MatchMindUserContext.Provider>;
}

export function useMatchMindUser() {
  const value = useContext(MatchMindUserContext);
  if (!value) throw new Error("useMatchMindUser must be used inside MatchMindUserProvider");
  return value;
}
