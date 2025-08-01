// Screens
import emailjs from "@emailjs/browser"
import {LocalizationProvider} from "@mui/x-date-pickers-pro/LocalizationProvider"
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment"
import {LicenseInfo} from "@mui/x-license"
import * as Sentry from "@sentry/react"
import {initializeApp} from "firebase/app"
import {getAuth, onAuthStateChanged} from "firebase/auth"
import moment from "moment"
import React, {useEffect, useState} from "react"
import EditCalEvent from "./components/forms/editCalEvent"
import NewCalendarEvent from "./components/forms/newCalendarEvent.jsx"
import NewExpenseForm from "./components/forms/newExpenseForm.jsx"
import NewHandoffChangeRequest from "./components/forms/newHandoffChangeRequest.jsx"
import NewMemory from "./components/forms/newMemory.jsx"
import NewVisitationChangeRequest from "./components/forms/newVisitationChangeRequest.jsx"
import FullMenu from "./components/fullMenu"
import AdminDashboard from "./components/screens/admin/adminDashboard"
import Changelogs from "./components/screens/admin/changelogs"

import Login from "./components/screens/auth/login.jsx"
import Registration from "./components/screens/auth/registration.jsx"
import EventCalendar from "./components/screens/calendar/calendar.jsx"
import Chat from "./components/screens/chats/chat.jsx"
import Chats from "./components/screens/chats/chats.jsx"
import Children from "./components/screens/children/children.jsx"
import NewChildForm from "./components/screens/children/newChildForm.jsx"
import Contacts from "./components/screens/contacts/contacts"
import CoParents from "./components/screens/coparents/coParents.jsx"
import NewCoParentForm from "./components/screens/coparents/newCoParentForm.jsx"
import DocsList from "./components/screens/documents/docsList.jsx"
import DocumentViewer from "./components/screens/documents/documentViewer"
import NewDocument from "./components/screens/documents/newDocument.jsx"
import Expenses from "./components/screens/expenses/expenses.jsx"
import Handoffs from "./components/screens/handoffs.jsx"
import Help from "./components/screens/help"
import InstallApp from "./components/screens/installApp.jsx"
import Landing from "./components/screens/landing"
import Memories from "./components/screens/memories.jsx"
import Parents from "./components/screens/parents/parents"
import Updates from "./components/screens/updates"
import Vault from "./components/screens/vault.jsx"
import Visitation from "./components/screens/visitation.jsx"
import MakeItYours from "./components/screens/yourSpace/makeItYours"
import ResetPassword from "./components/screens/yourSpace/resetPassword.jsx"
import AppUpdateOverlay from "./components/shared/appUpdateOverlay"
import Banner from "./components/shared/banner"
import BrandBar from "./components/shared/brandBar"
import CreationMenu from "./components/shared/creationMenu"
import DesktopLeftSidebar from "./components/shared/desktopLeftSidebar"
import LoadingScreen from "./components/shared/loadingScreen"
import Overlay from "./components/shared/overlay"
import CreationForms from "./constants/creationForms"
import DatetimeFormats from "./constants/datetimeFormats"
import ScreenNames from "./constants/screenNames"
import StateObj from "./constants/stateObj"
import globalState from "./context.js"
import DB from "./database/DB"
import DB_UserScoped from "./database/db_userScoped"
import firebaseConfig from "./firebaseConfig.js"
import AppManager from "./managers/appManager.js"
import DomManager from "./managers/domManager"
import Manager from "./managers/manager"
import UpdateManager from "./managers/updateManager"

