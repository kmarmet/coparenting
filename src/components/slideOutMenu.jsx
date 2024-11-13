import React, { useContext } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import AppManager from '@managers/appManager'
import { getAuth, signOut } from 'firebase/auth'
import { FaChevronLeft } from 'react-icons/fa6'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../globalFunctions'

import DB_UserScoped from '@userScoped'

// ICONS
import {
  PiCalendarDotsDuotone,
  PiCarProfileDuotone,
  PiChatsCircleDuotone,
  PiHouseLineDuotone,
  PiImagesSquareDuotone,
  PiMoneyWavyDuotone,
  PiMoonStarsDuotone,
  PiSignOutDuotone,
  PiSunDuotone,
  PiSwapDuotone,
  PiToolboxDuotone,
} from 'react-icons/pi'
import { RiMailSendLine } from 'react-icons/ri'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { BsPeople } from 'react-icons/bs'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { FiSettings } from 'react-icons/fi'
import { BiFace } from 'react-icons/bi'

export default function SlideOutMenu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, theme, currentUser, showCenterNavbarButton } = state

  const auth = getAuth()

  const changeCurrentScreen = (screen) => {
    setState({ ...state, currentScreen: screen, updateKey: Manager.getUid(), menuIsOpen: false })
    Manager.showPageContainer('show')
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser.phone, `settings/theme`, theme)
    setState({ ...state, theme: theme })
    window.location.reload()
  }

  const logout = () => {
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

  return (
    <div id="slide-out-menu-wrapper">
      <div id="slide-out-menu" className={`${theme} ${menuIsOpen ? 'active' : ''}`}>
        <>
          <div className="flex" id="top-bar">
            <div className="flex logo">
              <img src={require('../img/logo.png')} alt="" />
            </div>
          </div>

          {/* ADMIN DASHBOARD */}
          {currentUser.email === 'kmarmet1@gmail.com' && (
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.adminDashboard)}>
              <PiToolboxDuotone />
              <p>Admin Dashboard</p>
            </div>
          )}
          {/* CALENDAR */}
          <div
            className={`slide-out-menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
            <PiCalendarDotsDuotone />
            <p>Calendar</p>
          </div>
          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.visitation)}>
                <PiHouseLineDuotone />
                <p>Visitation</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.chats)}>
                <PiChatsCircleDuotone />
                <p className="text">Chat</p>
              </div>
            </>
          )}

          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              {/* EXPENSES */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
                <PiMoneyWavyDuotone />
                <p>Expense Tracker</p>
              </div>

              {/* SWAP REQUESTS */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
                <PiSwapDuotone />
                <p>Swap Requests</p>
              </div>

              {/* TRANSFER CHANGE */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
                <PiCarProfileDuotone />
                <p>Transfer Change</p>
              </div>

              {/* DOCUMENTS */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
                <HiOutlineDocumentText />
                <p>Documents</p>
              </div>

              {/* MEMORIES */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.memories)}>
                <PiImagesSquareDuotone />
                <p>Memories</p>
              </div>

              {/* CHILD INFO */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.childInfo)}>
                <BiFace />
                <p>Child Info</p>
              </div>

              {/* COPARENTS */}
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
                <BsPeople />
                <p>Coparents</p>
              </div>
            </>
          )}
        </>

        {/* ACCOUNT */}
        <div
          className={`slide-out-menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.account)}>
          <MdOutlineManageAccounts />
          <p>Account</p>
        </div>

        {/* SETTINGS */}
        <div
          className={`slide-out-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.settings)}>
          {/*<span className="material-icons-round">settings</span>*/}
          <FiSettings /> <p>Settings</p>
        </div>

        {/* CONTACT US */}
        <div
          className={`slide-out-menu-item ${currentScreen === ScreenNames.contactUs ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.contactUs)}>
          <RiMailSendLine />
          <p>Contact Us</p>
        </div>

        {/* THEME TOGGLE */}
        <div className={`slide-out-menu-item visible`} onClick={logout}>
          <PiSignOutDuotone />
          <p>Logout</p>
        </div>
        {theme === 'dark' && (
          <div className="slide-out-menu-item visible">
            <PiSunDuotone />
            <p onClick={() => changeTheme('light')}>Switch to Light Mode</p>
          </div>
        )}
        {theme === 'light' && (
          <div className="slide-out-menu-item visible">
            <PiMoonStarsDuotone />
            <p onClick={() => changeTheme('dark')}> Switch to Dark Mode</p>
          </div>
        )}
        <FaChevronLeft
          className={`${theme} ${menuIsOpen ? 'active' : ''}`}
          id={'menu-close-icon'}
          onClick={() => setState({ ...state, menuIsOpen: false })}
        />
      </div>
      <div id="blur" className={`${theme} ${menuIsOpen ? 'active' : ''}`} onClick={() => setState({ ...state, menuIsOpen: false })}></div>
    </div>
  )
}
