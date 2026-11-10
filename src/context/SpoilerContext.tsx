import React, { createContext, useContext, useState, useEffect } from 'react';

interface SpoilerContextType {
  spoilersEnabled: boolean;
  toggleSpoilers: () => void;
  maskPlayerName: (name: string, isSpoiler: boolean) => string;
}

const SpoilerContext = createContext<SpoilerContextType | undefined>(undefined);

export const SpoilerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spoilersEnabled, setSpoilersEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bl_spoilers_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bl_spoilers_enabled', JSON.stringify(spoilersEnabled));
    } catch {
      // ignore
    }
  }, [spoilersEnabled]);

  const toggleSpoilers = () => {
    setSpoilersEnabled((prev) => !prev);
  };

  const maskPlayerName = (name: string, isSpoiler: boolean) => {
    if (!spoilersEnabled && isSpoiler) {
      return '??? [SPOILER MASKED]';
    }
    return name;
  };

  return (
    <SpoilerContext.Provider value={{ spoilersEnabled, toggleSpoilers, maskPlayerName }}>
      {children}
    </SpoilerContext.Provider>
  );
};

export const useSpoilers = (): SpoilerContextType => {
  const context = useContext(SpoilerContext);
  if (!context) {
    throw new Error('useSpoilers must be used within a SpoilerProvider');
  }
  return context;
};
