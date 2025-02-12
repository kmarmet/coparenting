import React, { useEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import globalState from '/src/context.js'
import 'react-toggle/style.css'
// Screens
import Activity from '/src/components/screens/activity'
import EventCalendar from '/src/components/screens/calendar/calendar.jsx'
import InstallApp from '/src/components/screens/installApp.jsx'
import Account from '/src/components/screens/account/account.jsx'
import Chat from '/src/components/screens/chats/chat.jsx'
import ChildInfo from '/src/components/screens/childInfo/childInfo.jsx'
import Coparents from '/src/components/screens/coparents/coparents.jsx'
import DocsList from '/src/components/screens/documents/docsList.jsx'
import UploadDocuments from '/src/components/screens/documents/uploadDocuments.jsx'
import ExpenseTracker from '/src/components/screens/expenses/expenseTracker.jsx'
import ResetPassword from '/src/components/screens/account/resetPassword.jsx'
import Login from '/src/components/screens/auth/login.jsx'
import Memories from '/src/components/screens/memories.jsx'
import Registration from '/src/components/screens/auth/registration.jsx'
import Visitation from '/src/components/screens/visitation.jsx'
import Settings from '/src/components/screens/settings/settings.jsx'
import SwapRequests from '/src/components/screens/swapRequests.jsx'
import TransferRequests from '/src/components/screens/transferRequests.jsx'
import EditCalEvent from '/src/components/forms/editCalEvent.jsx'
import NewCalendarEvent from '/src/components/forms/newCalendarEvent.jsx'
import NewChildForm from '/src/components/screens/childInfo/newChildForm.jsx'
import NewMemoryForm from '/src/components/forms/newMemoryForm.jsx'
import NewExpenseForm from '/src/components/forms/newExpenseForm.jsx'
import NewSwapRequest from '/src/components/forms/newSwapRequest.jsx'
import NewTransferChangeRequest from '/src/components/forms/newTransferRequest.jsx'
import NewCoparentForm from '/src/components/screens/coparents/newCoparentForm.jsx'
import ChildSelector from '/src/components/screens/childInfo/childSelector.jsx'
import Loading from '/src/components/shared/loading'
import DocViewer from '/src/components/screens/documents/docViewer'
import emailjs from '@emailjs/browser'
import StateObj from '/src/constants/stateObj' // Menus
import FullMenu from '/src/components/fullMenu'
import AdminDashboard from '/src/components/screens/admin/adminDashboard'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { LicenseInfo } from '@mui/x-license'
import ScreenNames from '/src/constants/screenNames'
import firebaseConfig from '/src/firebaseConfig.js'
import ContactUs from '/src/components/screens/contactUs'
import NotificationManager from '/src/managers/notificationManager.js'
import Home from '/src/components/screens/home'
import BrandBar from '/src/components/shared/brandBar'
import SideNavbar from '/src/components/shared/sideNavbar'
import DB_UserScoped from '/src/database/db_userScoped'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DomManager from '/src/managers/domManager'
import AppManager from '/src/managers/appManager.js'
import Records from '/src/components/screens/records.jsx'
import Chats from '/src/components/screens/chats/chats.jsx'

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const [state, setState] = useState(StateObj)
  const stateToUpdate = { state, setState }
  const { userIsLoggedIn, firebaseUser, setFirebaseUser } = state
  const myCanvas = document.createElement('canvas')

  const fullscreenScreens = [ScreenNames.login, ScreenNames.home, ScreenNames.registration]
  const screensToHideSidebar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.home]
  const screensToHideBrandbar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.home]

  emailjs.init({
    publicKey: 'khikD1NoIHmBPlckL',
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
  const { isLoading, currentScreen, menuIsOpen, currentUser, loadingText } = state

  const deleteMenuAnimation = () => {
    document.querySelectorAll('#full-menu .menu-item').forEach((menuItem, i) => {
      menuItem.classList.remove('visible')
    })
  }

  const addMenuItemAnimation = () => {
    document.querySelectorAll('#full-menu .menu-item').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 55 * i)
    })
  }

  const updateCurrentUser = async () => {
    const _currentUser = await DB_UserScoped.getCurrentUser(currentUser?.email, 'email')
    setState({ ...state, currentUser: _currentUser, isLoading: false })
  }

  // ON SCREEN CHANGE
  useEffect(() => {
    if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
      window.navigator.clearAppBadge().then((r) => r)
    }
    const allBottomCards = document.querySelectorAll('#bottom-card')
    for (let bottomCard of allBottomCards) {
      bottomCard.classList.remove('animate__fadeInUp')
    }
    if (Manager.isValid(currentUser) && currentScreen !== ScreenNames.calendar) {
      updateCurrentUser().then((r) => r)
    }
  }, [currentScreen])

  // ON PAGE LOAD
  useEffect(() => {
    // Error Boundary Test
    // throw new Error('Something went wrong')
    document.body.appendChild(myCanvas)

    // FIREBASE AUTH
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const user = auth.currentUser
        const _currentUser = await DB_UserScoped.getCurrentUser(user.email, 'email')
        await AppManager.clearAppBadge()
        NotificationManager.init(_currentUser)
        const permissionCodes = await DB.getTable(DB.tables.parentPermissionCodes)
        const scopedCodes = permissionCodes.filter((x) => x.parentPhone === _currentUser.phone || x.childPhone === _currentUser.phone)

        if (Manager.isValid(scopedCodes)) {
          await DB.deleteMultipleRows(DB.tables.parentPermissionCodes, scopedCodes, _currentUser)
        }

        const activities = await DB.getTable(`${DB.tables.activities}/${_currentUser.phone}`)

        AppManager.deleteExpiredCalendarEvents(_currentUser).then((r) => r)
        AppManager.deleteExpiredMemories(_currentUser).then((r) => r)
        // Update currentUser in state
        if (user.emailVerified) {
          setState({
            ...state,
            currentUser: _currentUser,
            theme: _currentUser?.settings?.theme,
            currentScreen: ScreenNames.calendar,
            userIsLoggedIn: true,
            loadingText: '',
            activityCount: activities.length,
          })
        }
      } else {
        setState({ ...state, isLoading: false })
        console.log('signed out or user doesn"t exist')
      }
    })
    LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_KEY)
  }, [])

  // MENU OPEN/CLOSE
  useEffect(() => {
    if (menuIsOpen) {
      addMenuItemAnimation()
    } else {
      deleteMenuAnimation()
    }
  }, [menuIsOpen])

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className={`App`} id="app-container">
        {/* LOADING */}
        {isLoading && <Loading isLoading={isLoading} loadingText={loadingText} theme={currentUser?.settings?.theme} />}

        <div id="page-overlay"></div>

        <globalState.Provider value={stateToUpdate}>
          {/* FULL MENU */}
          <FullMenu />

          {/* BRAND BAR */}
          {!screensToHideBrandbar.includes(currentScreen) && <BrandBar />}

          {/* SCREENS */}
          <div id="app-content-with-sidebar" className={fullscreenScreens.includes(currentScreen) ? 'fullscreen' : ''}>
            {/* SIDE NAVBAR */}
            {!screensToHideSidebar.includes(currentScreen) && !DomManager.isMobile() && <SideNavbar />}

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
            {currentScreen === ScreenNames.records && <Records />}

            {/* UPLOAD */}
            {currentScreen === ScreenNames.uploadDocuments && <UploadDocuments />}

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
            {currentScreen === ScreenNames.activity && <Activity />}
            {currentScreen === ScreenNames.calendar && <EventCalendar />}
            {currentScreen === ScreenNames.settings && <Settings />}
            {currentScreen === ScreenNames.account && <Account />}
            {currentScreen === ScreenNames.expenseTracker && <ExpenseTracker />}
            {currentScreen === ScreenNames.swapRequests && <SwapRequests />}
            {currentScreen === ScreenNames.resetPassword && <ResetPassword />}
            {currentScreen === ScreenNames.transferRequests && <TransferRequests />}
            {currentScreen === ScreenNames.memories && <Memories />}
            {currentScreen === ScreenNames.childInfo && <ChildInfo />}
            {currentScreen === ScreenNames.coparents && <Coparents />}
            {currentScreen === ScreenNames.chat && <Chat />}
            {currentScreen === ScreenNames.chats && <Chats />}
            {currentScreen === ScreenNames.visitation && <Visitation />}
            {currentScreen === ScreenNames.childSelector && <ChildSelector />}
            {currentScreen === ScreenNames.contactUs && <ContactUs />}
          </div>
        </globalState.Provider>
      </div>
    </LocalizationProvider>
  )
}