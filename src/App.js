import React, { useEffect, useLayoutEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { initializeApp } from 'firebase/app'
import { child, get, getDatabase, onValue, ref, set } from 'firebase/database'
import ScreenNames from '@screenNames'
import globalState from './context.js'
import DB from '@db'
import firebaseConfig from './firebaseConfig.js'
import Manager from '@manager'
import moment from 'moment'

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
import ContactSupport from '@screens/settings/contactSupport.jsx'
import CoparentingSpace from '@screens/coparentingSpace.jsx'
import FeatureRequest from '@screens/settings/featureRequest.jsx'
import Feedback from '@screens/settings/feedback.jsx'
import Settings from '@screens/settings/settings.jsx'
import SwapRequests from '@screens/swapRequests.jsx'
import TransferRequests from '@screens/transferRequests.jsx'
import Alert from '@shared/alert.jsx'
import AppManager from '@managers/appManager.js'
import ChatRecovery from '@screens/account/chatRecovery'
import EditCalEvent from '@components/screens/editCalEvent.jsx'
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
import { wordCount, getFirstWord } from './globalFunctions'
import emailjs from '@emailjs/browser'
import './globalFunctions'

// Menus
import NavBar from './components/navBar'
import SlideOutMenu from './components/slideOutMenu'

const stateObj = {
  alertMessage: '',
  alertType: '',
  calEventToEdit: {},
  confirmMessage: '',
  contactInfoToUpdateType: 'email',
  currentScreen: ScreenNames.login,
  currentUser: {},
  docToView: '',
  formToShow: '',
  isLoading: true,
  menuIsOpen: false,
  messageToUser: null,
  modalIsOpen: false,
  previousScreen: '',
  selectedChild: null,
  selectedNewEventDay: null,
  showAlert: false,
  showBackButton: false,
  showConfirm: false,
  showMenuButton: false,
  showOverlay: false,
  showNavbar: true,
  theme: 'light',
  transferRequestToEdit: {},
  unreadMessages: null,
  unreadMessagesCountSet: false,
  userIsLoggedIn: false,
  users: [],
  viewExpenseForm: false,
  viewSwapRequestForm: false,
  viewTransferRequestForm: false,
  setAlertMessage: (alertMessage) => {},
  setAlertType: (type) => {},
  setConfirmMessage: (message) => {},
  setContactInfoToUpdateType: () => {},
  setCurrentScreen: (screen) => {},
  setCurrentUser: (user) => {},
  setDateToEdit: (date) => {},
  setDocToView: (doc) => {},
  setEventToEdit: (event) => {},
  setFormToShow: (form) => {},
  setGoBackScreen: (screen) => {},
  setIsLoading: (bool) => {},
  setMenuIsOpen: (isOpen) => {},
  setMessageToUser: (user) => {},
  setModalIsOpen: (bool) => {},
  setSelectedChild: (child) => {},
  setSelectedNewEventDay: (day) => {},
  setShowAlert: (bool) => {},
  setShowBackButton: (bool) => {},
  setShowMenuButton: () => {},
  setShowOverlay: (bool) => {},
  setShowShortcutMenu: (bool) => {},
  setTheme: (theme) => {},
  setTransferRequestToEdit: (request) => {},
  setUnreadMessages: (count) => {},
  setUnreadMessagesCountSet: (bool) => {},
  setUserIsLoggedIn: (isLoggedIn) => {},
  setUsers: (users) => {},
  setViewExpenseForm: (show) => {},
  setViewSwapRequestForm: (show) => {},
  setViewTransferRequestForm: (show) => {},
}

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const [state, setState] = useState(stateObj)
  const stateToUpdate = { state, setState }
  const myCanvas = document.createElement('canvas')
  document.body.appendChild(myCanvas)

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
  const { setTheme, isLoading, theme, previousScreen, calEventToEdit, currentScreen, menuIsOpen, showBackButton, currentUser } = state

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

  // ON PAGE LOAD
  useEffect(() => {
    setState({ ...state, isLoading: true, showMenuButton: false, showNavbar: true })

    if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
      window.navigator.clearAppBadge().then((r) => r)
    }

    AppManager.deleteExpiredCalendarEvents().then((r) => r)
    AppManager.deleteExpiredMemories().then((r) => r)
    // throw new Error('Something went wrong')
    // AppManager.setHolidays()
  }, [])

  useEffect(() => {
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
          {/* SLIDE OUT MENU */}
          <SlideOutMenu />

          {/* NAVBAR  */}
          <NavBar />

          {/* ALERT */}
          <Alert />

          {/* SCREENS */}
          <>
            {/* UPDATE/EDIT */}
            {currentScreen === ScreenNames.editCalendarEvent && Manager.isValid(calEventToEdit) && <EditCalEvent />}
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
            {currentScreen === ScreenNames.contactSupport && <ContactSupport />}
            {currentScreen === ScreenNames.login && <Login />}
            {currentScreen === ScreenNames.registration && <Registration />}
            {currentScreen === ScreenNames.expenseTracker && <ExpenseTracker />}
            {currentScreen === ScreenNames.swapRequests && <SwapRequests />}
            {currentScreen === ScreenNames.forgotPassword && <ForgotPassword />}
            {currentScreen === ScreenNames.transferRequests && <TransferRequests />}
            {currentScreen === ScreenNames.memories && <Memories />}
            {currentScreen === ScreenNames.childInfo && <ChildInfo />}
            {currentScreen === ScreenNames.coparents && <Coparents />}
            {currentScreen === ScreenNames.conversation && <Conversation />}
            {currentScreen === ScreenNames.chats && <Chat />}
            {currentScreen === ScreenNames.featureRequests && <FeatureRequest />}
            {currentScreen === ScreenNames.feedback && <Feedback />}
            {currentScreen === ScreenNames.coparentingSpace && <CoparentingSpace />}
            {currentScreen === ScreenNames.childSelector && <ChildSelector />}
            {currentScreen === ScreenNames.chatRecovery && <ChatRecovery />}
          </>
        </globalState.Provider>
      </div>
    </LocalizationProvider>
  )
}
