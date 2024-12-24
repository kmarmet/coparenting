import React, { useContext } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import { PiCalendarDotsDuotone, PiChatsCircleDuotone, PiImagesSquareDuotone } from 'react-icons/pi'
import { TbGridDots } from 'react-icons/tb'
import { BiFace } from 'react-icons/bi'
import DomManager from '../managers/domManager'
import { RxActivityLog } from 'react-icons/rx'

export default function NavBar({ children, navbarClass, addOrClose = 'add' }) {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, theme, unreadMessageCount } = state

  const changeCurrentScreen = async (screen) => {
    setState({
      ...state,
      currentScreen: screen,
    })
  }

  return (
    <>
      {!menuIsOpen && (
        <div id="navbar" className={`${theme} ${currentUser?.accountType} ${navbarClass} ${menuIsOpen ? 'hide' : ''}`}>
          <div id="menu-items" className="flex">
            {/* FULL MENU ICON  */}
            <div onClick={() => setState({ ...state, menuIsOpen: true })} className={`full-menu-icon menu-item`}>
              <TbGridDots />
            </div>

            {/* CALENDAR */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}
              className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'}`}>
              <PiCalendarDotsDuotone />
            </div>

            {/* CHATS */}
            {currentUser && currentUser?.accountType === 'parent' && (
              <div
                id="chat-menu-item"
                onClick={() => changeCurrentScreen(ScreenNames.chats)}
                className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
                {unreadMessageCount > 0 && <p className="navbar-activity-badge"></p>}
                <PiChatsCircleDuotone />
              </div>
            )}

            {/* ADD NEW BUTTON */}
            {DomManager.isMobile() && (
              <div id="svg-wrapper" className={addOrClose}>
                {children}
              </div>
            )}

            {/* CHILD INFO */}
            {currentUser && currentUser?.accountType === 'parent' && (
              <div
                onClick={() => changeCurrentScreen(ScreenNames.childInfo)}
                className={`${currentScreen === ScreenNames.childInfo ? 'active menu-item' : 'menu-item'}`}>
                <BiFace className={'child-info'} />
              </div>
            )}

            {/*/!* MEMORIES *!/*/}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.memories)}
              className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
              <PiImagesSquareDuotone />
            </div>

            {/* SETTINGS */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.activity)}
              className={`${currentScreen === ScreenNames.activity ? 'active menu-item activity' : 'menu-item activity'}`}>
              <RxActivityLog />
            </div>
          </div>
        </div>
      )}
    </>
  )
}