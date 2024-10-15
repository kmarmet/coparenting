import React, { useState, useEffect, useContext, useCallback } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import AppManager from '@managers/appManager'
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
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'

import DB_UserScoped from '@userScoped'

export default function SlideOutMenu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, theme, currentUser, formToShow } = state

  const changeCurrentScreen = (screen) => {
    console.log(screen)
    if (screen === ScreenNames.calendar) {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        cal.classList.remove('hide')
      }
    }
    setState({
      ...state,
      currentScreen: screen,
      menuIsOpen: false,
    })
    Manager.toggleForModalOrNewForm('show')
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser.phone, `settings/theme`, theme)
    setState({ ...state, theme: theme })
    Manager.toggleForModalOrNewForm()
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

  return (
    <div id="slide-out-menu" className={`${theme} ${menuIsOpen ? 'active' : ''}`}>
      <>
        <div className="flex" id="top-bar">
          <div className="flex logo">
            <img src={require('../img/logo.png')} alt="" />
            <p id="brand-name">
              Peaceful <span>co</span>Parenting
            </p>
          </div>
        </div>
        {AppManager.getAccountType(currentUser) === 'parent' && (
          <>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.coparentingSpace ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.coparentingSpace)}>
              <span className="material-icons-round">meeting_room</span>
              <p>Coparenting Space</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.chats)}>
              <span className="material-icons-round">question_answer</span>
              <p className="text">Chat</p>
            </div>
          </>
        )}
        <>
          <div
            className={`slide-out-menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
            <span className="material-icons-round">calendar_month</span>
            <p>Calendar</p>
          </div>
        </>
        {AppManager.getAccountType(currentUser) === 'parent' && (
          <>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
              <span className="material-icons-round">paid</span>
              <p>Expense Tracker</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
              <span className="material-icons-round">swap_horizontal_circle</span>
              <p>Swap Requests</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
              <span className="material-icons-round">update</span>
              <p>Transfer Change</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
              <span className="material-icons-round">description</span>
              <p>Documents</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.memories)}>
              <span className="material-icons-round">collections</span>
              <p>Memories</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.childSelector)}>
              <span className="material-icons-round">face</span>
              <p>Child Info</p>
            </div>
            <div
              className={`slide-out-menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
              <span className="material-icons-round">family_restroom</span>
              <p>Coparents</p>
            </div>
          </>
        )}
      </>
      <div
        className={`slide-out-menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
        onClick={() => changeCurrentScreen(ScreenNames.account)}>
        <span className="material-icons-round">manage_accounts</span>
        <p>Account</p>
      </div>
      <div
        className={`slide-out-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
        onClick={() => changeCurrentScreen(ScreenNames.settings)}>
        <span className="material-icons-round">settings</span>
        <p>Settings</p>
      </div>

      {/* THEME TOGGLE */}
      {menuIsOpen && (
        <div id="bottom-bar" className={theme}>
          <div className={`slide-out-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`} onClick={logout}>
            <span className="material-icons-round">waving_hand</span>
            <p>Logout</p>
          </div>
          {theme === 'dark' && (
            <p className="theme-text" onClick={() => changeTheme('light')}>
              <span className="material-icons-round">light_mode</span>Switch to Light Mode
            </p>
          )}
          {theme === 'light' && (
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
  )
}
