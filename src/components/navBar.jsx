// Path: src\components\navBar.jsx
import React, { useContext, useEffect } from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import { Fade } from 'react-awesome-reveal'
import { IoChatbubbles, IoChatbubblesOutline, IoNotifications, IoNotificationsOutline } from 'react-icons/io5'
import { LuCalendarDays } from 'react-icons/lu'
import { HiOutlineMenu } from 'react-icons/hi'
import { PiPlusBold } from 'react-icons/pi'
import { FaCalendarAlt } from 'react-icons/fa'

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
              {/* CALENDAR */}
              <div
                onClick={() => changeCurrentScreen(ScreenNames.calendar)}
                className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'}`}>
                {currentScreen === ScreenNames.calendar ? <FaCalendarAlt className={'calendar fs-26'} /> : <LuCalendarDays className={'calendar'} />}
                <p>Calendar</p>
              </div>

              {/* CHATS */}
              {currentUser && currentUser?.accountType === 'parent' && (
                <div
                  id="chat-menu-item"
                  onClick={() => changeCurrentScreen(ScreenNames.chats)}
                  className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
                  {currentScreen === ScreenNames.chats ? <IoChatbubbles className={'chats'} /> : <IoChatbubblesOutline className={'chats'} />}
                  <p>Chats</p>
                </div>
              )}

              {/* MENU BUTTON */}
              <div onClick={() => setState({ ...state, menuIsOpen: true })}>
                <div id="svg-wrapper">
                  <HiOutlineMenu className={'menu'} />
                </div>
              </div>

              {/* NOTIFICATIONS */}
              <div
                onClick={() => changeCurrentScreen(ScreenNames.notifications)}
                className={`${currentScreen === ScreenNames.notifications ? 'active menu-item notifications' : 'menu-item notifications'}`}>
                {currentScreen === ScreenNames.notifications ? (
                  <IoNotifications className={'notifications'} />
                ) : (
                  <IoNotificationsOutline className={'notifications'} />
                )}
                <p>Notifications</p>
                {notificationCount > 0 && <span className="badge"></span>}
              </div>

              {/* CREATE */}
              <div onClick={() => setState({ ...state, showCreationMenu: true })} className={`menu-item`}>
                <PiPlusBold className={'create'} />
                <p>Create</p>
              </div>
            </Fade>
          </div>
        </div>
      )}
    </>
  )
}