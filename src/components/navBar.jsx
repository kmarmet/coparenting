// Path: src\components\navBar.jsx
import React, { useContext, useEffect } from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import { PiBellDuotone, PiCalendarDotsDuotone, PiChatsCircleDuotone, PiIdentificationCardDuotone } from 'react-icons/pi'
import { TbGridDots, TbPhotoHeart } from 'react-icons/tb'
import DomManager from '../managers/domManager'
import { Fade } from 'react-awesome-reveal'

export default function NavBar({ children, navbarClass, addOrClose = 'add' }) {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, theme, notificationCount } = state

  const changeCurrentScreen = async (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      activeInfoChild: null,
    })
  }

  useEffect(() => {
    const addNewButton = document.getElementById('add-new-button')
    if (addNewButton) {
      if (addNewButton.classList.contains('add')) {
        addNewButton.classList.remove('add')
        addNewButton.classList.add('close')
      }
    }
  }, [currentScreen])

  return (
    <>
      {!menuIsOpen && (
        <div id="navbar" className={`${theme} ${currentUser?.accountType} ${navbarClass} ${menuIsOpen ? 'hide' : ''}`}>
          <div id="menu-items" className="flex">
            <Fade cascade={true} direction={'up'} delay={0} damping={0.1} duration={600} triggerOnce={true}>
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
                <div id="svg-wrapper" className={`${navbarClass} ${addOrClose}`}>
                  {children}
                </div>
              )}

              {/* CHILD INFO */}
              {currentUser && currentUser?.accountType === 'parent' && (
                <div
                  onClick={() => changeCurrentScreen(ScreenNames.childInfo)}
                  className={`${currentScreen === ScreenNames.childInfo ? 'active menu-item' : 'menu-item'}`}>
                  <PiIdentificationCardDuotone className={'child-info'} />
                </div>
              )}

              {/*/!* MEMORIES *!/*/}
              <div
                onClick={() => changeCurrentScreen(ScreenNames.memories)}
                className={`${currentScreen === ScreenNames.memories ? 'active menu-item memories' : 'menu-item memories'}`}>
                <TbPhotoHeart className={'memories'} />
              </div>

              {/* NOTIFICATIONS */}
              <div
                onClick={() => changeCurrentScreen(ScreenNames.notifications)}
                className={`${currentScreen === ScreenNames.notifications ? 'active menu-item notifications' : 'menu-item notifications'}`}>
                <PiBellDuotone className={'notifications'} />
                {notificationCount > 0 && <span className="badge"></span>}
              </div>
            </Fade>
          </div>
        </div>
      )}
    </>
  )
}