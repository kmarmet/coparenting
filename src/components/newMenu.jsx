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
import DB_UserScoped from '@userScoped'

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
      {/* ADD NEW BUTTON */}
      <div className={menuIsOpen ? '' : 'active'} onClick={addNew} id="menu-button">
        <span className="material-icons-round">add</span>
      </div>
      <div id="new-menu" className={`${currentUser?.settings?.theme} ${showShortcutMenu ? 'active' : ''}`}>
        {!menuIsOpen && (
          <div id="floating-menu" className="flex">
            <div onClick={() => setState({ ...state, menuIsOpen: true })} className={` menu-item`}>
              <span className="material-icons-round" id="show-full-menu-icon">
                format_list_bulleted
              </span>
            </div>
            <div
              onClick={() => changeCurrentScreen(ScreenNames.calendar)}
              className={`${currentScreen === ScreenNames.calendar ? 'active menu-item two' : 'menu-item two'}`}>
              <span className="material-icons-round">calendar_month</span>
            </div>
            <div
              onClick={() => changeCurrentScreen(ScreenNames.chats)}
              className={`${currentScreen === ScreenNames.chats ? 'active menu-item three' : 'menu-item three'}`}>
              <span className="material-icons-round">question_answer</span>
            </div>

            <div className={`${currentScreen === ScreenNames.childSelector ? 'active menu-item' : 'menu-item'}`}>
              <span onClick={() => changeCurrentScreen(ScreenNames.childSelector)} className="material-icons-round">
                face
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
