// Path: src\components\navBar.jsx
import React, { useContext } from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import { PiCalendarDotsDuotone, PiChatsCircleDuotone, PiImagesSquareDuotone } from 'react-icons/pi'
import { TbGridDots } from 'react-icons/tb'
import { BiFace } from 'react-icons/bi'
import DomManager from '../managers/domManager'
import { RxActivityLog } from 'react-icons/rx'
export default function NavBar({ children, navbarClass, addOrClose = 'add' }) {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, theme, activityCount } = state

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

            {/* ACTIVITY */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.activity)}
              className={`${currentScreen === ScreenNames.activity ? 'active menu-item activity' : 'menu-item activity'}`}>
              <RxActivityLog />
              {activityCount > 0 && <span className="count">{activityCount}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
