import React, { useState, useEffect, useContext, useCallback } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import AppManager from '@managers/appManager'
import { getAuth, signOut } from 'firebase/auth'

import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'

import DB_UserScoped from '@userScoped'
import ScreensToHideCenterNavbarButton from '../constants/screensToHideCenterNavbarButton'

// ICONS
import { PiChatsCircleDuotone } from 'react-icons/pi'
import {
  PiCalendarDotsDuotone,
  PiHouseLineDuotone,
  PiSwapDuotone,
  PiCarProfileDuotone,
  PiMoneyWavyDuotone,
  PiMoonStarsDuotone,
  PiImagesSquareDuotone,
  PiToolboxDuotone,
  PiSignOutDuotone,
  PiSunDuotone,
} from 'react-icons/pi'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { BsWrenchAdjustableCircle, BsPeople } from 'react-icons/bs'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { FiSettings } from 'react-icons/fi'
import { BiFace } from 'react-icons/bi'
import { LuPanelLeftClose } from 'react-icons/lu'
export default function SlideOutMenu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, theme, currentUser, showCenterNavbarButton } = state

  const auth = getAuth()

  const changeCurrentScreen = (screen) => {
    if (screen === ScreenNames.calendar) {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        cal.classList.remove('hide')
      }
    }

    if (ScreensToHideCenterNavbarButton.includes(screen)) {
      setState({ ...state, currentScreen: screen, updateKey: Manager.getUid(), menuIsOpen: false, showCenterNavbarButton: false })
    } else {
      setState({ ...state, currentScreen: screen, updateKey: Manager.getUid(), menuIsOpen: false, showCenterNavbarButton: true })
    }
    Manager.showPageContainer('show')
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser.phone, `settings/theme`, theme)
    setState({ ...state, theme: theme })
    Manager.showPageContainer()
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

  useEffect(() => {
    document.getElementById('slide-out-menu').style.maxHeight = `${window.screen.height}px`
  }, [])

  return (
    <>
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

          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.coparentingSpace ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.coparentingSpace)}>
                {/*<span className="material-icons-round">meeting_room</span>*/}
                <PiHouseLineDuotone />
                <p>Visitation</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.chats)}>
                {/*<span className="material-icons-round">question_answer</span>*/}
                <PiChatsCircleDuotone />
                <p className="text">Chat</p>
              </div>
            </>
          )}
          <>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
              {/*<span className="material-icons-round">calendar_month</span>*/}
              <PiCalendarDotsDuotone />
              <p>Calendar</p>
            </div>
          </>
          {AppManager.getAccountType(currentUser) === 'parent' && (
            <>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
                {/*<span className="material-icons-round">paid</span>*/}
                <PiMoneyWavyDuotone />
                <p>Expense Tracker</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
                {/*<span className="material-icons-round">swap_horizontal_circle</span>*/}
                <PiSwapDuotone />
                <p>Swap Requests</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
                {/*<span className="material-icons-round">update</span>*/}
                <PiCarProfileDuotone />
                <p>Transfer Change</p>
              </div>

              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
                {/*<span className="material-icons-round">description</span>*/}
                <HiOutlineDocumentText />
                <p>Documents</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.memories)}>
                {/*<span className="material-icons-round">collections</span>*/}
                <PiImagesSquareDuotone />
                <p>Memories</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.childInfo)}>
                {/*<span className="material-icons-round">face</span>*/}
                <BiFace />
                <p>Child Info</p>
              </div>
              <div
                className={`slide-out-menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
                {/*<span className="material-icons-round">family_restroom</span>*/}
                <BsPeople />
                <p>Coparents</p>
              </div>
            </>
          )}
        </>
        <div
          className={`slide-out-menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.account)}>
          {/*<span className="material-icons-round">manage_accounts</span>*/}
          <MdOutlineManageAccounts />
          <p>Account</p>
        </div>
        <div
          className={`slide-out-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.settings)}>
          {/*<span className="material-icons-round">settings</span>*/}
          <FiSettings /> <p>Settings</p>
        </div>

        {/* THEME TOGGLE */}
        {menuIsOpen && (
          <div id="bottom-bar" className={theme}>
            <div className={`slide-out-menu-item visible`} onClick={logout}>
              {/*<span className="material-icons-round">waving_hand</span>*/}
              <PiSignOutDuotone />
              <p>Logout</p>
            </div>
            {theme === 'dark' && (
              <p className="theme-text" onClick={() => changeTheme('light')}>
                <PiSunDuotone />
                Switch to Light Mode
              </p>
            )}
            {theme === 'light' && (
              <p className="theme-text" onClick={() => changeTheme('dark')}>
                <PiMoonStarsDuotone /> Switch to Dark Mode
              </p>
            )}
          </div>
        )}
        {menuIsOpen && <LuPanelLeftClose id={'menu-close-icon'} onClick={() => setState({ ...state, menuIsOpen: false })} />}
      </div>
    </>
  )
}
