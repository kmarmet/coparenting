import React from 'react'
import ReactDOM from 'react-dom/client'
import '../src/styles/bundle.scss'
import App from './App'
import { ErrorBoundary } from 'react-error-boundary'
import { getAuth, signOut } from 'firebase/auth'
import AlertManager from './managers/alertManager'

if ('serviceWorker' in navigator) {
  function handleConnection() {
    if (navigator.onLine) {
      isReachable(getServerUrl()).then(function (online) {
        if (online) {
          // handle online status
          console.log('online')
        } else {
          console.log('no connectivity')
        }
      })
    } else {
      // handle offline status
      console.log('offline')
      AlertManager.throwError('App is Offline', 'Please find an area with a stronger network connection and reopen the app.')
    }
  }
  window.addEventListener('offline', handleConnection)
  navigator.serviceWorker

    .register(`${process.env.PUBLIC_URL}/OneSignalSDKWorker.js`)

    .then((registration) => {
      // console.log(registration);

      console.log('[SW] service Worker is registered at', registration.scope)
    })

    .catch((err) => {
      console.error('[SW] service Worker registration failed:', err)
    })

  // Update content
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().then(() => {
      // console.log('PWA Updated')
    })
  })
  function isReachable(url) {
    /**
     * Note: fetch() still "succeeds" for 404s on subdirectories,
     * which is ok when only testing for domain reachability.
     *
     * Example:
     *   https://google.com/noexist does not throw
     *   https://noexist.com/noexist does throw
     */
    return fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(function (resp) {
        return resp && (resp.ok || resp.type === 'opaque')
      })
      .catch(function (err) {
        console.warn('[conn test failure]:', err)
      })
  }

  function getServerUrl() {
    return document.getElementById('serverUrl').value || window.location.origin
  }
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener('install', (event) => {
    // eslint-disable-next-line no-restricted-globals
    self.skipWaiting()
  })

  // function forceSWupdate() {
  //   navigator.serviceWorker.getRegistrations().then(function (registrations) {
  //     for (let registration of registrations) {
  //       console.log(registration)
  //       registration.update().then((r) => {
  //         console.log('App Updated')
  //       })
  //     }
  //   })
  // }
  // forceSWupdate()
}
const logout = () => {
  localStorage.removeItem('rememberKey')
  const auth = getAuth()
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log('User signed out')
      window.location.reload()
    })
    .catch((error) => {
      // An error happened.
    })
}

const root = ReactDOM.createRoot(document.getElementById('root'))
// Add Logging in Boundary
// Add support email in text
root.render(
  <ErrorBoundary
    fallback={
      <div className="active error-boundary" id="error-screen">
        <p id="screen-title" className="mb-15">
          Oops! It looks like we ran into an issue. But we can help!
        </p>
        <div id="text-container" className="mb-20">
          <div className="flex support-email">
            <p>Feel free to send us an email to get help with this issue, at any time @ </p>
            <a href="mailto:support@peaceful-coparenting.app">support@peaceful-coparenting.app</a>
          </div>
        </div>

        <div id="text-container">
          <p className="heading mb-5">Try this first</p>
        </div>

        {/* REFRESH THE APP */}
        <div id="text-container">
          <div className="flex mb-5" id="steps">
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
          <p className="mt-15">
            <b>If that did not resolve the issue, please follow the steps below.</b>
          </p>
        </div>

        {/* CLEAR CACHE - IOS */}
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">Clear the Cache - iOS</p>

          <div className="flex mb-5" id="steps">
            <span className="step-number">1.</span>
            <p>
              Open Settings
              <img className="settings-icon ml-5" src="https://img.icons8.com/?size=100&id=flyFkP7sj07V&format=png&color=000000" alt="" />
            </p>
          </div>
          <div className="flex mb-5" id="steps">
            <span className="step-number">2.</span>
            <p>
              Search for and tap on Safari <img src={require('../src/img/safari.png')} alt="Safari" id="safari-icon" />
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
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">Force Close App - iOS</p>

          <div className="flex" id="steps wrap">
            <p>
              From the <span className="emphasize">Home Screen</span>, swipe up from the bottom of the screen and pause in the middle of the screen
            </p>
          </div>
        </div>

        {/* CLEAR CACHE - ANDROID */}
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">Clear the Cache - Android</p>

          <div className="flex mb-5" id="steps">
            <span className="step-number">1.</span>
            <p>Open the Chrome browser</p>
          </div>
          <div className="flex mb-5" id="steps">
            <span className="step-number">2.</span>
            <p>
              Tap more <span className="material-icons">more_vert</span>
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
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">Force Close App - Android</p>

          <div className="flex mb-10" id="steps">
            <span className="step-number">1.</span>
            <p>Tap or long press the Overview button in the lower-left or lower-right corner of your screen</p>
          </div>
          <div className="flex" id="steps">
            <span className="step-number">2.</span>
            <p>You should see your recently opened apps. Swipe up an app to close it</p>
          </div>
        </div>

        {/* UNINSTALL/REINSTALL */}
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">If the issue continues...</p>

          <div className="flex mb-10" id="steps">
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