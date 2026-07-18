import { useCallback, useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useDispatch } from 'react-redux';
import { authApi } from '../store/services/authApi';
import {
  getMemberQueueSummary,
  syncMemberCreations,
  type SyncResult,
} from '../offline/memberQueue';
import {
  getPresenceQueueSummary,
  syncPresenceMarks,
  type PresenceSyncResult,
} from '../offline/presenceQueue';

let hasRegisteredServiceWorker = false;
type UpdateServiceWorker = ReturnType<typeof registerSW>;

export default function OfflineStatus() {
  const dispatch = useDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(!navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summary, setSummary] = useState({ pending: 0, failed: 0 });
  const [presenceSummary, setPresenceSummary] = useState({ pending: 0, failed: 0 });
  const [syncedNotice, setSyncedNotice] = useState(0);
  const [discardedMemberNotice, setDiscardedMemberNotice] = useState(0);
  const [presenceSyncedNotice, setPresenceSyncedNotice] = useState(0);
  const [updateSW, setUpdateSW] = useState<UpdateServiceWorker | null>(null);

  const refreshSummary = useCallback(async () => {
    const [memberQueue, presenceQueue] = await Promise.all([
      getMemberQueueSummary(),
      getPresenceQueueSummary(),
    ]);
    setSummary(memberQueue);
    setPresenceSummary(presenceQueue);
  }, []);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const [memberResult, presenceResult] = await Promise.all([
        syncMemberCreations(),
        syncPresenceMarks(),
      ]);
      setSummary({ pending: memberResult.pending, failed: memberResult.failed });
      setPresenceSummary({ pending: presenceResult.pending, failed: presenceResult.failed });
      if (memberResult.synced > 0) {
        setSyncedNotice(memberResult.synced);
        dispatch(authApi.util.invalidateTags(['User']));
      }
      if (memberResult.discarded > 0) {
        setDiscardedMemberNotice(memberResult.discarded);
        dispatch(authApi.util.invalidateTags(['User']));
      }
      if (presenceResult.synced > 0 || presenceResult.alreadyRecorded > 0) {
        setPresenceSyncedNotice(presenceResult.synced + presenceResult.alreadyRecorded);
        dispatch(authApi.util.invalidateTags(['Presence']));
      }
    } finally {
      setIsSyncing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void refreshSummary();

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
      void synchronize();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };
    const handleQueueChange = (event: Event) => {
      const detail = (event as CustomEvent<Partial<SyncResult>>).detail;
      if (detail?.synced) setSyncedNotice(detail.synced);
      if (detail?.discarded) setDiscardedMemberNotice(detail.discarded);
      void refreshSummary();
    };
    const handlePresenceQueueChange = (event: Event) => {
      const detail = (event as CustomEvent<Partial<PresenceSyncResult>>).detail;
      const completed = (detail?.synced || 0) + (detail?.alreadyRecorded || 0);
      if (completed) setPresenceSyncedNotice(completed);
      void refreshSummary();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ecclesys:member-queue-change', handleQueueChange);
    window.addEventListener('ecclesys:presence-queue-change', handlePresenceQueueChange);
    void synchronize();

    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      // Remove workers left by a previous devOptions-enabled session. Production
      // registrations are unaffected because this branch is compiled for DEV only.
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(
          registrations
            .filter((registration) => {
              const worker = registration.active || registration.waiting || registration.installing;
              return worker?.scriptURL.includes('dev-sw.js');
            })
            .map((registration) => registration.unregister()),
        ),
      );
    } else if (!hasRegisteredServiceWorker) {
      hasRegisteredServiceWorker = true;
      const updater = registerSW({
        immediate: true,
        onOfflineReady: () => setOfflineReady(true),
        onNeedRefresh: () => setNeedsRefresh(true),
        onRegisterError: (error) => console.error('PWA registration error:', error),
      });
      setUpdateSW(() => updater);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ecclesys:member-queue-change', handleQueueChange);
      window.removeEventListener('ecclesys:presence-queue-change', handlePresenceQueueChange);
    };
  }, [refreshSummary, synchronize]);

  useEffect(() => {
    if (isOnline || !showOfflineNotice) return;
    const timeout = window.setTimeout(() => setShowOfflineNotice(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [isOnline, showOfflineNotice]);

  useEffect(() => {
    if (!syncedNotice) return;
    const timeout = window.setTimeout(() => setSyncedNotice(0), 5000);
    return () => window.clearTimeout(timeout);
  }, [syncedNotice]);

  useEffect(() => {
    if (!discardedMemberNotice) return;
    const timeout = window.setTimeout(() => setDiscardedMemberNotice(0), 7000);
    return () => window.clearTimeout(timeout);
  }, [discardedMemberNotice]);

  useEffect(() => {
    if (!presenceSyncedNotice) return;
    const timeout = window.setTimeout(() => setPresenceSyncedNotice(0), 5000);
    return () => window.clearTimeout(timeout);
  }, [presenceSyncedNotice]);

  useEffect(() => {
    if (!offlineReady) return;
    const timeout = window.setTimeout(() => setOfflineReady(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [offlineReady]);

  const hasQueue = summary.pending + summary.failed > 0;
  const hasPresenceQueue = presenceSummary.pending + presenceSummary.failed > 0;
  if (isOnline && !hasQueue && !hasPresenceQueue && !offlineReady && !needsRefresh && !syncedNotice && !discardedMemberNotice && !presenceSyncedNotice) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {!isOnline && showOfflineNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
          <p className="font-semibold">Mode hors connexion</p>
          <p>Les données déjà consultées restent disponibles. Les membres et présences seront synchronisés plus tard.</p>
        </div>
      )}

      {hasPresenceQueue && (
        <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {isSyncing ? 'Synchronisation en cours…' : `${presenceSummary.pending} présence(s) en attente`}
              </p>
              {presenceSummary.failed > 0 && <p className="text-red-600">{presenceSummary.failed} présence(s) à vérifier.</p>}
            </div>
            {isOnline && !isSyncing && (
              <button onClick={() => void synchronize()} className="rounded-lg bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800">
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}

      {hasQueue && (
        <div className="rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {isSyncing ? 'Synchronisation en cours…' : `${summary.pending} membre(s) en attente`}
              </p>
              {summary.failed > 0 && <p className="text-red-600">{summary.failed} enregistrement(s) à vérifier.</p>}
            </div>
            {isOnline && !isSyncing && (
              <button onClick={() => void synchronize()} className="rounded-lg bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}

      {offlineReady && (
        <div className="rounded-xl bg-teal-800 px-4 py-3 text-sm text-white shadow-lg">
          Ecclesys est maintenant prêt à fonctionner hors connexion.
        </div>
      )}

      {syncedNotice > 0 && (
        <div className="rounded-xl bg-emerald-700 px-4 py-3 text-sm text-white shadow-lg">
          {syncedNotice} membre(s) synchronisé(s) avec succès.
        </div>
      )}

      {discardedMemberNotice > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
          {discardedMemberNotice} membre(s) retiré(s) de la file : l’adresse email ou le NIF existe déjà.
        </div>
      )}

      {presenceSyncedNotice > 0 && (
        <div className="rounded-xl bg-emerald-700 px-4 py-3 text-sm text-white shadow-lg">
          {presenceSyncedNotice} présence(s) synchronisée(s) avec succès.
        </div>
      )}

      {needsRefresh && (
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <span>Une nouvelle version est disponible.</span>
            <button onClick={() => void updateSW?.(true)} className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-900">
              Actualiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
