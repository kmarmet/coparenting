import React, { useContext, useEffect } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import { PiCalendarDotsDuotone, PiChatsCircleDuotone, PiSparkleDuotone } from 'react-icons/pi'
import { CgMenu } from 'react-icons/cg'
import { FiSettings } from 'react-icons/fi'
import { BiFace } from 'react-icons/bi'
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
import ActivitySet from '../models/activitySet'
import SecurityManager from '../managers/securityManager'

export default function NavBar() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, showCenterNavbarButton, theme, showNavbar, navbarButton, unreadMessageCount } = state

  const changeCurrentScreen = async (screen) => {
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

  const getChatActivity = async () => {
    const activeChats = Manager.convertToArray(await SecurityManager.getChats(currentUser))
    let chatSenders = []
    let unreadMessageCount = 0
    if (Manager.isValid(activeChats, true)) {
      for (let chat of activeChats) {
        const messages = Manager.convertToArray(chat.messages).flat()
        const unreadMessages = messages.filter(
          (x) => formatNameFirstNameOnly(x.recipient) === formatNameFirstNameOnly(currentUser.name) && x.readState === 'delivered'
        )
        for (let unreadMessage of Manager.convertToArray(unreadMessages)) {
          if (unreadMessage?.sender && !chatSenders.includes(formatNameFirstNameOnly(unreadMessage?.sender))) {
            chatSenders = [...chatSenders, formatNameFirstNameOnly(unreadMessage?.sender)]
          }
        }

        unreadMessageCount = unreadMessages?.length
      }
    }

    return { chatSenders, unreadMessageCount }
  }

  const setActivities = async () => {
    let newActivitySet = new ActivitySet()
    newActivitySet.chat = { unreadMessageCount: 0, chatSenders: [] }
    const chatActivity = await getChatActivity()

    const { chatSenders, unreadMessageCount } = chatActivity
    // Set Activity Set
    newActivitySet.chat.chatSenders = chatSenders
    newActivitySet.chat.unreadMessageCount = unreadMessageCount
    setState({ ...state, activitySet: newActivitySet })
  }

  useEffect(() => {
    if (currentScreen === ScreenNames.conversation) {
      setState({ ...state, showNavbar: false })
    }
    if (currentScreen === ScreenNames.activity && currentUser) {
      console.log(true)
      setActivities().then((r) => r)
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
            {/*<div*/}
            {/*  onClick={() => changeCurrentScreen(ScreenNames.memories)}*/}
            {/*  className={`${currentScreen === ScreenNames.memories ? 'active menu-item' : 'menu-item'}`}>*/}
            {/*  <PiImagesSquareDuotone />*/}
            {/*</div>*/}

            {/* ACTIVITY */}
            <div
              onClick={() => changeCurrentScreen(ScreenNames.activity)}
              className={`${currentScreen === ScreenNames.activity ? 'active menu-item' : 'menu-item'}`}>
              <PiSparkleDuotone />
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
