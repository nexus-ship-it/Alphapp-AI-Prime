

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useToastContext } from './ToastContext';
import { fetchAssetManifest, AssetManifest } from '../services/integrityService';
import { useI18n } from './I18nContext';
import { TranslationKey } from '../i18n/translations';

interface IntegrityVerifierContextType {
  isReloading: boolean;
  needsReload: boolean;
  triggerReload: () => void;
}

const IntegrityVerifierContext = createContext<IntegrityVerifierContextType | undefined>(undefined);

const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RELOAD_DELAY_MS = 5000; // 5 seconds

export const IntegrityVerifierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useI18n();
  const { addToast } = useToastContext();
  const [currentManifest, setCurrentManifest] = useState<AssetManifest | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const reloadTimeoutRef = useRef<number | null>(null);

  // FIX: Removed the unused 'arg' parameter from triggerReload
  const triggerReload = useCallback(() => {
    if (isReloading) return;

    setIsReloading(true);
    addToast({
      type: 'info',
      title: t('vir.newVersionTitle' as TranslationKey),
      message: t('vir.newVersionMessage' as TranslationKey),
      duration: RELOAD_DELAY_MS,
    });

    reloadTimeoutRef.current = window.setTimeout(() => {
      window.location.reload(); // Force reload from server, ignoring cache
    }, RELOAD_DELAY_MS);
  }, [addToast, isReloading, t]);

  const checkIntegrity = useCallback(async () => {
    try {
      const latestManifest = await fetchAssetManifest();
      if (!currentManifest) {
        // First load, store current manifest
        setCurrentManifest(latestManifest);
      } else {
        // Compare with stored manifest
        if (JSON.stringify(latestManifest) !== JSON.stringify(currentManifest)) {
          console.log("New version detected, triggering reload...");
          setNeedsReload(true); // Set flag, then trigger reload
          triggerReload();
        }
      }
    } catch (error) {
      console.error("Failed to check app integrity:", error);
      // Optionally show a non-critical toast here
    }
  }, [currentManifest, triggerReload]);

  useEffect(() => {
    // Initial check and start polling
    checkIntegrity();
    const intervalId = window.setInterval(checkIntegrity, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, [checkIntegrity]);

  const value = { isReloading, needsReload, triggerReload };

  return (
    <IntegrityVerifierContext.Provider value={value}>
      {children}
    </IntegrityVerifierContext.Provider>
  );
};

export const useIntegrityVerifier = () => {
  const context = useContext(IntegrityVerifierContext);
  if (context === undefined) {
    throw new Error('useIntegrityVerifier must be used within an IntegrityVerifierProvider');
  }
  return context;
};