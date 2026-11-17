"use client";

import { createContext, useContext } from "react";

type GuestDirectoryNavigation = {
  navigate: (href: string, scroll?: boolean) => void;
  pending: boolean;
};

export const GuestDirectoryNavigationContext =
  createContext<GuestDirectoryNavigation | null>(null);

export function useGuestDirectoryNavigation() {
  const navigation = useContext(GuestDirectoryNavigationContext);
  if (!navigation) {
    throw new Error(
      "Guest directory navigation must be used inside GuestDirectoryFilters.",
    );
  }
  return navigation;
}
