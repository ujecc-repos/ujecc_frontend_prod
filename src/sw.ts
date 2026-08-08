/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

interface PrecacheEntry {
  integrity?: string;
  revision?: string | null;
  url: string;
}

const API_CACHE = 'ecclesys-api-v1';

// A reachable local backend can still fail when its remote database is offline.
// Tell NetworkFirst to treat HTTP errors as network failures and use cached data.
const fallbackToCacheOnHttpErrorPlugin = {
  async fetchDidSucceed({ response }: { response: Response }): Promise<Response> {
    if (!response.ok) {
      throw new Error(`API unavailable (${response.status})`);
    }
    return response;
  },
};

const authenticatedCacheKeyPlugin = {
  async cacheKeyWillBeUsed({ request }: { request: Request }): Promise<Request> {
    const authorization = request.headers.get('authorization');
    if (!authorization) return request;

    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(authorization),
    );
    const accountKey = Array.from(new Uint8Array(digest).slice(0, 12))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const cacheUrl = new URL(request.url);
    cacheUrl.searchParams.set('__ecclesys_account', accountKey);

    return new Request(cacheUrl.toString(), request);
  },
};

const createApiPlugins = () => [
  authenticatedCacheKeyPlugin,
  fallbackToCacheOnHttpErrorPlugin,
  new CacheableResponsePlugin({ statuses: [0, 200] }),
  new ExpirationPlugin({
    maxEntries: 300,
    maxAgeSeconds: 7 * 24 * 60 * 60,
    purgeOnQuotaError: true,
  }),
];

const apiNetworkFirst = new NetworkFirst({
  cacheName: API_CACHE,
  networkTimeoutSeconds: 6,
  plugins: createApiPlugins(),
});

const apiCacheFirst = new CacheFirst({
  cacheName: API_CACHE,
  plugins: createApiPlugins(),
});

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
);

// All application data is read-only offline. Only successful GET responses are cached.
registerRoute(
  ({ request, url }) => request.method === 'GET'
    && url.pathname.startsWith('/api/')
    && !url.pathname.includes('/reports/export'),
  ({ event, request }) => {
    const strategy = self.navigator.onLine ? apiNetworkFirst : apiCacheFirst;
    return strategy.handle({ event, request });
  },
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'ecclesys-images-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'font' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'ecclesys-static-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
