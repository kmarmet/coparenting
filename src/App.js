import React, { useEffect, useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import globalState from './context.js'
// Screens
import Activity from './components/screens/activity'
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
import ResetPassword from '@screens/account/resetPassword.jsx'
import Login from '@screens/auth/login.jsx'
import Memories from '@screens/memories.jsx'
import Registration from '@screens/auth/registration.jsx'
import Visitation from '@screens/visitation.jsx'
import Settings from '@screens/settings/settings.jsx'
import SwapRequests from '@screens/swapRequests.jsx'
import TransferRequests from '@screens/transferRequests.jsx'
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
import { getDatabase, ref } from 'firebase/database'

// Menus
import FullMenu from './components/fullMenu'
import AdminDashboard from './components/screens/admin/adminDashboard'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { LicenseInfo } from '@mui/x-license'
import ScreenNames from '@screenNames'
import firebaseConfig from './firebaseConfig.js'
import ContactUs from './components/screens/contactUs'
import DB from '@db'

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const [state, setState] = useState(StateObj)
  const stateToUpdate = { state, setState }
  const { userIsLoggedIn, firebaseUser, setFirebaseUser } = state
  const [userEmail, setUserEmail] = useState('')
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
  const { isLoading, currentScreen, menuIsOpen, currentUser } = state

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

  // CLEAR APP BADGE
  useEffect(() => {
    if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
      window.navigator.clearAppBadge().then((r) => r)
    }
  }, [currentScreen])

  // ON PAGE LOAD
  useEffect(() => {
    // Error Boundary Test
    // throw new Error('Something went wrong')
    document.body.appendChild(myCanvas)

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const user = auth.currentUser
        setUserEmail(user.email)
        const dbRef = ref(getDatabase())
        const _currentUser = await DB.find(DB.tables.users, ['email', user.email], true)

        setState({ ...state, currentUser: _currentUser })

        // DB.getTable(DB.tables.pushAlertSubscribers).then(async (users) => {
        //   const _currentUser = await DB.find(DB.tables.users, ['email', user.email], true)
        //   const subId = await DB.getPushAlertSubscriberId(_currentUser.phone)
        //
        //   if (!Manager.isValid(subId)) {
        //   }
        //   // let subIds =`
        //   // let pushalertbyiw = []
        //   // ;(pushalertbyiw = window.pushalertbyiw || []).push(['disableAutoInit', true])
        //   // ;(pushalertbyiw = window.pushalertbyiw || []).push(['disableAutoInit', true])
        //   // PushAlertCo.init()
        //   // ;(pushalertbyiw = window.pushalertbyiw || []).push(['disableAutoInit', true])
        //
        //   // ;(pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 38837, onSubscribe])
        //
        //   // async function onSubscribe(result) {
        //   //   if (result.success) {
        //   //     ;(pushalertbyiw = window.pushalertbyiw || []).push(['onReady', onPushAlertReady])
        //   //   } else {
        //   //     ;(pushalertbyiw = window.pushalertbyiw || []).push(['subscribeToSegment', 38837])
        //   //   }
        //   // }
        //   //
        //   // async function onPushAlertReady() {
        //   //   console.log('onPushAlertReady')
        //   // }
        //   // subscribers.forEach((sub) => {
        //   //   const phone = sub[0]
        //   //   const id = sub[1]
        //   //   if (user && phone === user.phone) {
        //   //     return false
        //   //   } else {
        //   //     const subId = PushAlertCo.subs_id
        //   //     set(child(dbRef, `pushAlertSubscribers/${user.phone}/`), subId)
        //   //   }
        //   // })
        // })
        // console.log(user)
      } else {
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
      <div className={`${currentUser?.settings?.theme} App`} id="app-container">
        {/* LOADING */}
        <Loading isLoading={isLoading} />

        <div id="page-overlay"></div>

        {/* INSTALL APP MODAL */}
        <InstallAppPopup />

        <globalState.Provider value={stateToUpdate}>
          {/* SLIDE OUT MENU */}
          {userIsLoggedIn && <FullMenu />}

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