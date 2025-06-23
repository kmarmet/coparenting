// Path: src\components\fullMenu.jsx
import {getAuth, signOut} from 'firebase/auth'
import React, {useContext, useEffect, useRef} from 'react'
import {AiOutlineLogout} from 'react-icons/ai'
import {BsHouses, BsImages} from 'react-icons/bs'
import {GrInstallOption, GrUserAdmin, TfiSettings} from 'react-icons/gr'
import {IoChatbubblesOutline} from 'react-icons/io5'
import {LiaFileInvoiceDollarSolid} from 'react-icons/lia'
import {LuCalendarDays} from 'react-icons/lu'
import {MdOutlineContacts} from 'react-icons/md'
import {PiFiles, PiNotificationFill, PiSealQuestion, PiSwap, PiUsers, PiUsersThree, PiVault} from 'react-icons/pi'
import {RiAccountPinCircleLine, RiParentLine} from 'react-icons/ri'
import {TbTransferIn} from 'react-icons/tb'
import {TfiSettings} from 'react-icons/tfi'
import {useSwipeable} from 'react-swipeable'
import NotificationBadge from '../components/shared/notificationBadge'
import feedbackEmotions from '../constants/feedbackEmotions'
import ScreenNames from '../constants/screenNames'
import globalState from '../context'
import DB from '../database/DB'
import useCurrentUser from '../hooks/useCurrentUser'
import useFeedback from '../hooks/useFeedback'
import DomManager from '../managers/domManager'
import Manager from '../managers/manager'
import FeedbackEmotionsTracker from '../models/feedbackEmotionsTracker'

