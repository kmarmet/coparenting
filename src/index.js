import {getAuth, signOut} from "firebase/auth"
import React from "react"
import "./styles/bundle.scss"
import {createRoot} from "react-dom/client"
import {FaSadTear} from "react-icons/fa"
import {IoEllipsisVerticalSharp} from "react-icons/io5"
import App from "./App"
import ErrorBoundary from "./components/errorBoundary"
import AppUpdateOverlay from "./components/shared/appUpdateOverlay"
import Spacer from "./components/shared/spacer"
import AlertManager from "./managers/alertManager"
import AppManager from "./managers/appManager"

// CACHING
const CACHE_KEY = "v1.0.30"
const FILES_TO_CACHE = ["/", "/index.html", "/src/index.js", "/src/App.js", "/src/styles/bundle.css"]

const logout = () => {
      localStorage.removeItem("rememberKey")
      const auth = getAuth()
      signOut(auth)
            .then(() => {
                  // Sign-out successful.
                  console.log("User signed out")
                  window.location.reload()
            })
            .catch((holidayRetrievalError) => {
                  // An holidayRetrievalError happened.
            })
}

if ("serviceWorker" in navigator) {
      function IsReachable(url) {
            return fetch(url, {method: "HEAD", mode: "no-cors"})
                  .then(function (resp) {
                        return resp && (resp.ok || resp.type === "opaque")
                  })
                  .catch(function (err) {
                        console.warn("[conn test failure]:", err)
                  })
      }

      function GetServerUrl() {
            return document.getElementById("serverUrl").value || window.location.origin
      }

      function HandleConnection() {
            if (navigator.onLine) {
                  IsReachable(GetServerUrl()).then(function (online) {
                        if (online) {
                              // handle online status
                              console.log("online")
                        } else {
                              console.log("no connectivity")
                        }
                  })
            } else {
                  // handle offline status
                  console.log("offline")
                  AlertManager.throwError("No Internet", "Please find an area with a stronger network connection and reopen the app.")
            }
      }

      // Check connection
      window.addEventListener("offline", HandleConnection)

      // Get public url
      const publicUrl = window.location.hostname.indexOf("localhost") > -1 ? "http://localhost:1234" : process.env.REACT_APP_PUBLIC_URL

      const renderRoot = (updateIsAvailable = false) => {
            const root = createRoot(document.getElementById("root"))
            if (updateIsAvailable === false) {
                  root.render(
                        <ErrorBoundary
                              fallback={
                                    <div className="active holidayRetrievalError-boundary" id="holidayRetrievalError-screen">
                                          <p id="holidayRetrievalError-screen-title">
                                                Oops! Something went wrong <FaSadTear />
                                          </p>
                                          <Spacer height={5} />
                                          <div id="text-container">
                                                <div className="flex support-email">
                                                      <p>Feel free to send us an email at any time to get help with this issue at </p>
                                                      <a href="mailto:support@peaceful-coparenting.app">support@peaceful-coparenting.app</a>
                                                </div>
                                          </div>

                                          {/* REFRESH THE APP */}
                                          <div id="text-container">
                                                <p className="heading">Try this first</p>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <button
                                                            className="link"
                                                            onClick={() => {
                                                                  logout()
                                                                  setTimeout(() => {
                                                                        window.location.reload()
                                                                  }, 300)
                                                            }}>
                                                            Refresh the App
                                                      </button>
                                                </div>
                                                <p>
                                                      <b>If that did not resolve the issue, please follow the steps below.</b>
                                                </p>
                                          </div>

                                          {/* CLEAR CACHE - IOS */}
                                          <div id="text-container">
                                                <p className="heading">Clear the Cache - iOS</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>
                                                            Open Settings
                                                            <img
                                                                  className="settings-icon ml-5"
                                                                  src="https://img.icons8.com/?size=100&id=flyFkP7sj07V&format=png&color=000000"
                                                                  alt=""
                                                            />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>
                                                            Search for and tap on Safari{" "}
                                                            <img
                                                                  alt="safari-icon"
                                                                  id={"safari-icon"}
                                                                  src={
                                                                        "https://firebasestorage.googleapis.com/v0/b/peaceful-coparenting.appspot.com/o/appImages%2Fmisc%2Fsafari.png?alt=media&token=aa3e9550-3beb-4d44-862d-79d90ab45338"
                                                                  }
                                                            />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">3.</span>
                                                      <p>
                                                            Tap <span className="emphasize">Clear History and Website Data</span>
                                                      </p>
                                                </div>
                                          </div>

                                          {/* FORCE CLOSE - IOS */}
                                          <div id="text-container">
                                                <p className="heading">Force Close App - iOS</p>

                                                <div className="flex" id="steps wrap">
                                                      <p>
                                                            From the <span className="emphasize">Home Screen</span>, swipe up from the bottom of the
                                                            screen and pause in the middle of the screen
                                                      </p>
                                                </div>
                                          </div>

                                          {/* CLEAR CACHE - ANDROID */}
                                          <div id="text-container">
                                                <p className="heading">Clear the Cache - Android</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>Open the Chrome browser</p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>
                                                            Tap more <IoEllipsisVerticalSharp />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">3.</span>
                                                      <p>
                                                            Tap <span className="emphasize">Delete browsing data</span>
                                                      </p>
                                                </div>
                                          </div>

                                          {/* FORCE CLOSE - ANDROID */}
                                          <div id="text-container">
                                                <p className="heading">Force Close App - Android</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>
                                                            Tap or long press the Overview button in the lower-left or lower-right corner of your
                                                            screen
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>You should see your recently opened apps. Swipe up an app to close it</p>
                                                </div>
                                          </div>

                                          {/* UNINSTALL/REINSTALL */}
                                          <div id="text-container">
                                                <p className="heading">If the issue continues...</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>Uninstall the app</p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>Reinstall the app</p>
                                                </div>
                                          </div>
                                    </div>
                              }>
                              <App />
                        </ErrorBoundary>
                  )
            } else {
                  root.render(
                        <ErrorBoundary
                              fallback={
                                    <div className="active holidayRetrievalError-boundary" id="holidayRetrievalError-screen">
                                          <p id="holidayRetrievalError-screen-title">
                                                Oops! Something went wrong <FaSadTear />
                                          </p>
                                          <Spacer height={5} />
                                          <div id="text-container">
                                                <div className="flex support-email">
                                                      <p>Feel free to send us an email at any time to get help with this issue at </p>
                                                      <a href="mailto:support@peaceful-coparenting.app">support@peaceful-coparenting.app</a>
                                                </div>
                                          </div>

                                          {/* REFRESH THE APP */}
                                          <div id="text-container">
                                                <p className="heading">Try this first</p>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <button
                                                            className="link"
                                                            onClick={() => {
                                                                  logout()
                                                                  setTimeout(() => {
                                                                        window.location.reload()
                                                                  }, 300)
                                                            }}>
                                                            Refresh the App
                                                      </button>
                                                </div>
                                                <p>
                                                      <b>If that did not resolve the issue, please follow the steps below.</b>
                                                </p>
                                          </div>

                                          {/* CLEAR CACHE - IOS */}
                                          <div id="text-container">
                                                <p className="heading">Clear the Cache - iOS</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>
                                                            Open Settings
                                                            <img
                                                                  className="settings-icon ml-5"
                                                                  src="https://img.icons8.com/?size=100&id=flyFkP7sj07V&format=png&color=000000"
                                                                  alt=""
                                                            />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>
                                                            Search for and tap on Safari{" "}
                                                            <img
                                                                  alt="safari-icon"
                                                                  id={"safari-icon"}
                                                                  src={
                                                                        "https://firebasestorage.googleapis.com/v0/b/peaceful-coparenting.appspot.com/o/appImages%2Fmisc%2Fsafari.png?alt=media&token=aa3e9550-3beb-4d44-862d-79d90ab45338"
                                                                  }
                                                            />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">3.</span>
                                                      <p>
                                                            Tap <span className="emphasize">Clear History and Website Data</span>
                                                      </p>
                                                </div>
                                          </div>

                                          {/* FORCE CLOSE - IOS */}
                                          <div id="text-container">
                                                <p className="heading">Force Close App - iOS</p>

                                                <div className="flex" id="steps wrap">
                                                      <p>
                                                            From the <span className="emphasize">Home Screen</span>, swipe up from the bottom of the
                                                            screen and pause in the middle of the screen
                                                      </p>
                                                </div>
                                          </div>

                                          {/* CLEAR CACHE - ANDROID */}
                                          <div id="text-container">
                                                <p className="heading">Clear the Cache - Android</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>Open the Chrome browser</p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>
                                                            Tap more <IoEllipsisVerticalSharp />
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">3.</span>
                                                      <p>
                                                            Tap <span className="emphasize">Delete browsing data</span>
                                                      </p>
                                                </div>
                                          </div>

                                          {/* FORCE CLOSE - ANDROID */}
                                          <div id="text-container">
                                                <p className="heading">Force Close App - Android</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>
                                                            Tap or long press the Overview button in the lower-left or lower-right corner of your
                                                            screen
                                                      </p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>You should see your recently opened apps. Swipe up an app to close it</p>
                                                </div>
                                          </div>

                                          {/* UNINSTALL/REINSTALL */}
                                          <div id="text-container">
                                                <p className="heading">If the issue continues...</p>

                                                <div className="flex" id="steps">
                                                      <span className="step-number">1.</span>
                                                      <p>Uninstall the app</p>
                                                </div>
                                                <div className="flex" id="steps">
                                                      <span className="step-number">2.</span>
                                                      <p>Reinstall the app</p>
                                                </div>
                                          </div>
                                    </div>
                              }>
                              <AppUpdateOverlay />
                        </ErrorBoundary>
                  )
            }
      }

      // Register the service worker
      if (!AppManager.IsDevMode()) {
            const previousCacheKey = localStorage.getItem("sw-cache-key")
            navigator.serviceWorker
                  .register(`${publicUrl}/OneSignalSDKWorker.js`)
                  .then((registration) => {
                        registration.onupdatefound = () => {
                              const newSW = registration.installing
                              newSW.onstatechange = () => {
                                    localStorage.setItem("sw-cache-key", CACHE_KEY)
                                    newSW.postMessage({action: "skipWaiting"})
                                    // UPDATE AVAILABLE
                                    if (newSW.state === "installed" && navigator.serviceWorker.controller && previousCacheKey !== CACHE_KEY) {
                                          console.log("Update available!")
                                          newSW.postMessage({action: "skipWaiting"})
                                          localStorage.setItem("sw-cache-key", CACHE_KEY)
                                          renderRoot(true)
                                    } else {
                                          renderRoot(false)
                                    }
                              }
                        }

                        console.log("[SW] service Worker is registered at", registration.scope)
                  })
                  .catch((err) => {
                        console.holidayRetrievalError("[SW] service Worker registration failed:", err)
                  })
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                  window.location.reload()
            })
            // Install
            self.addEventListener("install", (event) => {
                  console.log("[SW] Install")
                  event.waitUntil(
                        caches.open(CACHE_KEY).then((cache) => {
                              return cache.addAll(FILES_TO_CACHE)
                        })
                  )
                  self.skipWaiting()
            })

            // Activate
            self.addEventListener("activate", (event) => {
                  console.log("[SW] Activate")
                  event.waitUntil(
                        caches.keys().then((keyList) =>
                              Promise.all(
                                    keyList.map((key) => {
                                          if (key !== CACHE_KEY) return caches.delete(key)
                                    })
                              )
                        )
                  )
                  self.clients.claim()
            })

            // Fetch: Serve from cache, fallback to network
            self.addEventListener("fetch", (event) => {
                  event.respondWith(
                        caches.match(event.request).then((cachedResponse) => {
                              return cachedResponse || fetch(event.request)
                        })
                  )
            })

            // Message
            self.addEventListener("message", (event) => {
                  console.log("[SW] message")
                  if (event.data?.action === "skipWaiting") {
                        self.skipWaiting()
                  }
            })
      }

      renderRoot()
}

// const root = ReactDOM.createRoot(document.getElementById('root'))
// Add Logging in Boundary
// Add support email in text
// const container = document.getElementById('root')
// const root = createRoot(container, {
//   // Callback called when an holidayRetrievalError is thrown and not caught by an ErrorBoundary.
//   onUncaughtError: Sentry.reactErrorHandler((holidayRetrievalError, errorInfo) => {
//     console.warn('Uncaught holidayRetrievalError', holidayRetrievalError, errorInfo.componentStack)
//   }),
//   // Callback called when React catches an holidayRetrievalError in an ErrorBoundary.
//   onCaughtError: Sentry.reactErrorHandler(),
//   // Callback called when React automatically recovers from errors.
//   onRecoverableError: Sentry.reactErrorHandler(),
// })