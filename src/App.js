import React, { useEffect, useLayoutEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { initializeApp } from 'firebase/app'
import { child, get, getDatabase, onValue, ref, set } from 'firebase/database'
import { getAuth, setPersistence, signOut, onAuthStateChanged } from 'firebase/auth'

import ScreenNames from '@screenNames'
import globalState from './context.js'
import DB from '@db'
import firebaseConfig from './firebaseConfig.js'
import Manager from '@manager'
import moment from 'moment'
import Swal from 'sweetalert2'
import { LogtoProvider, LogtoConfig, useLogto } from '@logto/react'

// Screens
import EventCalendar from '@screens/calendar.jsx'
import InstallAppPopup from '@components/installAppPopup.jsx'
import Account from '@screens/account/account.jsx'
import UpdateContactInfo from '@screens/account/updateContactInfo.jsx'
import Chat from '@screens/chats/chats.jsx'
import Conversation from '@screens/chats/conversation.jsx'
import ChildInfo from '@screens/childInfo/childInfo.jsx'
import Coparents from '@screens/coparents/coparents.jsx'
import DocsList from '@screens/documents/docsList.jsx'
import UploadDocuments from '@screens/documents/uploadDocuments.jsx'
import ExpenseTracker from '@screens/expenseTracker.jsx'
import ForgotPassword from '@screens/account/forgotPassword.jsx'
import Login from '@screens/auth/login.jsx'
import Memories from '@screens/memories.jsx'
import Registration from '@screens/auth/registration.jsx'
import Visitation from '@screens/visitation.jsx'
import Settings from '@screens/settings/settings.jsx'
import SwapRequests from '@screens/swapRequests.jsx'
import TransferRequests from '@screens/transferRequests.jsx'
import Alert from '@shared/alert.jsx'
import AppManager from '@managers/appManager.js'
import ChatRecovery from '@screens/account/chatRecovery'
import EditCalEvent from '@components/forms/editCalEvent.jsx'
import NewCalendarEvent from '@components/forms/newCalendarEvent.jsx'
import NewChildForm from 'components/screens/childInfo/newChildForm.jsx'
import NewMemoryForm from 'components/forms/newMemoryForm.jsx'
import NewExpenseForm from 'components/forms/newExpenseForm.jsx'
import NewSwapRequest from 'components/forms/newSwapRequest.jsx'
import NewTransferChangeRequest from './components/forms/newTransferRequest.jsx'
import NewCoparentForm from 'components/screens/coparents/newCoparentForm.jsx'
import ChildSelector from 'components/screens/childInfo/childSelector.jsx'
import Loading from './components/shared/loading'
import DocViewer from './components/screens/documents/docViewer'
import ReviseChildTransferChangeRequest from './components/forms/reviseTransferRequest'
import emailjs from '@emailjs/browser'
import './globalFunctions'
import StateObj from './constants/stateObj'
import EmailManager from './managers/emailManager'
// Menus
import NavBar from './components/navBar'
import SlideOutMenu from './components/slideOutMenu'
import AdminDashboard from './components/screens/admin/adminDashboard'
import DateFormats from './constants/dateFormats'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  inputAlert,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  throwError,
  successAlert,
  uniqueArray,
  confirmAlert,
  getFileExtension,
} from './globalFunctions'
import DB_UserScoped from '@userScoped'
import ContactUs from './components/screens/contactUs'

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const [state, setState] = useState(StateObj)
  const stateToUpdate = { state, setState }
  const { userIsLoggedIn, firebaseUser, setFirebaseUser } = state

  const myCanvas = document.createElement('canvas')

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
  const { setTheme, isLoading, theme, previousScreen, currentScreen, menuIsOpen, showBackButton, currentUser } = state

  const deleteMenuAnimation = () => {
    document.querySelectorAll('.slide-out-menu-item').forEach((menuItem, i) => {
      menuItem.classList.remove('visible')
    })
  }

  const addMenuItemAnimation = () => {
    document.querySelectorAll('.slide-out-menu-item').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 60 * i)
    })
  }

  const disableUpdateAlert = async () => {
    const lastUpdateObject = await AppManager.getLastUpdateObject()
    const { lastUpdate } = lastUpdateObject
    const now = moment().hour()
    const expirationTime = moment(lastUpdate, DateFormats.fullDatetime).hour()
    const duration = now - expirationTime
    if (duration > 24) {
      AppManager.setUpdateAvailable(false)
    }
  }

  const showEmailVerificationInput = (foundUser, permissionCode) => {
    inputAlert(
      'It appears that your email address has not been verified',
      'For security purposes, we have sent a verification code to your email. Please enter the  code here (case sensitive).',
      async (e) => {
        if (permissionCode === e.value) {
          successAlert('Your email has been verified!')
          await DB_UserScoped.updateByPath(`${DB.tables.users}/${foundUser.phone}/emailVerified`, true)
        } else {
          throwError('Verification code is incorrect, please try again')
          window.location.reload()
        }
      },
      false,
      false
    )
  }

  const logout = () => {
    localStorage.removeItem('rememberKey')

    signOut(auth)
      .then(() => {
        setState({
          ...state,
          currentScreen: ScreenNames.login,
          currentUser: null,
          userIsLoggedIn: false,
        })
        // Sign-out successful.
        console.log('User signed out')
      })
      .catch((error) => {
        // An error happened.
      })
  }

  // ON PAGE LOAD
  useEffect(() => {
    setState({ ...state, showMenuButton: false, showNavbar: true, menuIsOpen: false })
    if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
      window.navigator.clearAppBadge().then((r) => r)
    }

    AppManager.deleteExpiredCalendarEvents().then((r) => r)
    AppManager.deleteExpiredMemories().then((r) => r)
    disableUpdateAlert().then((r) => r)
    // throw new Error('Something went wrong')
    document.body.appendChild(myCanvas)

    onAuthStateChanged(auth, (user) => {
      if (user) {
        const user = auth.currentUser

        console.log(user)
        console.log('signed in')
      } else {
        console.log('signed out')
        console.log(user)
      }
    })
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.hasOwnProperty('email')) {
      if (!currentUser.emailVerified) {
        const permissionCode = Manager.getUid().slice(0, 6)
        EmailManager.SendEmailVerification(currentUser.email, permissionCode)
        showEmailVerificationInput(currentUser, permissionCode)
      }
      if (!currentUser.updatedApp) {
        confirmAlert('Update Available', 'Update', false, async () => {
          await DB_UserScoped.updateUserRecord(currentUser.phone, 'updatedApp', true)
          logout()

          setTimeout(() => {
            window.location.reload()
          }, 300)
        })
      }
    }
  }, [currentUser])

  // Show update alert -> set user prop
  useEffect(() => {}, [currentUser])

  useEffect(() => {
    document.querySelector('#app-container').style.height = `${window.screen.height}px`
    document.querySelector('html').style.height = `${window.screen.height}px`

    if (menuIsOpen) {
      document.querySelector('#app-container').classList.add('pushed')
      addMenuItemAnimation()
    } else {
      document.querySelector('#app-container').classList.remove('pushed')
      deleteMenuAnimation()
    }
  }, [menuIsOpen])

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="App" id="app-container">
        {/* LOADING */}
        <Loading isLoading={isLoading} />

        <div id="page-overlay"></div>

        {/* INSTALL APP MODAL */}
        <InstallAppPopup />

        <globalState.Provider value={stateToUpdate}>
          {userIsLoggedIn && (
            <>
              {/* SLIDE OUT MENU */}
              <SlideOutMenu />

              {/* NAVBAR  */}
              <NavBar />
            </>
          )}

          {/* ALERT */}
          <Alert />

          {/* SCREENS */}
          <>
            {/* ADMIN */}
            {currentScreen === ScreenNames.adminDashboard && <AdminDashboard />}

            {/* AUTHENTICATION */}
            {currentScreen === ScreenNames.login && <Login />}
            {currentScreen === ScreenNames.registration && <Registration />}

            {/* UPDATE/EDIT */}
            {currentScreen === ScreenNames.editCalendarEvent && <EditCalEvent />}
            {currentScreen === ScreenNames.updateContactInfo && <UpdateContactInfo />}
            {currentScreen === ScreenNames.reviseTransferRequest && <ReviseChildTransferChangeRequest />}

            {/* DOCUMENTS */}
            {currentScreen === ScreenNames.docsList && <DocsList />}
            {currentScreen === ScreenNames.docViewer && <DocViewer />}

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
            {currentScreen === ScreenNames.calendar && <EventCalendar />}
            {currentScreen === ScreenNames.settings && <Settings />}
            {currentScreen === ScreenNames.account && <Account />}
            {currentScreen === ScreenNames.expenseTracker && <ExpenseTracker />}
            {currentScreen === ScreenNames.swapRequests && <SwapRequests />}
            {currentScreen === ScreenNames.forgotPassword && <ForgotPassword />}
            {currentScreen === ScreenNames.transferRequests && <TransferRequests />}
            {currentScreen === ScreenNames.memories && <Memories />}
            {currentScreen === ScreenNames.childInfo && <ChildInfo />}
            {currentScreen === ScreenNames.coparents && <Coparents />}
            {currentScreen === ScreenNames.conversation && <Conversation />}
            {currentScreen === ScreenNames.chats && <Chat />}
            {currentScreen === ScreenNames.visitation && <Visitation />}
            {currentScreen === ScreenNames.childSelector && <ChildSelector />}
            {currentScreen === ScreenNames.chatRecovery && <ChatRecovery />}
            {currentScreen === ScreenNames.contactUs && <ContactUs />}
          </>
        </globalState.Provider>
      </div>
    </LocalizationProvider>
  )
}
