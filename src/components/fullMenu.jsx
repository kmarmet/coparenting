// Path: src\components\fullMenu.jsx
import {getAuth, signOut} from "firebase/auth"
import React, {useContext, useEffect, useRef, useState} from "react"
import {AiOutlineLogout} from "react-icons/ai"
import {BsHouses, BsImages} from "react-icons/bs"
import {GrUserAdmin} from "react-icons/gr"
import {IoBugSharp, IoChatbubblesOutline, IoNotifications, IoNotificationsOutline} from "react-icons/io5"
import {LiaFileInvoiceDollarSolid} from "react-icons/lia"
import {LuCalendarDays} from "react-icons/lu"
import {MdOutlineAppShortcut, MdOutlineContacts, MdTipsAndUpdates} from "react-icons/md"
import {PiFiles, PiSealQuestion, PiUsers, PiUsersThree, PiVault} from "react-icons/pi"
import {RiMapPinTimeLine, RiParentLine} from "react-icons/ri"
import {useSwipeable} from "react-swipeable"
import feedbackEmotions from "../constants/feedbackEmotions"
import ScreenNames from "../constants/screenNames"
import globalState from "../context"
import DB from "../database/DB"
import useCurrentUser from "../hooks/useCurrentUser"
import useFeedback from "../hooks/useFeedback"
import useUpdates from "../hooks/useUpdates"
import AppManager from "../managers/appManager"
import DomManager from "../managers/domManager"
import Manager from "../managers/manager"
import FeedbackEmotionsTracker from "../models/feedbackEmotionsTracker"
import Spacer from "./shared/spacer"

