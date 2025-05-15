// Path: src\App.js
import EditCalEvent from '/src/components/forms/editCalEvent.jsx'
import NewCalendarEvent from '/src/components/forms/newCalendarEvent.jsx'
import NewExpenseForm from '/src/components/forms/newExpenseForm.jsx'
import NewMemoryForm from '/src/components/forms/newMemoryForm.jsx'
import NewSwapRequest from '/src/components/forms/newSwapRequest.jsx'
import NewTransferChangeRequest from '/src/components/forms/newTransferRequest.jsx'
import FullMenu from '/src/components/fullMenu'
import AdminDashboard from '/src/components/screens/admin/adminDashboard'
import Login from '/src/components/screens/auth/login.jsx'
import Registration from '/src/components/screens/auth/registration.jsx'
import EventCalendar from '/src/components/screens/calendar/calendar.jsx'
import Chat from '/src/components/screens/chats/chat.jsx'
import Chats from '/src/components/screens/chats/chats.jsx'
import Children from '/src/components/screens/children/children.jsx'
import NewChildForm from '/src/components/screens/children/newChildForm.jsx'
import Coparents from '/src/components/screens/coparents/coparents.jsx'
import NewCoparentForm from '/src/components/screens/coparents/newCoparentForm.jsx'
import DocsList from '/src/components/screens/documents/docsList.jsx'
import DocViewer from '/src/components/screens/documents/docViewer'
import NewDocument from '/src/components/screens/documents/newDocument.jsx'
import ExpenseTracker from '/src/components/screens/expenses/expenseTracker.jsx'
import Help from '/src/components/screens/help'
import InstallApp from '/src/components/screens/installApp.jsx'
import Landing from '/src/components/screens/landing'
import Memories from '/src/components/screens/memories.jsx'
import Profile from '/src/components/screens/profile/profile.jsx'
import ResetPassword from '/src/components/screens/profile/resetPassword.jsx'
import Settings from '/src/components/screens/settings/settings.jsx'
import SwapRequests from '/src/components/screens/swapRequests.jsx'
import TransferRequests from '/src/components/screens/transferRequests.jsx'
import Updates from '/src/components/screens/updates'
import Vault from '/src/components/screens/vault.jsx'
import Visitation from '/src/components/screens/visitation.jsx'
import BrandBar from '/src/components/shared/brandBar'
import DesktopLeftSidebar from '/src/components/shared/desktopLeftSidebar'
import Loading from '/src/components/shared/loading'
import ScreenNames from '/src/constants/screenNames'
import StateObj from '/src/constants/stateObj'
import globalState from '/src/context.js'
import DB_UserScoped from '/src/database/db_userScoped'
import firebaseConfig from '/src/firebaseConfig.js'
import AppManager from '/src/managers/appManager.js'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
// Screens
import emailjs from '@emailjs/browser'
import {LocalizationProvider} from '@mui/x-date-pickers-pro/LocalizationProvider'
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment'
import {LicenseInfo} from '@mui/x-license'
import * as Sentry from '@sentry/react'
import {initializeApp} from 'firebase/app'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import moment from 'moment'
import React, {useEffect, useState} from 'react'
import NewChat from './components/forms/newChat'
import Contacts from './components/screens/contacts/contacts'
import Parents from './components/screens/parents/parents'
import CreationMenu from './components/shared/creationMenu'
import SuccessAlert from './components/shared/successAlert'
import CreationForms from './constants/creationForms'
import DatetimeFormats from './constants/datetimeFormats'
import DB from './database/DB'
import UpdateManager from './managers/updateManager'

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const [state, setState] = useState(StateObj)
  const stateToUpdate = {state, setState}
  const {userIsLoggedIn, firebaseUser, setFirebaseUser} = state
  const myCanvas = document.createElement('canvas')
  const fullscreenScreens = [ScreenNames.login, ScreenNames.landing, ScreenNames.registration]
  const screensToHideSidebar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.landing]
  const screensToHideBrandbar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.landing]

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
      // The variable Contains the email address
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

  useEffect(() => {
    setTimeout(() => {
      DomManager.ToggleAnimation('add', 'screen-header .text', DomManager.AnimateClasses.names.fadeInUp)
    }, 500)
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
      // console.Log(user)
      try {
        if (user) {
          const user = auth.currentUser

          // Check for last auto refresh tie and last login datetime
          if (Manager.IsValid(user)) {
            // Login check
            const lastLogin = moment(user?.metadata?.lastSignInTime).format(DatetimeFormats.fullDatetime)
            const msSinceLastLogin = moment(lastLogin, DatetimeFormats.fullDatetime).diff()
            const hoursSinceLastLogin = Math.abs(Math.ceil(msSinceLastLogin / (1000 * 60 * 60))) ?? 0

            // If user has been logged in for more than 30 days -> sign them out
            if (hoursSinceLastLogin >= 720) {
              await auth.signOut()
              return
            }
          }
          await AppManager.setAppBadge(0)
          await AppManager.clearAppBadge()
          const users = await DB.getTable(DB.tables.users)

          let updates = []
          let currentUserFromDb
          currentUserFromDb = users?.find((u) => u?.email === user?.email)
          // User Exists
          if (Manager.IsValid(currentUserFromDb)) {
            let screenToNavigateTo = ScreenNames.calendar
            const body = document.getElementById('external-overrides')
            const navbar = document.getElementById('navbar')

            if (Manager.IsValid(navbar)) {
              navbar.setAttribute('account-type', currentUserFromDb?.accountType)
            }
            if (body) {
              body.classList.add(currentUserFromDb?.settings?.theme)
            }

            // Check if child profile and if parent access is granted
            // Add location details to use record if they do not exist
            if (!Manager.IsValid(currentUserFromDb?.location)) {
              AppManager.getLocationDetails().then(async (r) => {
                await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUserFromDb?.key}/location`, r)
              })

              // Delete expired items
              AppManager.deleteExpiredCalendarEvents(currentUserFromDb).then((r) => r)
              AppManager.deleteExpiredMemories(currentUserFromDb).then((r) => r)
            }

            // Get notifications
            if (!window.location.href.includes('localhost')) {
              UpdateManager.init(currentUserFromDb)
              updates = await DB.getTable(`${DB.tables.updates}/${currentUserFromDb?.key}`)
            }

            // Back to Log in if user's email is not verified
            if (!user?.emailVerified) {
              screenToNavigateTo = ScreenNames.login
            }

            // EMAIL VERIFIED
            setState({
              ...state,
              authUser: user,
              currentUser: currentUserFromDb,
              currentScreen: screenToNavigateTo,
              userIsLoggedIn: true,
              isLoading: false,
              loadingText: '',
              theme: currentUserFromDb?.settings?.theme,
              notificationCount: updates?.length,
            })
          }
        } else {
          setState({
            ...state,
            authUser: user,
            currentScreen: ScreenNames.landing,
            userIsLoggedIn: false,
            loadingText: '',
            isLoading: false,
          })
          console.log('user signed out or user does not exist')
        }
      } catch (error) {
        setState({...state, isLoading: false})
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
            hideCard={() => setState({...state, creationFormToShow: '', refreshKey: Manager.GetUid()})}
          />
          <NewChat />

          {/* BRAND BAR */}
          {!screensToHideBrandbar.includes(currentScreen) && <BrandBar />}

          {/* SCREENS */}
          <div
            id="app-content-with-sidebar"
            className={`${fullscreenScreens.includes(currentScreen) ? 'fullscreen' : ''} ${Manager.IsValid(authUser) ? 'logged-in' : ''} ${currentScreen === ScreenNames.calendar ? 'three-columns' : ''}`}>
            {/* SIDE NAVBAR */}
            {!screensToHideSidebar.includes(currentScreen) && !DomManager.isMobile() && <DesktopLeftSidebar />}

            {/* ADMIN */}
            {currentScreen === ScreenNames.adminDashboard && <AdminDashboard />}

            {/* AUTHENTICATION */}
            {currentScreen === ScreenNames.login && <Login />}
            {currentScreen === ScreenNames.registration && <Registration />}

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
            {currentScreen === ScreenNames.landing && !isLoading && <Landing />}
            {currentScreen === ScreenNames.updates && <Updates />}
            {currentScreen === ScreenNames.calendar && <EventCalendar />}
            {currentScreen === ScreenNames.settings && <Settings />}
            {currentScreen === ScreenNames.profile && <Profile />}
            {currentScreen === ScreenNames.expenseTracker && <ExpenseTracker />}
            {currentScreen === ScreenNames.swapRequests && <SwapRequests />}
            {currentScreen === ScreenNames.resetPassword && <ResetPassword />}
            {currentScreen === ScreenNames.transferRequests && <TransferRequests />}
            {currentScreen === ScreenNames.memories && <Memories />}
            {currentScreen === ScreenNames.children && <Children />}
            {currentScreen === ScreenNames.coparents && <Coparents />}
            {currentScreen === ScreenNames.parents && <Parents />}
            {currentScreen === ScreenNames.chat && <Chat />}
            {currentScreen === ScreenNames.chats && <Chats />}
            {currentScreen === ScreenNames.visitation && <Visitation />}
            {currentScreen === ScreenNames.contacts && <Contacts />}
            {currentScreen === ScreenNames.help && <Help />}
          </div>
        </globalState.Provider>
      </div>
    </LocalizationProvider>
  )
}