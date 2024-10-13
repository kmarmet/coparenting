import React, { useEffect, useLayoutEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { initializeApp } from 'firebase/app'
import { child, get, getDatabase, onValue, ref, set } from 'firebase/database'
import { CustomProvider } from 'rsuite'
import Menu from '@components/menu.jsx'
import EventCalendar from '@screens/calendar.jsx'
import ScreenNames from '@screenNames'
import globalState from './context.js'
import DB from '@db'
import firebaseConfig from './firebaseConfig.js'

import Manager from '@manager'
import moment from 'moment'
// Screens
import InstallAppPopup from '@components/installAppPopup.jsx'
import Account from '@screens/account/account.jsx'
import UpdateContactInfo from '@screens/account/updateContactInfo.jsx'
import Chat from '@screens/chats/chats.jsx'
import Conversation from '@screens/chats/conversation.jsx'
import ChildInfo from '@screens/childInfo/childInfo.jsx'
import Coparents from '@screens/coparents/coparents.jsx'
import DocsList from '@screens/documents/docsList.jsx'
import Documents from '@screens/documents/documents.jsx'
import UploadDocuments from '@screens/documents/uploadDocuments.jsx'
import UploadLegalDoc from '@screens/documents/uploadLegalDoc.jsx'
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
import NewCalendarEvent from '@components/forms/newCalendarEvent.jsx'
import EditCalEvent from '@components/screens/editCalEvent.jsx'
import NewChildForm from 'components/screens/childInfo/newChildForm.jsx'
import NewMemoryForm from 'components/forms/newMemoryForm.jsx'
import NewExpenseForm from 'components/forms/newExpenseForm.jsx'
import NewSwapRequest from 'components/forms/newSwapRequest.jsx'
import NewChildTransferChangeRequest from 'components/forms/newChildTransferChange.jsx'
import NewCoparentForm from 'components/screens/coparents/newCoparentForm.jsx'
import ChildSelector from 'components/screens/childInfo/childSelector.jsx'
import Loading from './components/shared/loading'
import ImageDocs from './components/screens/documents/legalDocs'
import DocViewer from './components/screens/documents/docViewer'
import ShortcutMenu from './components/shortcutMenu'
import ReviseChildTransferChangeRequest from './components/forms/reviseTransferRequest'
import './globalFunctions'
import { wordCount, getFirstWord } from './globalFunctions'
import emailjs from '@emailjs/browser'
import NewMenu from './components/newMenu'
import DB_UserScoped from '@userScoped'

const stateObj = {
  alertMessage: '',
  alertType: '',
  confirmMessage: '',
  contactInfoToUpdateType: 'email',
  currentScreen: ScreenNames.login,
  currentUser: {},
  calEventToEdit: {},
  docToView: '',
  formToShow: '',
  previousScreen: '',
  isLoading: true,
  menuIsOpen: false,
  messageToUser: null,
  modalIsOpen: false,
  selectedChild: null,
  selectedNewEventDay: null,
  showAlert: false,
  showConfirm: false,
  showMenuButton: false,
  showShortcutMenu: false,
  showBackButton: false,
  showOverlay: false,
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
  setShowBackButton: (bool) => {},
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
  setTransferRequestToEdit: (request) => {},
  setIsLoading: (bool) => {},
  setMenuIsOpen: (isOpen) => {},
  setMessageToUser: (user) => {},
  setModalIsOpen: (bool) => {},
  setSelectedChild: (child) => {},
  setSelectedNewEventDay: (day) => {},
  setShowAlert: (bool) => {},
  setShowShortcutMenu: (bool) => {},
  setShowMenuButton: () => {},
  setShowOverlay: (bool) => {},
  setTheme: (theme) => {},
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
  const { showMenuButton, showShortcutMenu, isLoading, previousScreen, calEventToEdit, currentScreen, menuIsOpen, showBackButton, currentUser } =
    state

  const getUnreadMessageCount = async (thisUser) => {
    const dbRef = ref(getDatabase())
    let unreadMessages = []

    await get(child(dbRef, `${DB.tables.users}`)).then((users) => {
      const usersVal = users.val()
      const usersWithChats = DB.convertKeyObjectToArray(usersVal).filter((x) => x.chats !== undefined)
      usersWithChats.forEach((userWithChats, index) => {
        const threads = DB.convertKeyObjectToArray(userWithChats.chats).flat()
        let scopedChats = threads.map((x) => x.messages).flat()
        scopedChats.forEach((message) => {
          if (Manager.isValid(message, true)) {
            if (message.readState === 'delivered' && message.fromName !== currentUser.name) {
              unreadMessages.push(message)
            }
          }
        })
      })
    })
    const unreadMessageCount = unreadMessages.flat().length
    if (navigator.setAppBadge) {
      if (unreadMessageCount > 0) {
        AppManager.setAppBadge()
      } else {
        AppManager.clearAppBadge()
      }
    }
    return unreadMessageCount
  }

  const changeCurrentScreen = (screen) => {
    if (screen === ScreenNames.calendar) {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        // @ts-ignore
        cal.classList.remove('hide')
      }
    }
    setState({
      ...state,
      currentScreen: screen,
      menuIsOpen: false,
      viewExpenseForm: false,
    })
    Manager.toggleForModalOrNewForm('show')
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser.phone, `settings/theme`, theme)
    window.location.reload()
  }

  const logout = () => {
    localStorage.removeItem('rememberKey')
    setState({
      ...state,
      currentScreen: ScreenNames.login,
      currentUser: null,
      userIsLoggedIn: false,
      menuIsOpen: false,
      showMenuButton: false,
    })
  }

  const deleteMenuAnimation = () => {
    document.querySelectorAll('.full-menu-item').forEach((menuItem, i) => {
      menuItem.classList.remove('visible')
    })
  }

  const addMenuItemAnimation = () => {
    document.querySelectorAll('.full-menu-item').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 60 * i)
    })
  }

  // ON PAGE LOAD
  useEffect(() => {
    setState({ ...state, isLoading: true, showMenuButton: false })

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
      document.querySelector('.page-container').classList.add('pushed')
      addMenuItemAnimation()
    } else {
      deleteMenuAnimation()
      document.querySelector('.page-container').classList.remove('pushed')
    }
  }, [menuIsOpen])

  return (
    // <CustomProvider theme="dark">
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="App" id="app-container">
        <div id="full-menu" className={`${currentUser?.settings?.theme} ${menuIsOpen ? 'active' : ''}`}>
          <>
            <div className="flex" id="top-bar">
              <div className="flex logo">
                <img src={require('./img/logo.png')} alt="" />
                <p id="brand-name">
                  Peaceful <span>co</span>Parenting
                </p>
              </div>
            </div>
            {AppManager.getAccountType(currentUser) === 'parent' && (
              <>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.coparentingSpace ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.coparentingSpace)}>
                  <span className="material-icons-round">meeting_room</span>
                  <p>Coparenting Space</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.chats)}>
                  <span className="material-icons-round">question_answer</span>
                  <p className="text">Chat</p>
                </div>
              </>
            )}
            <>
              <div
                className={`full-menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
                <span className="material-icons-round">calendar_month</span>
                <p>Calendar</p>
              </div>
            </>
            {AppManager.getAccountType(currentUser) === 'parent' && (
              <>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
                  <span className="material-icons-round">paid</span>
                  <p>Expense Tracker</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
                  <span className="material-icons-round">swap_horizontal_circle</span>
                  <p>Swap Requests</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
                  <span className="material-icons-round">update</span>
                  <p>Transfer Change</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
                  <span className="material-icons-round">description</span>
                  <p>Documents</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.memories)}>
                  <span className="material-icons-round">collections</span>
                  <p>Memories</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.childSelector)}>
                  <span className="material-icons-round">face</span>
                  <p>Child Info</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
                  <span className="material-icons-round">family_restroom</span>
                  <p>Coparents</p>
                </div>
              </>
            )}
          </>
          <div
            className={`full-menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.account)}>
            <span className="material-icons-round">manage_accounts</span>
            <p>Account</p>
          </div>
          <div
            className={`full-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.settings)}>
            <span className="material-icons-round">settings</span>
            <p>Settings</p>
          </div>

          {/* THEME TOGGLE */}
          {menuIsOpen && (
            <div id="bottom-bar" className={currentUser?.settings?.theme}>
              <div className={`full-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`} onClick={logout}>
                <span className="material-icons-round">waving_hand</span>
                <p>Logout</p>
              </div>
              {currentUser?.settings?.theme === 'dark' && (
                <p className="theme-text" onClick={() => changeTheme('light')}>
                  <span className="material-icons-round">light_mode</span>Switch to Light Mode
                </p>
              )}
              {currentUser?.settings?.theme === 'light' && (
                <p className="theme-text" onClick={() => changeTheme('dark')}>
                  <span className="material-icons-round">nights_stay</span> Switch to Dark Mode
                </p>
              )}
            </div>
          )}

          <span className="material-icons-round" id="close-menu-button" onClick={() => setState({ ...state, menuIsOpen: false })}>
            cancel
          </span>
        </div>
        {/* LOADING */}
        <Loading isLoading={isLoading} />

        {/* UPDATE POPUP */}
        {/*<div className={menuIsOpen ? 'active overlay' : 'overlay'}></div>*/}

        {/* BACK BUTTON */}
        {showBackButton && (
          <div id="previous-screen-button-container">
            <button
              onClick={() => {
                if (currentScreen === ScreenNames.newCalendarEvent) {
                  setState({
                    ...state,
                    menuIsOpen: false,
                    currentScreen: ScreenNames.chats,
                  })
                  setTimeout(() => {
                    setState({
                      ...state,
                      menuIsOpen: false,
                      currentScreen: ScreenNames.calendar,
                      showBackButton: false,
                      showMenuButton: true,
                    })
                  }, 100)
                } else {
                  setState({
                    ...state,
                    currentScreen: previousScreen,
                    showMenuButton: true,
                    showBackButton: false,
                  })
                  Manager.toggleForModalOrNewForm('show')
                }
              }}
              className={`${currentUser?.settings?.theme} previous-screen-button`}>
              <span className="material-icons-round">arrow_back</span>
            </button>
          </div>
        )}

        {/* INSTALL APP MODAL */}
        <InstallAppPopup />
        <globalState.Provider value={stateToUpdate}>
          <Alert />

          {/* SCREENS */}
          <div>
            {/* UPDATE/EDIT */}
            {currentScreen === ScreenNames.editCalendarEvent && Manager.isValid(calEventToEdit) && <EditCalEvent />}
            {currentScreen === ScreenNames.updateContactInfo && <UpdateContactInfo />}
            {currentScreen === ScreenNames.reviseTransferRequest && <ReviseChildTransferChangeRequest />}

            {/* DOCUMENTS */}
            {currentScreen === ScreenNames.docsList && <DocsList />}
            {currentScreen === ScreenNames.docViewer && <DocViewer />}
            {currentScreen === ScreenNames.imageDocs && <ImageDocs />}

            {/* UPLOAD */}
            {currentScreen === ScreenNames.uploadAgreement && <UploadLegalDoc />}
            {currentScreen === ScreenNames.uploadDocuments && <UploadDocuments />}

            {/* NEW */}
            {currentScreen === ScreenNames.newCalendarEvent && <NewCalendarEvent />}
            {currentScreen === ScreenNames.newMemory && <NewMemoryForm />}
            {currentScreen === ScreenNames.newChild && <NewChildForm />}
            {currentScreen === ScreenNames.newExpense && <NewExpenseForm />}
            {currentScreen === ScreenNames.newSwapRequest && <NewSwapRequest />}
            {currentScreen === ScreenNames.newTransferRequest && <NewChildTransferChangeRequest />}
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
            {currentScreen === ScreenNames.documents && <Documents />}
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
          </div>

          {/* MENU  */}
          {/*{menuIsOpen && <Menu />}*/}

          {/* SHORTCUT MENU */}
          {/*{showShortcutMenu && <ShortcutMenu />}*/}

          {/* MENU BUTTON */}
          {/*{showMenuButton && currentScreen !== currentScreen.login && (*/}
          {/*  <button*/}
          {/*    id="menu-button"*/}
          {/*    className={showMenuButton ? 'button bottom visible' : 'button bottom hide'}*/}
          {/*    onClick={(e) => setState({ ...state, showShortcutMenu: true })}>*/}
          {/*    <span className="material-icons-round">menu</span>*/}
          {/*  </button>*/}
          {/*)}*/}

          <NewMenu />
        </globalState.Provider>
      </div>
    </LocalizationProvider>
    // </CustomProvider>
  )
}
