// Path: src\App.js
import {LocalizationProvider} from '@mui/x-date-pickers-pro/LocalizationProvider'
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment'
import React, {useEffect, useState} from 'react'
import globalState from '/src/context.js'
// Screens
import emailjs from '@emailjs/browser'
import {LicenseInfo} from '@mui/x-license'
import {initializeApp} from 'firebase/app'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import RequestParentAccess from './components/screens/auth/requestParentAccess'
import EditCalEvent from '/src/components/forms/editCalEvent.jsx'
import NewCalendarEvent from '/src/components/forms/newCalendarEvent.jsx'
import NewExpenseForm from '/src/components/forms/newExpenseForm.jsx'
import NewMemoryForm from '/src/components/forms/newMemoryForm.jsx'
import NewSwapRequest from '/src/components/forms/newSwapRequest.jsx'
import NewTransferChangeRequest from '/src/components/forms/newTransferRequest.jsx'
import FullMenu from '/src/components/fullMenu'
import Profile from '/src/components/screens/profile/profile.jsx'
import ResetPassword from '/src/components/screens/profile/resetPassword.jsx'
import Notifications from '/src/components/screens/notifications'
import AdminDashboard from '/src/components/screens/admin/adminDashboard'
import Login from '/src/components/screens/auth/login.jsx'
import Registration from '/src/components/screens/auth/registration.jsx'
import EventCalendar from '/src/components/screens/calendar/calendar.jsx'
import Chat from '/src/components/screens/chats/chat.jsx'
import Chats from '/src/components/screens/chats/chats.jsx'
import ChildInfo from '/src/components/screens/childInfo/childInfo.jsx'
import NewChildForm from '/src/components/screens/childInfo/newChildForm.jsx'
import ContactUs from '/src/components/screens/contactUs'
import Coparents from '/src/components/screens/coparents/coparents.jsx'
import NewCoparentForm from '/src/components/screens/coparents/newCoparentForm.jsx'
import DocsList from '/src/components/screens/documents/docsList.jsx'
import DocViewer from '/src/components/screens/documents/docViewer'
import NewDocument from '/src/components/screens/documents/newDocument.jsx'
import ExpenseTracker from '/src/components/screens/expenses/expenseTracker.jsx'
import Home from '/src/components/screens/home'
import InstallApp from '/src/components/screens/installApp.jsx'
import Memories from '/src/components/screens/memories.jsx'
import Vault from '/src/components/screens/vault.jsx'
import Settings from '/src/components/screens/settings/settings.jsx'
import SwapRequests from '/src/components/screens/swapRequests.jsx'
import TransferRequests from '/src/components/screens/transferRequests.jsx'
import Visitation from '/src/components/screens/visitation.jsx'
import BrandBar from '/src/components/shared/brandBar'
import Loading from '/src/components/shared/loading'
import DesktopLeftSidebar from '/src/components/shared/desktopLeftSidebar'
import CreationMenu from './components/shared/creationMenu'
import NewChat from './components/forms/newChat'
import SuccessAlert from './components/shared/successAlert'
import ScreenNames from '/src/constants/screenNames'
import StateObj from '/src/constants/stateObj'
import DB_UserScoped from '/src/database/db_userScoped'
import firebaseConfig from '/src/firebaseConfig.js'
import AppManager from '/src/managers/appManager.js'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import DB from './database/DB'
import NotificationManager from './managers/notificationManager'
import CreationForms from './constants/creationForms'
import Parents from './components/screens/parents/parents'
import Onboarding from './components/screens/onboarding'
import * as Sentry from '@sentry/react'

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const [state, setState] = useState(StateObj)
  const stateToUpdate = {state, setState}
  const {userIsLoggedIn, firebaseUser, setFirebaseUser} = state
  const myCanvas = document.createElement('canvas')

  const fullscreenScreens = [ScreenNames.login, ScreenNames.home, ScreenNames.registration]
  const screensToHideSidebar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.home]
  const screensToHideBrandbar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.home]

  // Init Sentry
  Sentry.init({
    dsn: 'https://15c40c1ea019fafd61508f12c6a03298@o4509223026163712.ingest.us.sentry.io/4509223028129792',
    integrations: [Sentry.browserTracingIntegration()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
  })

  // Init EmailJS
  emailjs.init({
    publicKey: process.env.REACT_EMAILJS_API_KEY,
    // Do not allow headless browsers
    blockHeadless: true,
    blockList: {
      // Block the suspended emails
      list: [],
      // The variable contains the email address
      // watchVariable: 'userEmail',
    },
    limitRate: {
      // Set the limit rate for the application
      id: 'app',
      // Allow 1 request per 10s
      throttle: 5000,
    },
  })

  // State to include in App.js
  const {isLoading, currentScreen, loadingText, currentUser, theme, authUser, creationFormToShow} = state

  // ON SCREEN CHANGE
  useEffect(() => {
    if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
      console.log(`Screen: ${currentScreen}`)
      window.navigator.clearAppBadge().then((r) => r)
    }
  }, [currentScreen])

  // ON PAGE LOAD
  useEffect(() => {
    // setState({...state, isLoading: true})
    // Error Boundary Test
    // throw new Error('Something went wrong')
    document.body.appendChild(myCanvas)

    // FIREBASE AUTH
    onAuthStateChanged(auth, async (user) => {
      // USER LOGGED IN FROM PERSISTED STATE
      // console.log(user)
      try {
        if (user) {
          const user = auth.currentUser
          await AppManager.clearAppBadge()
          const users = await DB.getTable(DB.tables.users)

          let notifications = []
          let currentUserFromDb
          currentUserFromDb = users?.find((u) => u?.email === user?.email)
          // User Exists
          if (Manager.isValid(currentUserFromDb)) {
            let screenToNavigateTo = ScreenNames.calendar
            const body = document.getElementById('external-overrides')
            const navbar = document.getElementById('navbar')

            if (Manager.isValid(navbar)) {
              navbar.setAttribute('account-type', currentUserFromDb?.accountType)
            }
            if (body) {
              body.classList.add(currentUserFromDb?.settings?.theme)
            }

            // Check if child profile and if parent access is granted
            if (currentUserFromDb?.accountType === 'child') {
              if (currentUserFromDb?.parentAccessGranted === false) {
                screenToNavigateTo = ScreenNames.requestParentAccess
              }
            } else {
              // Add location details to use record if they do not exist
              if (!Manager.isValid(currentUserFromDb?.location)) {
                AppManager.getLocationDetails().then(async (r) => {
                  await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUserFromDb?.key}/location`, r)
                })
              }

              // Delete expired items
              AppManager.deleteExpiredCalendarEvents(currentUserFromDb).then((r) => r)
              AppManager.deleteExpiredMemories(currentUserFromDb).then((r) => r)
            }

            // Get notifications
            if (!window.location.href.includes('localhost')) {
              NotificationManager.init(currentUserFromDb)
              notifications = await DB.getTable(`${DB.tables.notifications}/${currentUserFromDb?.key}`)
            }

            // Back to log in if user's email is not verified
            if (!user?.emailVerified) {
              screenToNavigateTo = ScreenNames.login
            }
            setState({
              ...state,
              authUser: user,
              currentUser: currentUserFromDb,
              currentScreen: screenToNavigateTo,
              userIsLoggedIn: true,
              loadingText: '',
              theme: currentUserFromDb?.settings?.theme,
              notificationCount: notifications?.length,
            })
          }
        } else {
          setState({
            ...state,
            authUser: user,
            currentScreen: ScreenNames.home,
            userIsLoggedIn: false,
            loadingText: '',
            isLoading: false,
          })
          console.log('user signed out or user does not exist')
        }
      } catch (error) {
        console.log(`Error: ${error} | Code File: App.js  | Function: useEffect |`)
      }
    })

    LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_KEY)
  }, [])

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className={`App ${theme}`} id="app-container">
        {/* LOADING */}
        <Loading isLoading={isLoading} loadingText={loadingText} theme={currentUser?.settings?.theme} />

        <globalState.Provider value={stateToUpdate}>
          {/* SUCCESS ALERT */}
          <SuccessAlert />
          {/* FULL MENU */}
          <FullMenu />

          {/* CREATION MENU */}
          <CreationMenu />

          <NewCalendarEvent showCard={creationFormToShow === CreationForms.calendar} />
          <NewSwapRequest showCard={creationFormToShow === CreationForms.swapRequest} />
          <NewTransferChangeRequest showCard={creationFormToShow === CreationForms.transferRequest} />
          <NewMemoryForm showCard={creationFormToShow === CreationForms.memories} />
          <NewDocument showCard={creationFormToShow === CreationForms.documents} />
          <NewExpenseForm showCard={creationFormToShow === CreationForms.expense} />
          <NewCoparentForm
            showCard={creationFormToShow === CreationForms.coparent}
            hideCard={() => setState({...state, creationFormToShow: '', refreshKey: Manager.getUid()})}
          />
          <NewChat />

          {/* BRAND BAR */}
          {!screensToHideBrandbar.includes(currentScreen) && <BrandBar />}

          {/* SCREENS */}
          <div
            id="app-content-with-sidebar"
            className={`${fullscreenScreens.includes(currentScreen) ? 'fullscreen' : ''} ${Manager.isValid(authUser) ? 'logged-in' : ''} ${currentScreen === ScreenNames.calendar ? 'three-columns' : ''}`}>
            {/* SIDE NAVBAR */}
            {!screensToHideSidebar.includes(currentScreen) && !DomManager.isMobile() && <DesktopLeftSidebar />}

            {/* ADMIN */}
            {currentScreen === ScreenNames.adminDashboard && <AdminDashboard />}

            {/* AUTHENTICATION */}
            {currentScreen === ScreenNames.login && <Login />}
            {currentScreen === ScreenNames.registration && <Registration />}
            {currentScreen === ScreenNames.requestParentAccess && <RequestParentAccess />}

            {/* UPDATE/EDIT */}
            {currentScreen === ScreenNames.editCalendarEvent && <EditCalEvent />}

            {/* DOCUMENTS */}
            {currentScreen === ScreenNames.docsList && <DocsList />}
            {currentScreen === ScreenNames.docViewer && <DocViewer />}
            {currentScreen === ScreenNames.vault && <Vault />}

            {/* UPLOAD */}
            {currentScreen === ScreenNames.uploadDocuments && <NewDocument />}

            {/* NEW */}
            {currentScreen === ScreenNames.newCalendarEvent && <NewCalendarEvent />}
            {currentScreen === ScreenNames.newMemory && <NewMemoryForm />}
            {currentScreen === ScreenNames.newChild && <NewChildForm />}
            {currentScreen === ScreenNames.newExpense && <NewExpenseForm />}
            {currentScreen === ScreenNames.newSwapRequest && <NewSwapRequest />}
            {currentScreen === ScreenNames.newTransferRequest && <NewTransferChangeRequest />}
            {currentScreen === ScreenNames.newCoparent && <NewCoparentForm />}

            {/* STANDARD */}
            {currentScreen === ScreenNames.installApp && <InstallApp />}
            {currentScreen === ScreenNames.home && !isLoading && <Home />}
            {currentScreen === ScreenNames.notifications && <Notifications />}
            {currentScreen === ScreenNames.calendar && <EventCalendar />}
            {currentScreen === ScreenNames.settings && <Settings />}
            {currentScreen === ScreenNames.profile && <Profile />}
            {currentScreen === ScreenNames.expenseTracker && <ExpenseTracker />}
            {currentScreen === ScreenNames.swapRequests && <SwapRequests />}
            {currentScreen === ScreenNames.resetPassword && <ResetPassword />}
            {currentScreen === ScreenNames.transferRequests && <TransferRequests />}
            {currentScreen === ScreenNames.memories && <Memories />}
            {currentScreen === ScreenNames.childInfo && <ChildInfo />}
            {currentScreen === ScreenNames.coparents && <Coparents />}
            {currentScreen === ScreenNames.parents && <Parents />}
            {currentScreen === ScreenNames.chat && <Chat />}
            {currentScreen === ScreenNames.chats && <Chats />}
            {currentScreen === ScreenNames.visitation && <Visitation />}
            {currentScreen === ScreenNames.contactUs && <ContactUs />}
            {currentScreen === ScreenNames.onboarding && <Onboarding />}
          </div>
        </globalState.Provider>
      </div>
    </LocalizationProvider>
  )
}