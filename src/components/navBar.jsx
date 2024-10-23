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
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'
import DB_UserScoped from '@userScoped'
import ScreensToHideCenterNavbarButton from '../constants/screensToHideCenterNavbarButton'

export default function NavBar() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, showCenterNavbarButton, theme, showNavbar, navbarButton } = state

  const setNavbarButton = (action, icon = 'add', color = 'green') => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => action(),
          icon: icon,
          color: color,
        },
      })
    }, 500)
  }

  const changeCurrentScreen = (screen) => {
    if (screen === ScreenNames.calendar) {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        cal.classList.remove('hide')
      }
    }
    if (ScreensToHideCenterNavbarButton.includes(screen)) {
      setState({
        ...state,
        currentScreen: screen,
        showCenterNavbarButton: false,
        navbarButton: {
          ...navbarButton,
          action: () => {},
          icon: 'add',
          color: 'green',
        },
      })
    } else {
      setState({
        ...state,
        currentScreen: screen,
        showCenterNavbarButton: true,
        navbarButton: {
          ...navbarButton,
          action: () => {},
          icon: 'add',
          color: 'green',
        },
      })
    }

    Manager.showPageContainer('show')
  }

  return (
    <>
      <div id="navbar" className={`${theme} ${showNavbar ? 'active' : ''}`}>
        {!menuIsOpen && (
          <div id="menu-items" className="flex">
            {/* FULL MENU  */}
            <div onClick={() => setState({ ...state, menuIsOpen: true })} className={` menu-item`}>
              <span className={`material-icons-outlined`} id="show-full-menu-icon">
                menu
              </span>
            </div>

            {/* CALENDAR */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}
              className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'}`}>
              <span className={`${currentScreen === ScreenNames.calendar ? 'material-icons-round' : 'material-icons-outlined'}`}>calendar_month</span>
            </div>

            {/* CHATS */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.chats)}
              className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
              <span className={`${currentScreen === ScreenNames.chats ? 'material-icons-round' : 'material-icons-outlined'}`}>question_answer</span>
            </div>

            {/* ADD NEW BUTTON */}
            {showCenterNavbarButton && (
              <div
                className={`${menuIsOpen ? 'menu-item' : 'menu-item active'} ${theme}`}
                onClick={() => {
                  if (navbarButton.action) {
                    navbarButton.action()
                  }
                }}
                id="menu-button">
                <span className={`material-icons-round menu-icon ${navbarButton.color}`}>{navbarButton.icon}</span>
              </div>
            )}

            {/* CHILD INFO */}
            <div className={`${currentScreen === ScreenNames.childInfo ? 'active menu-item' : 'menu-item'}`}>
              <span
                onClick={() => changeCurrentScreen(ScreenNames.childInfo)}
                className={`${currentScreen === ScreenNames.childInfo ? 'material-icons-round' : 'material-icons-outlined'}`}>
                face
              </span>
            </div>

            {/* MEMORIES */}
            <div className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
              <span
                onClick={() => changeCurrentScreen(ScreenNames.memories)}
                className={`${currentScreen === ScreenNames.memories ? 'material-icons-round' : 'material-icons-outlined'}`}>
                collections
              </span>
            </div>

            {/* SETTINGS */}
            <div className={`${currentScreen === ScreenNames.settings ? 'active menu-item' : 'menu-item'}`}>
              <span
                onClick={() => changeCurrentScreen(ScreenNames.settings)}
                className={`${currentScreen === ScreenNames.settings ? 'material-icons-round' : 'material-icons-outlined'}`}>
                settings
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
