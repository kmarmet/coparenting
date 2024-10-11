import React from 'react'
import ReactDOM from 'react-dom/client'
import '../src/styles/bundle.scss'
import App from './App'
import { ErrorBoundary } from 'react-error-boundary'
import PopupCard from 'components/shared/popupCard'

if ('serviceWorker' in navigator) {
  const cacheAllowlist = ['v2']
  // Register PWA
  navigator.serviceWorker
    .register(`${process.env.PUBLIC_URL}/sw.js`)
    .then((registration) => {
      // console.log(registration);
      console.log('[SW] service Worker is registered at', registration.scope)
    })
    .catch((err) => {
      console.error('[SW] service Worker registration failed:', err)
    })
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener('install', (event) => {
    // eslint-disable-next-line no-restricted-globals
    self.skipWaiting()
  })
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keyList) =>
        Promise.all(
          keyList.map((key) => {
            if (!cacheAllowlist.includes(key)) {
              console.log('PWA Cache Cleared')
              return caches.delete(key)
            }
          })
        )
      )
    )
  })

  // Update content
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().then(() => {
      console.log('PWA Updated')
    })
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
const root = ReactDOM.createRoot(document.getElementById('root'))
// Add Logging in Boundary
// Add support email in text
root.render(
  <ErrorBoundary
    fallback={
      <PopupCard className="active error-boundary" title={'<span>Uh oh!</span>'} closeable={false} onClose={() => {}}>
        <p className="message mb-15">
          It looks like the app ran into an issue. <br /> Please <span className="emphasize">Clear the Cache</span> and then
          <span className="emphasize ml-5">Force Close</span> the application and reopen it.
        </p>
        <div id="text-container" className="mb-20">
          <div className="flex">
            <p>If the steps below do not work, please email us at </p>
            <a href="mailto:support@peaceful-coparenting.app">support@peaceful-coparenting.app</a>
          </div>
        </div>
        <hr />
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">How to Clear the Cache - iOS</p>

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
              Tap more <span className="material-icons">more_vert</span>
            </p>
          </div>
          <div className="flex" id="steps">
            <span className="step-number">3.</span>
            <p>
              Tap <span className="emphasize">Clear History and Website Data</span>
            </p>
          </div>
        </div>
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">How to Force Close App - iOS</p>

          <div className="flex" id="steps wrap">
            <p>
              From the <span className="emphasize">Home Screen</span>, swipe up from the bottom of the screen and pause in the middle of the screen
            </p>
          </div>
        </div>
        <hr />
        <div id="text-container" className="mb-15">
          <p className="heading mb-5">How to Clear the Cache - Android</p>

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

        <div id="text-container" className="mb-15">
          <p className="heading mb-5">How to Force Close App - Android</p>

          <div className="flex mb-10" id="steps">
            <span className="step-number">1.</span>
            <p>Tap or long press the Overview button in the lower-left or lower-right corner of your screen</p>
          </div>
          <div className="flex" id="steps">
            <span className="step-number">2.</span>
            <p>You should see your recently opened apps. Swipe up an app to close it</p>
          </div>
        </div>

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
      </PopupCard>
    }>
    <App />
  </ErrorBoundary>
)