export default function App() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const [state, setState] = useState(StateObj)
    const stateToUpdate = {state, setState}
    const myCanvas = document.createElement("canvas")
    const fullscreenScreens = [ScreenNames.login, ScreenNames.landing, ScreenNames.registration]
    const screensToHideSidebar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.landing]
    const screensToHideBrandbar = [ScreenNames.resetPassword, ScreenNames.login, ScreenNames.landing]

    // Init Sentry
    Sentry.init({
        dsn: "https://15c40c1ea019fafd61508f12c6a03298@o4509223026163712.ingest.us.sentry.io/4509223028129792",
        integrations: [Sentry.browserTracingIntegration()],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
        sendDefaultPii: true,
    })

    // Init EmailJS
    emailjs.init({
        // eslint-disable-next-line no-undef
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
            id: "app",
            // Allow 1 request per 10s
            throttle: 5000,
        },
    })

    // State to include in App.js
    const {isLoading, currentScreen, userIsLoggedIn, loadingText, currentUser, theme, authUser, creationFormToShow, bannerMessage} = state

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
                    // Manager.CallbackOnTimeout(10, async () => {
                    //   setState({...state, isLoading: false, loadingText: ''})
                    // })

                    // Check for last auto refresh time and last login datetime
                    if (Manager.IsValid(user)) {
                        // Login check
                        const lastLogin = moment(user?.metadata?.lastSignInTime).format(DatetimeFormats.timestamp)
                        const msSinceLastLogin = moment(lastLogin, DatetimeFormats.timestamp).diff()
                        const hoursSinceLastLogin = Math.abs(Math.ceil(msSinceLastLogin / (1000 * 60 * 60))) ?? 0

                        // If user has been logged in for more than 30 days -> sign them out
                        if (hoursSinceLastLogin >= 720) {
                            await auth.signOut()
                            return
                        }
                    }
                    // await AppManager.setAppBadge(0)
                    await AppManager.clearAppBadge()
                    const users = await DB.GetTableData(DB.tables.users)

                    let updates = []
                    let currentUserFromDb
                    let isLoading = true

                    currentUserFromDb = users?.find((u) => u?.email === user?.email)
                    // User Exists
                    if (Manager.IsValid(currentUserFromDb)) {
                        let screenToNavigateTo = ScreenNames.calendar
                        const body = document.getElementById("external-overrides")
                        const navbar = document.getElementById("navbar")
                        updates = await DB.GetTableData(`${DB.tables.updates}/${currentUserFromDb?.key}`)

                        if (Manager.IsValid(navbar)) {
                            navbar.setAttribute("account-type", currentUserFromDb?.accountType)
                        }
                        if (body) {
                            body.classList.add(currentUserFromDb?.settings?.theme)
                        }

                        // Check if child profile and if parent access is granted
                        // Add location details to use record if they do not exist
                        if (!Manager.IsValid(currentUserFromDb?.location)) {
                            AppManager.GetLocationDetails().then(async (r) => {
                                await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUserFromDb?.key}/location`, r)
                            })

                            // Delete expired items
                            AppManager.DeleteExpiredCalendarEvents(currentUserFromDb).then((r) => r)
                            AppManager.DeleteExpiredMemories(currentUserFromDb).then((r) => r)
                        }

                        // Get notifications
                        if (!window.location.href.includes("localhost") && !AppManager.IsDevMode()) {
                            const updateSubscribers = await DB.GetTableData(`${DB.tables.updateSubscribers}`)
                            const subscriber = updateSubscribers?.find((s) => s?.email === currentUserFromDb?.email)
                            if (!Manager.IsValid(subscriber)) {
                                UpdateManager.init(currentUserFromDb)
                            }
                        }

                        // Back to Log in if user's email is not verified
                        if (!user?.emailVerified) {
                            screenToNavigateTo = ScreenNames.login
                        }

                        // Check for updates -> If update is available, navigate to updates screen
                        const updateIsAvailable = await AppManager.CheckForUpdate()

                        if (updateIsAvailable) {
                            screenToNavigateTo = ScreenNames.appUpdate
                            isLoading = false
                        }

                        // console.log("App.js -> useEffect -> user logged in")

                        // EMAIL VERIFIED
                        setState({
                            ...state,
                            authUser: user,
                            currentUser: currentUserFromDb,
                            currentScreen: screenToNavigateTo,
                            userIsLoggedIn: true,
                            isLoading: isLoading,
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
                        loadingText: "",
                        isLoading: false,
                    })
                    console.log("user signed out or user does not exist")
                }
            } catch (error) {
                setState({...state, isLoading: false})
                console.log(`Error: ${error} | Code File: App.js  | Function: useEffect |`)
            }
        })

        // eslint-disable-next-line no-undef
        LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_KEY)
    }, [])

    // Refresh on error resolution in development
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            // throw new Error('This is a test error')
            // const interval = setInterval(() => {
            //   fetch(window.location.href)
            //     .then(() => {
            //       window.location.reload()
            //     });lkjsdfds
            //     .catch(() => {}) // still broken
            // }, 3000) // check every 3s
            // return () => clearInterval(interval)
        }
    }, [])

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <div className={`App ${theme}`} id="app-container">
                <globalState.Provider value={stateToUpdate}>
                    {/* SUCCESS ALERT */}
                    <Banner />

                    {/* LOADING SCREEN */}
                    <LoadingScreen />

                    {/* FULL MENU */}
                    {userIsLoggedIn && <FullMenu />}

                    {/* CREATION MENU */}
                    <CreationMenu />

                    {/* NEW FORMS */}
                    <NewCalendarEvent />
                    <NewVisitationChangeRequest />
                    <NewHandoffChangeRequest />
                    <NewMemory />
                    <NewDocument />
                    <NewExpenseForm />
                    <NewCoParentForm
                        showCard={creationFormToShow === CreationForms.coParent}
                        hideCard={() => setState({...state, creationFormToShow: "", refreshKey: Manager.GetUid()})}
                    />

                    <Overlay />

                    {/* BRAND BAR */}
                    {!screensToHideBrandbar.includes(currentScreen) && <BrandBar />}

                    {/* SCREENS */}
                    <div
                        id="app-content-with-sidebar"
                        className={`${fullscreenScreens.includes(currentScreen) ? "fullscreen" : ""}${Manager.IsValid(authUser) ? " logged-in" : ""}${currentScreen === ScreenNames.calendar ? " three-columns" : ""}`}>
                        {/* SIDE NAVBAR */}
                        {!screensToHideSidebar.includes(currentScreen) && !DomManager.isMobile() && <DesktopLeftSidebar />}

                        {/* ADMIN */}
                        {currentScreen === ScreenNames.adminDashboard && <AdminDashboard />}
                        {currentScreen === ScreenNames.changelog && <Changelogs />}

                        {/* AUTHENTICATION */}
                        {currentScreen === ScreenNames.login && <Login />}
                        {currentScreen === ScreenNames.registration && <Registration />}

                        {/* UPDATE/EDIT */}
                        {currentScreen === ScreenNames.editCalendarEvent && <EditCalEvent />}

                        {/* DOCUMENTS */}
                        {currentScreen === ScreenNames.docsList && <DocsList />}
                        {currentScreen === ScreenNames.docViewer && <DocumentViewer />}
                        {currentScreen === ScreenNames.vault && <Vault />}

                        {/* UPLOAD */}
                        {currentScreen === ScreenNames.uploadDocuments && <NewDocument />}

                        {/* NEW */}
                        {currentScreen === ScreenNames.newCalendarEvent && <NewCalendarEvent />}
                        {currentScreen === ScreenNames.newMemory && <NewMemory />}
                        {currentScreen === ScreenNames.newChild && <NewChildForm />}
                        {currentScreen === ScreenNames.newExpense && <NewExpenseForm />}
                        {currentScreen === ScreenNames.newVisitationChangeRequest && <NewVisitationChangeRequest />}
                        {currentScreen === ScreenNames.newHandoffChangeRequest && <NewHandoffChangeRequest />}
                        {currentScreen === ScreenNames.newCoParent && <NewCoParentForm />}

                        {/* STANDARD */}
                        {currentScreen === ScreenNames.appUpdate && <AppUpdateOverlay />}
                        {currentScreen === ScreenNames.installApp && <InstallApp />}
                        {currentScreen === ScreenNames.landing && !isLoading && <Landing />}
                        {currentScreen === ScreenNames.updates && <Updates />}
                        {currentScreen === ScreenNames.calendar && <EventCalendar />}
                        {currentScreen === ScreenNames.expenses && <Expenses />}
                        {currentScreen === ScreenNames.resetPassword && <ResetPassword />}
                        {currentScreen === ScreenNames.handoff && <Handoffs />}
                        {currentScreen === ScreenNames.memories && <Memories />}
                        {currentScreen === ScreenNames.makeItYours && <MakeItYours />}
                        {currentScreen === ScreenNames.children && <Children />}
                        {currentScreen === ScreenNames.coparents && <CoParents />}
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