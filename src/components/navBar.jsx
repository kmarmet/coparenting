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
import SecurityManager from '../managers/securityManager'
import DB from '@db'

export default function NavBar() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, currentUser, menuIsOpen, showCenterNavbarButton, theme, showNavbar, navbarButton, unreadMessageCount } = state

  const changeCurrentScreen = async (screen) => {
    if (ScreensToHideCenterNavbarButton.includes(screen)) {
      setState({
        ...state,
        currentScreen: screen,
        showCenterNavbarButton: false,
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

  const getMessageCount = async () => {
    const activeChats = Manager.convertToArray(await SecurityManager.getChats(currentUser))
    let unreadMessageCount = 0
    if (Manager.isValid(activeChats, true)) {
      for (let chat of activeChats) {
        const messages = Manager.convertToArray(chat.messages).flat()
        const unreadMessages = messages.filter(
          (x) => formatNameFirstNameOnly(x.recipient) === formatNameFirstNameOnly(currentUser.name) && x.readState === 'delivered'
        )
        unreadMessageCount = unreadMessages?.length
      }
    }

    return unreadMessageCount
  }

  const getExpenseCount = async () => {
    const expenses = await SecurityManager.getExpenses(currentUser)
    const unpaidExpenses = expenses.filter((x) => formatNameFirstNameOnly(x.payer.name) === formatNameFirstNameOnly(currentUser.name))
    return unpaidExpenses.length
  }

  const getEventCount = async () => {
    const allEvents = await SecurityManager.getCalendarEvents(currentUser)
    const events = allEvents.filter((x) => x.ownerPhone === currentUser.phone)
    return events.length
  }

  const getSwapCount = async () => {
    const allRequests = await SecurityManager.getSwapRequests(currentUser)
    const requestsToReturn = allRequests.filter((x) => x.recipientPhone === currentUser.phone)
    return requestsToReturn.length
  }

  const getTransferCount = async () => {
    const allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    const requestsToReturn = allRequests.filter((x) => x.recipientPhone === currentUser.phone)
    return requestsToReturn.length
  }

  const getMemoryCount = async () => {
    const allMemories = await SecurityManager.getMemories(currentUser)
    return allMemories.length
  }

  const getDocumentCount = async () => {
    const allDocs = await SecurityManager.getDocuments(currentUser)
    return allDocs.length
  }

  const setActivities = async () => {
    //TODO CHANGE PHONE
    let newActivitySet = await DB.getTable(`${DB.tables.activitySets}/3307494534`, true)
    const unreadMessageCount = await getMessageCount()

    // Fill from DB
    if (Manager.isValid(newActivitySet, false, true)) {
      setTimeout(() => {
        setState({ ...state, activitySet: newActivitySet, unreadMessageCount: unreadMessageCount })
      }, 1000)
    }
    // Create new
    else {
      newActivitySet.expenseCount = await getExpenseCount()
      newActivitySet.unreadMessageCount = unreadMessageCount
      newActivitySet.eventCount = await getEventCount()
      newActivitySet.swapRequestCount = await getSwapCount()
      newActivitySet.transferRequestCount = await getTransferCount()
      newActivitySet.memoryCount = await getMemoryCount()
      newActivitySet.documentCount = await getDocumentCount()
      console.log(newActivitySet)
      setTimeout(() => {
        setState({ ...state, activitySet: newActivitySet, unreadMessageCount: unreadMessageCount })
      }, 1000)
    }
  }

  useEffect(() => {
    setActivities().then((r) => r)
  }, [])

  useEffect(() => {
    if (currentScreen === ScreenNames.conversation) {
      setState({ ...state, showNavbar: false })
    }
    if (currentScreen === ScreenNames.calendar) {
      setState({ ...state, navbarButton: { ...navbarButton, color: 'red' } })
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
