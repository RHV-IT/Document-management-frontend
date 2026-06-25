'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Profile {
  profileId: string;
  department: string;
  confidentialityLevels: string[];
  isPrimary?: boolean;
  status?: string;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  switchingProfile: Profile | null;
  setProfiles: (profiles: Profile[]) => void;
  setActiveProfile: (profile: Profile | null) => void;
  setSwitchingProfile: (profile: Profile | null) => void;
  clearProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY_PROFILES = 'dms_profiles';
const STORAGE_KEY_ACTIVE_PROFILE = 'dms_active_profile';

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function removeFromStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfilesState] = useState<Profile[]>(() => loadFromStorage<Profile[]>(STORAGE_KEY_PROFILES) || []);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(() => loadFromStorage<Profile>(STORAGE_KEY_ACTIVE_PROFILE));
  const [switchingProfile, setSwitchingProfile] = useState<Profile | null>(null);

  const setProfiles = useCallback((newProfiles: Profile[]) => {
    setProfilesState(newProfiles);
    saveToStorage(STORAGE_KEY_PROFILES, newProfiles);
  }, []);

  const setActiveProfile = useCallback((profile: Profile | null) => {
    setActiveProfileState(profile);
    if (profile) {
      saveToStorage(STORAGE_KEY_ACTIVE_PROFILE, profile);
    } else {
      removeFromStorage(STORAGE_KEY_ACTIVE_PROFILE);
    }
  }, []);

  const clearProfiles = useCallback(() => {
    setProfilesState([]);
    setActiveProfileState(null);
    setSwitchingProfile(null);
    removeFromStorage(STORAGE_KEY_PROFILES);
    removeFromStorage(STORAGE_KEY_ACTIVE_PROFILE);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearProfiles();
    };
    window.addEventListener('auth:session-expired', handleLogout);
    return () => window.removeEventListener('auth:session-expired', handleLogout);
  }, [clearProfiles]);

  const value: ProfileContextType = {
    profiles,
    activeProfile,
    switchingProfile,
    setProfiles,
    setActiveProfile,
    setSwitchingProfile,
    clearProfiles,
  };

  return React.createElement(ProfileContext.Provider, { value }, children);
}

export function useProfileStore(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileStore must be used within a ProfileProvider');
  }
  return context;
}
