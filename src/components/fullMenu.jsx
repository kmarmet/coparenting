// Path: src\components\fullMenu.jsx
import React, {useContext} from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import Manager from '../managers/manager'
import AppManager from '../managers/appManager'
import {getAuth, signOut} from 'firebase/auth'
import {
  BsCalendarWeekFill,
  BsFillArrowDownSquareFill,
  BsFillArrowRightCircleFill,
  BsFillHousesFill,
  BsFillMoonStarsFill,
  BsPersonVcardFill,
  BsSendFill,
} from 'react-icons/bs'
import {IoChatbubbles, IoClose, IoDocuments, IoPeopleCircleSharp} from 'react-icons/io5'
import {PiBellFill, PiSunDuotone} from 'react-icons/pi'
import {IoMdPhotos} from 'react-icons/io'
import {RiArchive2Fill, RiMapPinTimeFill} from 'react-icons/ri'
import {MdSettingsSuggest, MdSwapHorizontalCircle} from 'react-icons/md'
import {BiSolidDashboard} from 'react-icons/bi'
import {HiUserCircle} from 'react-icons/hi2'
import {FaDonate} from 'react-icons/fa'
import DB_UserScoped from '../database/db_userScoped'
import Overlay from './shared/overlay'

export default function FullMenu() {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen, theme, currentUser, authUser, notificationCount} = state

  const auth = getAuth()

  const changeCurrentScreen = async (screen) => {
    const _user = await DB_UserScoped.getCurrentUser(authUser?.email)

    setState({...state, currentScreen: screen, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: _user})
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser?.key, `settings/theme`, theme)
    window.location.reload()
  }

  const logout = () => {
    const pageOverlay = document.getElementById('page-overlay')
    const currentUserFromLocalStorage = JSON.parse(localStorage.getItem('currentUser'))
    if (currentUserFromLocalStorage) {
      localStorage.removeItem('currentUser')
    }
    if (pageOverlay) {
      pageOverlay.classList.remove('active')
    }

    signOut(auth)
      .then(() => {
        window.location.reload()
        // Sign-out successful.
        console.log('User signed out')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  return (
    <Overlay show={menuIsOpen}>
      <div id="full-menu" className={`${theme} ${menuIsOpen ? 'open' : 'closed'}`}>
        <div id="menu-title">Menu</div>
        <div className="menu-items">
          {/* ADMIN DASHBOARD */}

          {currentUser?.email === 'kmarmet1@gmail.com' && (
            <div
              className={`menu-item admin ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
              onClick={(e) => changeCurrentScreen(ScreenNames.adminDashboard, e)}>
              <div className="svg-wrapper">
                <BiSolidDashboard />
              </div>
              <p>Dashboard</p>
            </div>
          )}
          {/* CALENDAR */}
          <div
            className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.calendar, e)}>
            <div className="svg-wrapper">
              <BsCalendarWeekFill />
            </div>
            <p>Calendar</p>
          </div>

          {/* NOTIFICATIONS */}
          <div
            className={`menu-item notifications ${currentScreen === ScreenNames.notifications ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.notifications, e)}>
            {notificationCount > 0 && <div className="badge"></div>}
            <div className="svg-wrapper">
              <PiBellFill />
            </div>
            <p>Notifications</p>
          </div>

          {/* PARENTS ONLY */}
          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              {/* VISITATION */}
              <div
                className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.visitation, e)}>
                <div className="svg-wrapper">
                  <BsFillHousesFill />
                </div>
                <p>Visitation</p>
              </div>

              {/* CHATS */}
              <div
                className={`menu-item chats ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.chats, e)}>
                <div className="svg-wrapper">
                  <IoChatbubbles />
                </div>
                <p className="text">Chats</p>
              </div>

              {/* EXPENSES */}
              <div
                className={`menu-item expenses ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.expenseTracker, e)}>
                <div className="svg-wrapper">
                  <FaDonate />
                </div>
                <p>Expenses</p>
              </div>

              {/* SWAP REQUESTS */}
              <div
                className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.swapRequests, e)}>
                <div className="svg-wrapper">
                  <MdSwapHorizontalCircle />
                </div>
                <p>Swaps</p>
              </div>

              {/* TRANSFER CHANGE */}
              <div
                className={`menu-item transfer-change ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.transferRequests, e)}>
                <div className="svg-wrapper">
                  <RiMapPinTimeFill />
                </div>
                <p>Transfers</p>
              </div>

              {/* DOCUMENTS */}
              <div
                className={`menu-item documents ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.docsList, e)}>
                <div className="svg-wrapper">
                  <IoDocuments />
                </div>
                <p>Documents</p>
              </div>
            </>
          )}
          {/* MEMORIES */}
          <div
            className={`menu-item memories ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.memories, e)}>
            <div className="svg-wrapper">
              <IoMdPhotos />
            </div>
            <p>Memories</p>
          </div>
          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              {/* CHILD INFO */}
              <div
                className={`menu-item child-info ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.childInfo, e)}>
                <div className="svg-wrapper">
                  <BsPersonVcardFill />
                </div>
                <p>Child Info</p>
              </div>

              {/* COPARENTS */}
              <div
                className={`menu-item coparents ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.coparents, e)}>
                <div className="svg-wrapper">
                  <IoPeopleCircleSharp />
                </div>
                <p>Co-Parents</p>
              </div>

              {/* ARCHIVES */}
              <div
                className={`menu-item archives ${currentScreen === ScreenNames.archives ? 'active' : ''}`}
                onClick={(e) => changeCurrentScreen(ScreenNames.archives, e)}>
                <div className="svg-wrapper">
                  <RiArchive2Fill />
                </div>
                <p>Archives</p>
              </div>
            </>
          )}

          {/* PROFILE */}
          <div
            className={`menu-item profile ${currentScreen === ScreenNames.profile ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.profile, e)}>
            <div className="svg-wrapper">
              <HiUserCircle />
            </div>
            <p>My Profile</p>
          </div>

          {/* SETTINGS */}
          <div
            className={`menu-item settings ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.settings, e)}>
            <div className="svg-wrapper">
              <MdSettingsSuggest />
            </div>
            <p>Settings</p>
          </div>

          {/* CONTACT US */}
          <div
            className={`menu-item contact-us ${currentScreen === ScreenNames.contactUs ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.contactUs, e)}>
            <div className="svg-wrapper">
              <BsSendFill />
            </div>
            <p>Contact Us</p>
          </div>
          {/* THEME TOGGLE */}
          {currentUser?.settings?.theme === 'dark' && (
            <div className="menu-item theme">
              <PiSunDuotone />
              <p onClick={() => changeTheme('light')}>Light Mode</p>
            </div>
          )}
          {currentUser?.settings?.theme === 'light' && (
            <div onClick={() => changeTheme('dark')} className="menu-item theme">
              <div className="svg-wrapper">
                <BsFillMoonStarsFill />
              </div>
              <p>Dark Mode</p>
            </div>
          )}
          {/* INSTALL APP BUTTON */}
          <div
            className={`menu-item install-app ${currentScreen === ScreenNames.installApp ? 'active' : ''}`}
            onClick={(e) => changeCurrentScreen(ScreenNames.installApp, e)}>
            <div className="svg-wrapper">
              <BsFillArrowDownSquareFill />
            </div>
            <p>Install</p>
          </div>
          {/* LOGOUT BUTTON */}
          <div className={`menu-item logout`} onClick={logout}>
            <div className="svg-wrapper">
              <BsFillArrowRightCircleFill />
            </div>
            <p>Logout</p>
          </div>
        </div>
        <div id="close-icon-wrapper">
          <IoClose onClick={() => setState({...state, menuIsOpen: false})} id={'close-icon'} />
        </div>
      </div>
    </Overlay>
  )
}