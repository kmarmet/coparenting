// Path: src\components\navBar.jsx
import {IoMdImages} from 'react-icons/io'
import React, {useContext, useEffect} from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import {Fade} from 'react-awesome-reveal'
import {IoChatbubblesOutline, IoNotificationsOutline} from 'react-icons/io5'
import {LuCalendarDays} from 'react-icons/lu'
import {HiOutlineMenu} from 'react-icons/hi'
import {PiPlusBold} from 'react-icons/pi'
import Manager from '../managers/manager'
import useCurrentUser from '../hooks/useCurrentUser'

export default function NavBar({children, navbarClass}) {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen, theme, notificationCount} = state
  const {currentUser} = useCurrentUser()

  const changeCurrentScreen = async (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      activeInfoChild: null,
      notificationCount: 0,
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
                <LuCalendarDays className={'calendar'} />
                <p>Calendar</p>
              </div>

              {/* MEMORIES */}
              {currentUser?.accountType === 'child' && (
                <div
                  id="memories-menu-item"
                  onClick={() => changeCurrentScreen(ScreenNames.memories)}
                  className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
                  <IoMdImages />
                  <p>Memories</p>
                </div>
              )}

              {/* CHATS */}
              {currentUser && currentUser?.accountType === 'parent' && (
                <div
                  id="chat-menu-item"
                  onClick={() => changeCurrentScreen(ScreenNames.chats)}
                  className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
                  <IoChatbubblesOutline className={'chats'} />
                  <p>Chats</p>
                </div>
              )}

              {/* MENU BUTTON */}
              <div className="menu-button menu-item" onClick={() => setState({...state, menuIsOpen: true})}>
                <div id="svg-wrapper">
                  <HiOutlineMenu className={'menu'} />
                </div>
              </div>

              {/* NOTIFICATIONS */}
              <div
                onClick={() => changeCurrentScreen(ScreenNames.notifications)}
                className={`${currentScreen === ScreenNames.notifications ? 'active menu-item notifications' : 'menu-item notifications'}`}>
                <IoNotificationsOutline className={'notifications active'} />
                <p>Notifications</p>
                {notificationCount > 0 && <span className="badge"></span>}
              </div>

              {/* CREATE */}
              <div onClick={() => setState({...state, showCreationMenu: true})} className={`menu-item`}>
                <PiPlusBold className={'create'} />
                <p>Create</p>
              </div>

              {Manager.isValid(children) && children}
            </Fade>
          </div>
        </div>
      )}
    </>
  )
}