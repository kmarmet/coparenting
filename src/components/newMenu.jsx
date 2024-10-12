import React, { useState, useEffect, useContext, useCallback } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import AppManager from '@managers/appManager'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'

export default function NewMenu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, currentUser, showShortcutMenu } = state

  const changeCurrentScreen = (screen) => {
    if (screen === ScreenNames.calendar) {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        // @ts-ignore
        cal.classList.remove('hide')
      }
    }
    setState({
      ...state,
      currentScreen: screen,
      menuIsOpen: false,
      viewExpenseForm: false,
    })
    Manager.toggleForModalOrNewForm('show')
  }

  const logout = () => {
    localStorage.removeItem('rememberKey')
    setState({
      ...state,
      currentScreen: ScreenNames.login,
      currentUser: null,
      userIsLoggedIn: false,
      menuIsOpen: false,
      showMenuButton: false,
    })
  }

  const deleteMenuAnimation = async () => {
    document.querySelectorAll('.menu-item').forEach((menuItem, i) => {
      menuItem.classList.remove('visible')
    })
  }

  const addMenuItemAnimation = async () => {
    document.querySelectorAll('.menu-item').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 60 * i)
    })
  }

  const addNew = async () => {
    switch (true) {
      case currentScreen === ScreenNames.calendar:
        setState({ ...state, formToShow: ScreenNames.newCalendarEvent, showShortcutMenu: false })
    }
  }

  return (
    <>
      <div id="new-menu" className={`${currentUser?.settings?.theme} ${showShortcutMenu ? 'active' : ''}`}>
        {!menuIsOpen && (
          <div id="floating-menu" className="flex">
            <div
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}
              className={`${currentScreen === ScreenNames.calendar ? 'active menu-item' : 'menu-item'}`}>
              <span className="material-icons-round">calendar_month</span>
            </div>
            <div
              onClick={() => changeCurrentScreen(ScreenNames.chats)}
              className={`${currentScreen === ScreenNames.chats ? 'active menu-item' : 'menu-item'}`}>
              <span className="material-icons-round">question_answer</span>
            </div>
            {/* ADD NEW BUTTON */}
            <div onClick={addNew} className="menu-item menu-button">
              <span className="material-icons-round">add</span>
            </div>
            <div
              onClick={() => changeCurrentScreen(ScreenNames.childSelector)}
              className={`${currentScreen === ScreenNames.childSelector ? 'active menu-item' : 'menu-item'}`}>
              <span className="material-icons-round">face</span>
            </div>
            <div onClick={() => setState({ ...state, menuIsOpen: true })} className={` menu-item`}>
              <span className="material-icons-round" id="show-full-menu-icon">
                expand_less
              </span>
            </div>
          </div>
        )}
        <div id="full-menu" className={menuIsOpen ? 'active' : ''}>
          <>
            {AppManager.getAccountType(currentUser) === 'parent' && (
              <>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.coparentingSpace ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.coparentingSpace)}>
                  <span className="material-icons-round">meeting_room</span>
                  <p>Coparenting Space</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.chats)}>
                  <span className="material-icons-round">question_answer</span>
                  <p className="text">Chat</p>
                </div>
              </>
            )}
            <>
              <div
                className={`full-menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
                onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
                <span className="material-icons-round">calendar_month</span>
                <p>Calendar</p>
              </div>
            </>
            {AppManager.getAccountType(currentUser) === 'parent' && (
              <>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
                  <span className="material-icons-round">paid</span>
                  <p>Expense Tracker</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
                  <span className="material-icons-round">swap_horizontal_circle</span>
                  <p>Swap Requests</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
                  <span className="material-icons-round">update</span>
                  <p>Transfer Change</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
                  <span className="material-icons-round">description</span>
                  <p>Documents</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.memories)}>
                  <span className="material-icons-round">collections</span>
                  <p>Memories</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.childSelector)}>
                  <span className="material-icons-round">face</span>
                  <p>Child Info</p>
                </div>
                <div
                  className={`full-menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
                  <span className="material-icons-round">family_restroom</span>
                  <p>Coparents</p>
                </div>
              </>
            )}
          </>
          <div
            className={`full-menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.account)}>
            <span className="material-icons-round">manage_accounts</span>
            <p>Account</p>
          </div>
          <div
            className={`full-menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.settings)}>
            <span className="material-icons-round">settings</span>
            <p>Settings</p>
          </div>
          <span onClick={() => setState({ ...state, menuIsOpen: false })} className="material-icons-round" id="close-icon">
            expand_more
          </span>
          <div className={`full-menu-item logout`} onClick={logout}>
            <span className="material-icons-round">logout</span>
          </div>
        </div>
      </div>
    </>
  )
}
