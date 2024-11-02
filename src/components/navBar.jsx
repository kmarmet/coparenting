import React, { useContext, useEffect } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import { PiCalendarDotsDuotone, PiChatsCircleDuotone, PiImagesSquareDuotone } from 'react-icons/pi'
import { CgMenu } from 'react-icons/cg'
import { BiFace } from 'react-icons/bi'
import { FiSettings } from 'react-icons/fi'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
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
import ScreensToHideCenterNavbarButton from '../constants/screensToHideCenterNavbarButton'

export default function NavBar() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, showCenterNavbarButton, theme, showNavbar, navbarButton, unreadMessageCount } = state

  const changeCurrentScreen = (screen) => {
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
      })
    }

    Manager.showPageContainer('show')
  }

  useEffect(() => {
    if (currentScreen === ScreenNames.conversation) {
      setState({ ...state, showNavbar: false })
    }
  }, [currentScreen])

  return (
    <>
      <div id="navbar" className={`${theme} ${showNavbar ? 'active' : ''} ${menuIsOpen ? 'hide' : ''}`}>
        {!menuIsOpen && (
          <div id="menu-items" className="flex">
            {/* FULL MENU  */}
            <div onClick={() => setState({ ...state, menuIsOpen: true })} className={` menu-item`}>
              <CgMenu />
            </div>

            {/* CALENDAR */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}
              className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'}`}>
              <PiCalendarDotsDuotone />
            </div>

            {/* CHATS */}
            <div
              id="chat-menu-item"
              onClick={() => changeCurrentScreen(ScreenNames.chats)}
              className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
              {unreadMessageCount > 0 && <p className="navbar-activity-badge">{unreadMessageCount}</p>}
              <PiChatsCircleDuotone />
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
                id="add-new-button">
                <span className={`material-icons-round add-new-icon ${navbarButton.color}`}>{navbarButton.icon}</span>
              </div>
            )}

            {/* CHILD INFO */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.childInfo)}
              className={`${currentScreen === ScreenNames.childInfo ? 'active menu-item' : 'menu-item'}`}>
              <BiFace />
            </div>

            {/* MEMORIES */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.memories)}
              className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
              <PiImagesSquareDuotone />
            </div>

            {/* SETTINGS */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.settings)}
              className={`${currentScreen === ScreenNames.settings ? 'active menu-item settings' : 'menu-item settings'}`}>
              <FiSettings />{' '}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