export default function FullMenu() {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen} = state
  const {currentUser} = useCurrentUser()
  const {feedback} = useFeedback()
  const auth = getAuth()
  const scrollRef = useRef(null)

  const handlers = useSwipeable({
    swipeDuration: 300,
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      setState({...state, menuIsOpen: false})
    },
  })

  const ChangeCurrentScreen = async (screen, element) => {
    console.log(element.currentTarget)
    setState({...state, currentScreen: screen, refreshKey: Manager.GetUid(), menuIsOpen: false})
  }

  const Logout = () => {
    const screenOverlay = document.getElementById('screen-overlay')
    if (screenOverlay) {
      screenOverlay.classList.remove('active')
    }

    signOut(auth)
      .then(() => {
        window.location.reload()
        // Sign-out successful.
        console.log('User signed out manually')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  const UpdateFeedbackCounter = async (feedbackType) => {
    if (Manager.IsValid(feedback)) {
      const prop = `${feedbackType}Count`
      let count = feedback[prop] + 1
      await DB.updateByPath(`${DB.tables.feedbackEmotionsTracker}/${prop}`, count)
    } else {
      const prop = `${feedbackType}Count`
      let count = 1
      let newFeedback = new FeedbackEmotionsTracker()
      newFeedback[prop] = count

      await DB.updateByPath(`${DB.tables.feedbackEmotionsTracker}`, newFeedback)
    }
  }

  useEffect(() => {
    if (menuIsOpen) {
      const sharingSection = document.querySelector('.section.sharing')
      setTimeout(() => {
        if (Manager.IsValid(sharingSection)) {
          sharingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 1000)
    }
  }, [menuIsOpen])

  return (
    <div id="full-menu-wrapper" className={menuIsOpen ? 'active' : ''}>
      <div id={'full-menu-overlay'}>
        <div className="swipe-bar"></div>
        {Manager.IsValid(currentUser) && (
          <div ref={scrollRef} id="full-menu-card" {...handlers}>
            <div id="menu-sections">
              {/* SHARING */}
              <div style={DomManager.AnimateDelayStyle(1, 0.3)} className={`section sharing ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                <p className="menu-title">Sharing</p>
                <div className={`menu-items sharing`}>
                  {/* CALENDAR */}
                  <div
                    className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.calendar, e)}>
                    <div className="svg-wrapper">
                      <LuCalendarDays />
                    </div>
                    <p>Calendar</p>
                  </div>
                  {/* MEMORIES */}
                  <div
                    className={`menu-item memories ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.memories, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <BsImages />
                      </div>
                      <p>Memories</p>
                    </div>
                  </div>

                  {/* DOCUMENTS */}
                  {currentUser?.accountType === 'parent' && (
                    <div
                      className={`menu-item documents ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.docsList, e)}>
                      <div className="svg-wrapper">
                        <PiFiles />
                      </div>
                      <p>Documents</p>
                    </div>
                  )}

                  {/* UPDATES */}
                  <div
                    className={`menu-item updates ${currentScreen === ScreenNames.updates ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.updates, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <PiNotificationFill />
                      </div>

                      <p>
                        Updates
                        <NotificationBadge classes={'menu'} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* INFORMATION DATABASE */}
              <div className={`section info-storage ${DomManager.Animate.FadeInUp(menuIsOpen)}`} style={DomManager.AnimateDelayStyle(1, 0.4)}>
                <p className={`menu-title info-storage`}>Information Database</p>
                <div className={`menu-items info-storage`}>
                  {/* CONTACTS */}
                  <div
                    className={`menu-item contacts ${currentScreen === ScreenNames.contacts ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.contacts, e)}>
                    <div className="svg-wrapper">
                      <MdOutlineContacts />
                    </div>
                    <p>Contacts</p>
                  </div>
                  {/* CHILD - PARENTS */}
                  {currentUser?.accountType === 'child' && (
                    <div
                      className={`menu-item parents ${currentScreen === ScreenNames.parents ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.parents, e)}>
                      <div className="svg-wrapper">
                        <RiParentLine />
                      </div>
                      <p>Parents</p>
                    </div>
                  )}

                  {/* PARENTS ONLY */}
                  {currentUser?.accountType === 'parent' && (
                    <>
                      {/* CHILDREN */}
                      <div
                        className={`menu-item child-info ${currentScreen === ScreenNames.children ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.children, e)}>
                        <div className="content">
                          <div className="svg-wrapper">
                            <PiUsersThree />
                          </div>
                          <p>Children</p>
                        </div>
                      </div>

                      {/* CO-PARENTS */}
                      <div
                        className={`menu-item co-parents ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.coparents, e)}>
                        <div className="svg-wrapper">
                          <PiUsers />
                        </div>
                        <p>Co-Parents</p>
                      </div>

                      {/* VISITATION */}
                      <div
                        className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.visitation, e)}>
                        <div className="content">
                          <div className="svg-wrapper">
                            <BsHouses />
                          </div>
                          <p>Visitation</p>
                        </div>
                      </div>

                      {/* ARCHIVES */}
                      <div
                        className={`menu-item archives ${currentScreen === ScreenNames.vault ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.vault, e)}>
                        <div className="svg-wrapper">
                          <PiVault />
                        </div>
                        <p>The Vault</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <hr />

              {/* CO-PARENTING */}
              {currentUser?.accountType === 'parent' && (
                <div
                  style={DomManager.AnimateDelayStyle(1, 0.5)}
                  className={`section coparenting ${DomManager.Animate.FadeInUp(menuIsOpen, 'slower')}`}>
                  <p className={`menu-title coparenting`}>Co-Parenting</p>
                  <div className={`menu-items coparenting`}>
                    {/* TRANSFER CHANGE */}
                    <div
                      className={`menu-item transfer-change ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.transferRequests, e)}>
                      <div className="svg-wrapper">
                        <TbTransferIn />
                      </div>
                      <p>Transfer Requests</p>
                    </div>

                    {/* EXPENSES */}
                    <div
                      className={`menu-item expenses ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.expenseTracker, e)}>
                      <div className="content">
                        <div className="svg-wrapper">
                          <LiaFileInvoiceDollarSolid />
                        </div>
                        <p>Expenses</p>
                      </div>
                    </div>

                    {/* SWAP REQUESTS */}
                    <div
                      className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.swapRequests, e)}>
                      <div className="svg-wrapper">
                        <PiSwap />
                      </div>
                      <p>Swap Requests</p>
                    </div>

                    {/* CHATS */}
                    <div
                      className={`menu-item chats ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.chats, e)}>
                      <div className="content">
                        <div className="svg-wrapper">
                          <IoChatbubblesOutline />
                        </div>
                        <p className="text">Chats</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <hr />

              {/* PROFILE SETTINGS & SUPPORT */}
              <div
                style={DomManager.AnimateDelayStyle(1, 0.6)}
                className={`section profile-settings-support ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                <p className="menu-title">Settings & Support</p>
                <div className={`menu-items profile-settings-support`}>
                  {/* PROFILE */}
                  <div
                    className={`menu-item profile ${currentScreen === ScreenNames.profile ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.profile, e)}>
                    <div className="svg-wrapper">
                      <RiAccountPinCircleLine />
                    </div>
                    <p>My Profile</p>
                  </div>

                  {/* SETTINGS */}
                  <div
                    className={`menu-item settings ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.settings, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <TfiSettings />
                      </div>
                      <p>Settings</p>
                    </div>
                  </div>

                  {/* ADMIN DASHBOARD */}
                  {currentUser?.email === 'kmarmet1@gmail.com' && (
                    <div
                      className={`menu-item settings ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.adminDashboard, e)}>
                      <div className="svg-wrapper">
                        <GrUserAdmin />
                      </div>
                      <p>Dashboard</p>
                    </div>
                  )}

                  {/* HELP */}
                  <div
                    className={`menu-item help ${currentScreen === ScreenNames.help ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.help, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <PiSealQuestion />
                      </div>
                      <p>Help</p>
                    </div>
                  </div>

                  {/* INSTALL APP BUTTON */}
                  <div
                    className={`menu-item install-app ${currentScreen === ScreenNames.installApp ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.installApp, e)}>
                    <div className="svg-wrapper">
                      <GrInstallOption />
                    </div>
                    <p>Install</p>
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

                <hr />

                {/* FEEDBACK WRAPPER */}
                <div id="feedback-wrapper">
                  <p id="feedback-title">How do you feel about the app today?</p>
                  <p id="feedback-subtitle">
                    {DomManager.tapOrClick(true)} an emoji to convey how you feel at the moment. Feel free to do this as often as you wish; the
                    figures show the overall feedback you've provided since you began using our app.
                  </p>
                  <div id="icon-and-label-wrapper">
                    <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.unhappy)}>
                      <span className="icon unhappy">☹️</span>
                      <span className="count">{feedback?.unhappyCount ?? 0}</span>
                    </p>
                    <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.neutral)}>
                      <span className="icon neutral">😐</span>
                      <span className="count">{feedback?.neutralCount ?? 0}</span>
                    </p>
                    <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.peaceful)}>
                      <span className="icon peaceful">😁</span>
                      <span className="count">{feedback?.peacefulCount ?? 0}</span>
                    </p>
                    <p onClick={() => UpdateFeedbackCounter(feedbackEmotions.love)}>
                      <span className="icon love">❤️‍🔥</span>
                      <span className="count">{feedback?.loveCount ?? 0} </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}