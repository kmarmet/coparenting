// Path: src\components\navBar.jsx
import moment from 'moment'
import React, {useContext, useEffect} from 'react'
import {BsCalendar} from 'react-icons/bs'
import {HiOutlineMenu} from 'react-icons/hi'
import {IoMdImages} from 'react-icons/io'
import {IoAdd, IoChatbubblesOutline} from 'react-icons/io5'
import {PiNotificationFill} from 'react-icons/pi'
import ScreenNames from '../constants/screenNames'
import globalState from '../context'
import useCurrentUser from '../hooks/useCurrentUser'
import useUpdates from '../hooks/useUpdates'
import DomManager from '../managers/domManager'
import Manager from '../managers/manager'

export default function NavBar({children, navbarClass}) {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen, theme} = state
  const {currentUser} = useCurrentUser()
  const {updates} = useUpdates()

  const screensToHideUpdates = [ScreenNames.children, ScreenNames.coparents, ScreenNames.chats, ScreenNames.contacts, ScreenNames.docViewer]

  const ChangeCurrentScreen = async (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      activeChild: null,
      refreshKey: Manager.GetUid(),
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
      <div
        id="navbar"
        className={`${theme} ${DomManager.Animate.FadeInUp(true, '.menu-item')} ${currentUser?.accountType} ${navbarClass} ${menuIsOpen ? 'hide' : ''}`}>
        <div id="menu-items" className="flex">
          {/* CALENDAR */}
          <div
            style={DomManager.AnimateDelayStyle(1, 0.02)}
            onClick={() => ChangeCurrentScreen(ScreenNames.calendar)}
            className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'} `}>
            <div id="calendar-and-month">
              <BsCalendar className={'calendar'} />
              <span>{moment().format('D')}</span>
            </div>
            <p>Calendar</p>
          </div>

          {/* CHATS */}
          {currentUser && currentUser?.accountType === 'parent' && (
            <div
              style={DomManager.AnimateDelayStyle(1, 0.03)}
              id="chat-menu-item"
              onClick={() => ChangeCurrentScreen(ScreenNames.chats)}
              className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
              <IoChatbubblesOutline className={'chats'} />
              <p>Chats</p>
            </div>
          )}

          {/* MENU BUTTON */}
          <div
            style={DomManager.AnimateDelayStyle(1, 0.04)}
            className={`menu-button menu-item `}
            onClick={() => setState({...state, showOverlay: true, menuIsOpen: true})}>
            <div id="svg-wrapper">
              <HiOutlineMenu className={'menu'} />
            </div>
          </div>

          {/* MEMORIES */}
          {currentUser?.accountType === 'child' && currentScreen !== ScreenNames.parents && (
            <div
              style={DomManager.AnimateDelayStyle(1, 0.05)}
              id="memories-menu-item"
              onClick={() => ChangeCurrentScreen(ScreenNames.memories)}
              className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>
              <IoMdImages />
              <p>Memories</p>
            </div>
          )}

          {/* UPDATES */}
          {currentUser?.accountType === 'parent' && !screensToHideUpdates.includes(currentScreen) && (
            <div
              style={DomManager.AnimateDelayStyle(1, 0.06)}
              onClick={() => ChangeCurrentScreen(ScreenNames.updates)}
              className={`${Manager.IsValid(updates) ? 'unread' : ''} ${currentScreen === ScreenNames.updates ? 'active menu-item updates' : 'menu-item updates'}`}>
              <PiNotificationFill className={'updates'} />
              <p>
                Updates
                {Manager.IsValid(updates) && <span className="update-badge"></span>}
              </p>
            </div>
          )}

          {/* CREATE */}
          <div
            style={DomManager.AnimateDelayStyle(1, 0.07)}
            onClick={() => setState({...state, showCreationMenu: true, showOverlay: true})}
            className={`menu-item create ${DomManager.Animate.FadeInUp(true, '.menu-item')}`}>
            <IoAdd className={'create'} />
            <p>Create</p>
          </div>

          {Manager.IsValid(children) && children}
        </div>
      </div>
    </>
  )
}