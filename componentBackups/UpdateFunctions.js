// Handle Update (remove caches)
// eslint-disable-next-line no-restricted-globals
self.addEventListener('activate', (event) => {
  // delete any unexpected caches
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((key) => key !== CACHE_NAME))
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            console.log(`Deleting cache ${key}`)
            return caches.delete(key)
          })
        )
      )
  )
})

// eslint-disable-next-line no-restricted-globals
self.addEventListener('install', (event) => {
  event.waitUntil(async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(PRECACHE_ASSETS)
  })
  // eslint-disable-next-line no-restricted-globals
  self.skipWaiting()
})

// eslint-disable-next-line no-restricted-globals
self.addEventListener('fetch', (event) => {
  event.respondWith(async () => {
    const cache = await caches.open(CACHE_NAME)
    const cacheResponse = await cache.match(event.request)

    if (cacheResponse !== undefined) {
      return cacheResponse
    } else {
      return fetch(event.request)
    }
  })
})
