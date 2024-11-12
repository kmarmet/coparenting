import React, { useContext } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import { PiCalendarDotsDuotone, PiChatsCircleDuotone, PiImagesSquareDuotone } from 'react-icons/pi'
import { CgMenu } from 'react-icons/cg'
import { VscSettings } from 'react-icons/vsc'
import { FaChild } from 'react-icons/fa'
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

export default function NavBar({ children, navbarClass }) {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, showCenterNavbarButton, theme, showNavbar, navbarButton, unreadMessageCount } = state

  const changeCurrentScreen = async (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      showCenterNavbarButton: true,
    })
  }

  return (
    <>
      {!menuIsOpen && (
        <div id="navbar" className={`${theme} ${navbarClass} ${menuIsOpen ? 'hide' : ''}`}>
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
              {unreadMessageCount > 0 && <p className="navbar-activity-badge"></p>}
              <PiChatsCircleDuotone />
            </div>

            {/* ADD NEW BUTTON */}
            <div id="svg-wrapper">{children}</div>

            {/* CHILD INFO */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.childInfo)}
              className={`${currentScreen === ScreenNames.childInfo ? 'active menu-item' : 'menu-item'}`}>
              <FaChild />
            </div>

            {/*/!* MEMORIES *!/*/}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.memories)}
              className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
              <PiImagesSquareDuotone />
            </div>

            {/* SETTINGS */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.settings)}
              className={`${currentScreen === ScreenNames.settings ? 'active menu-item settings' : 'menu-item settings'}`}>
              <VscSettings />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