export default function FullMenu() {
    const {state, setState} = useContext(globalState)
    const {currentScreen, menuIsOpen, refreshKey} = state

    // STATE
    const [currentAppVersion, setCurrentAppVersion] = useState("")

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {feedback, feedbackIsLoading} = useFeedback()
    const {updates} = useUpdates()

    // MISC
    const auth = getAuth()
    const scrollRef = useRef(null)

    const handlers = useSwipeable({
        swipeDuration: 300,
        preventScrollOnSwipe: true,
        onSwipedDown: () => {
            setState({...state, menuIsOpen: false, showOverlay: false})
        },
    })

    const ChangeCurrentScreen = async (screen, element) =>
        setState({...state, currentScreen: screen, refreshKey: Manager.GetUid(), menuIsOpen: false, showOverlay: false})

    const Logout = () => {
        const screenOverlay = document.getElementById("screen-overlay")
        if (screenOverlay) {
            screenOverlay.classList.remove("active")
        }

        signOut(auth)
            .then(() => {
                window.location.reload()
                // Sign-out successful.
                console.log("User signed out manually")
            })
            .catch((error) => {
                console.log(error)
            })
    }

    const UpdateFeedbackCounter = async (feedbackType) => {
        if (Manager.IsValid(feedback)) {
            const updatedFeedback = {...feedback}
            updatedFeedback[feedbackType] = feedback[feedbackType] + 1
            await DB.ReplaceEntireRecord(`${DB.tables.feedbackEmotionsTracker}/${currentUser?.key}`, updatedFeedback)
        } else {
            const newFeedback = new FeedbackEmotionsTracker()
            newFeedback[feedbackType] = 1
            newFeedback.owner = {
                key: currentUser?.key,
                name: currentUser?.name,
            }
            await DB.ReplaceEntireRecord(`${DB.tables.feedbackEmotionsTracker}/${currentUser?.key}`, newFeedback)
        }
    }

    const GetCurrentAppVersion = async () => {
        const latest = await AppManager.GetCurrentAppVersion()
        setCurrentAppVersion(latest)
    }

    useEffect(() => {
        GetCurrentAppVersion().then((r) => r)
        if (menuIsOpen) {
            const sharingSection = document.querySelector(".section.sharing")
            setTimeout(() => {
                if (Manager.IsValid(sharingSection)) {
                    sharingSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    })
                }
            }, 1000)
        }
    }, [menuIsOpen])

    // Set active section
    useEffect(() => {
        if (!Manager.IsValid(currentScreen) || !menuIsOpen) return

        // Section elements
        const sections = {
            sharing: document.querySelector(".form-divider.sharing"),
            coParenting: document.querySelector(".form-divider.coparenting"),
            infoStorage: document.querySelector(".form-divider.info-storage"),
            profileSettings: document.querySelector(".form-divider.profile-settings-support"),
        }

        // Map screen groups to their corresponding section
        const sectionMap = [
            {
                screens: [ScreenNames.calendar, ScreenNames.docsList, ScreenNames.memories, ScreenNames.updates],
                section: "sharing",
            },

            {
                screens: [ScreenNames.contacts, ScreenNames.coparents, ScreenNames.vault, ScreenNames.children],
                section: "infoStorage",
            },
            {
                screens: [ScreenNames.handoff, ScreenNames.visitation, ScreenNames.chats, ScreenNames.expenses, ScreenNames.visitation],
                section: "coParenting",
            },
            {
                screens: [
                    ScreenNames.profile,
                    ScreenNames.installApp,
                    ScreenNames.settings,
                    ScreenNames.help,
                    ScreenNames.changelog,
                    ScreenNames.feedback,
                    ScreenNames.adminDashboard,
                ],
                section: "profileSettings",
            },
        ]

        // Find the matched section for currentScreen
        const matched = sectionMap.find((item) => item.screens.includes(currentScreen))

        if (matched) {
            const el = sections[matched.section]
            if (Manager.IsValid(el)) {
                el.classList.add("active")
            }
        }
    }, [currentScreen, menuIsOpen])

    return (
        <div id="full-menu-wrapper" className={menuIsOpen ? "active" : ""}>
            {Manager.IsValid(currentUser) && (
                <div ref={scrollRef} id="full-menu-card" {...handlers}>
                    <div className="swipe-bar"></div>
                    <p id="full-menu-title">Navigation</p>
                    <div id="menu-sections">
                        {/* SHARING */}
                        <div style={DomManager.AnimateDelayStyle(1, 0.3)} className={`section sharing ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                            <p className="section-title">Sharing</p>
                            <div className={`menu-items sharing`}>
                                {/* CALENDAR */}
                                <div
                                    className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? "active" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.calendar, e)}>
                                    <div className="svg-wrapper">
                                        <LuCalendarDays />
                                    </div>
                                    <p>Calendar</p>
                                </div>
                                {/* MEMORIES */}
                                <div
                                    className={`menu-item memories ${currentScreen === ScreenNames.memories ? "active" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.memories, e)}>
                                    <div className="content">
                                        <div className="svg-wrapper">
                                            <BsImages />
                                        </div>
                                        <p>Memories</p>
                                    </div>
                                </div>

                                {/* DOCUMENTS */}
                                {currentUser?.accountType === "parent" && (
                                    <div
                                        className={`menu-item documents ${currentScreen === ScreenNames.docsList ? "active" : ""}`}
                                        onClick={(e) => ChangeCurrentScreen(ScreenNames.docsList, e)}>
                                        <div className="svg-wrapper">
                                            <PiFiles />
                                        </div>
                                        <p>Documents</p>
                                    </div>
                                )}

                                {/* UPDATES */}
                                <div
                                    className={`menu-item updates${currentScreen === ScreenNames.updates ? " active" : ""}${Manager.IsValid(updates) ? " updates-exist" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.updates, e)}>
                                    <div className="content">
                                        <div className="svg-wrapper">
                                            {Manager.IsValid(updates) ? <IoNotifications /> : <IoNotificationsOutline />}
                                        </div>

                                        <p>
                                            Updates
                                            {Manager.IsValid(updates) && <span className="notification-badge">{updates?.length}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INFORMATION DATABASE */}
                        <div
                            className={`section info-storage  ${DomManager.Animate.FadeInUp(menuIsOpen)}`}
                            style={DomManager.AnimateDelayStyle(1, 0.4)}>
                            <p className="section-title">Contact Details</p>
                            <div className={`menu-items info-storage`}>
                                {/* CONTACTS */}
                                <div
                                    className={`menu-item contacts ${currentScreen === ScreenNames.contacts ? "active" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.contacts, e)}>
                                    <div className="svg-wrapper">
                                        <MdOutlineContacts />
                                    </div>
                                    <p>Contacts</p>
                                </div>
                                {/* CHILD - PARENTS */}
                                {currentUser?.accountType === "child" && (
                                    <div
                                        className={`menu-item parents ${currentScreen === ScreenNames.parents ? "active" : ""}`}
                                        onClick={(e) => ChangeCurrentScreen(ScreenNames.parents, e)}>
                                        <div className="svg-wrapper">
                                            <RiParentLine />
                                        </div>
                                        <p>Parents</p>
                                    </div>
                                )}

                                {/* PARENTS ONLY */}
                                {currentUser?.accountType === "parent" && (
                                    <>
                                        {/* CHILDREN */}
                                        <div
                                            className={`menu-item children${currentScreen === ScreenNames.children ? " active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.children, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper children">
                                                    <PiUsersThree />
                                                </div>
                                                <p>Children</p>
                                            </div>
                                        </div>

                                        {/* CO-PARENTS */}
                                        <div
                                            className={`menu-item co-parents ${currentScreen === ScreenNames.coparents ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.coparents, e)}>
                                            <div className="content">
                                                {" "}
                                                <div className="svg-wrapper">
                                                    <PiUsers />
                                                </div>
                                                <p>Co-Parents</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* CO-PARENTING */}
                        {currentUser?.accountType === "parent" && (
                            <>
                                <div
                                    style={DomManager.AnimateDelayStyle(1, 0.5)}
                                    className={`section coparenting  ${DomManager.Animate.FadeInUp(menuIsOpen, "slower")}`}>
                                    <p className="section-title">Co-Parenting Corner</p>
                                    <div className={`menu-items coparenting`}>
                                        {/* VISITATION */}
                                        <div
                                            className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.visitation, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper">
                                                    <BsHouses />
                                                </div>
                                                <p>Visitation</p>
                                            </div>
                                        </div>

                                        {/* EXPENSES */}
                                        <div
                                            className={`menu-item expenses ${currentScreen === ScreenNames.expenses ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.expenses, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper">
                                                    <LiaFileInvoiceDollarSolid />
                                                </div>
                                                <p>Expenses</p>
                                            </div>
                                        </div>

                                        {/* CHATS */}
                                        <div
                                            className={`menu-item chats ${currentScreen === ScreenNames.chats ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.chats, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper">
                                                    <IoChatbubblesOutline />
                                                </div>
                                                <p className="text">Chats</p>
                                            </div>
                                        </div>

                                        {/* HANDOFF */}
                                        <div
                                            className={`menu-item pickup-dropoff ${currentScreen === ScreenNames.handoff ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.handoff, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper">
                                                    <RiMapPinTimeLine />
                                                </div>
                                                <p>Handoffs</p>
                                            </div>
                                        </div>

                                        {/*  VAULT */}
                                        <div
                                            className={`menu-item archives ${currentScreen === ScreenNames.vault ? "active" : ""}`}
                                            onClick={(e) => ChangeCurrentScreen(ScreenNames.vault, e)}>
                                            <div className="content">
                                                <div className="svg-wrapper">
                                                    <PiVault />
                                                </div>
                                                <p>The Vault</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* JUST FOR YOU */}
                        <div
                            style={DomManager.AnimateDelayStyle(1, 0.6)}
                            className={`section profile-settings-support  ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                            <p className="section-title">Just For You</p>
                            <div className={`menu-items profile-settings-support`}>
                                {/* MAKE IT YOURS */}
                                <div
                                    className={`menu-item your-space ${currentScreen === ScreenNames.makeItYours ? "active" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.makeItYours, e)}>
                                    <div className="content">
                                        <div className="svg-wrapper">
                                            <MdOutlineAppShortcut />
                                        </div>
                                        <p>Make It Yours</p>
                                    </div>
                                </div>

                                {/* HELP */}
                                <div
                                    className={`menu-item help ${currentScreen === ScreenNames.help ? "active" : ""}`}
                                    onClick={(e) => ChangeCurrentScreen(ScreenNames.help, e)}>
                                    <div className="content">
                                        <div className="svg-wrapper">
                                            <PiSealQuestion />
                                        </div>
                                        <p>Help</p>
                                    </div>
                                </div>

                                {/* LOGOUT BUTTON */}
                                <div className={`menu-item logout`} onClick={Logout}>
                                    <div className="content">
                                        <div className="svg-wrapper">
                                            <AiOutlineLogout />
                                        </div>
                                        <p>Logout</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* ADMIN DASHBOARD */}
                        {currentUser?.email === "kmarmet1@gmail.com" && (
                            <div
                                id={"dashboard-button"}
                                className={`dashboard ${currentScreen === ScreenNames.adminDashboard ? "active" : ""}`}
                                onClick={(e) => ChangeCurrentScreen(ScreenNames.adminDashboard, e)}>
                                <div className="svg-wrapper">
                                    <GrUserAdmin />
                                </div>
                                <p>Dashboard</p>
                            </div>
                        )}

                        {/* FEEDBACK WRAPPER */}
                        <div id="feedback-wrapper">
                            <p id="feedback-title">How do you feel about the app today?</p>
                            <p id="feedback-subtitle" className={"subtitle in-form"}>
                                {DomManager.tapOrClick(true)} an emoji to convey how you feel at the moment. Feel free to do this as often as you
                                wish; the figures show the overall feedback you've provided since you began using our app.
                            </p>
                            <div id="icon-and-label-wrapper">
                                <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.unhappy)}>
                                    <span className="icon unhappy">☹️</span>
                                    <span className="count">{feedback?.unhappy || 0}</span>
                                </p>
                                <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.neutral)}>
                                    <span className="icon neutral">😐</span>
                                    <span className="count">{feedback?.neutral || 0}</span>
                                </p>
                                <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.peaceful)}>
                                    <span className="icon peaceful">😁</span>
                                    <span className="count">{feedback?.peaceful || 0}</span>
                                </p>
                                <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.love)}>
                                    <span className="icon love">❤️‍🔥</span>
                                    <span className="count">{feedback?.love || 0} </span>
                                </p>
                            </div>
                        </div>

                        {/* BUG/FEATURES ACTIONS */}
                        <div
                            id="action-wrapper"
                            onClick={() => setState({...state, currentScreen: ScreenNames.makeItYours, menuIsOpen: false, showOverlay: false})}>
                            <p id="report-bug">
                                Report Bug <IoBugSharp className={"bug-icon"} />
                            </p>
                            <span className="seperator">|</span>
                            <p id="request-feature">
                                Request Feature <MdTipsAndUpdates className={"feature-icon"} />
                            </p>
                        </div>
                        <Spacer height={5} />
                        <p id="current-app-version" onClick={(e) => ChangeCurrentScreen(ScreenNames.changelog, e)}>
                            v{currentAppVersion}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}