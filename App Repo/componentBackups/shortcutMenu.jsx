// Path: App Repo\componentBackups\shortcutMenu.jsx
import React, { useContext, useEffect, useState } from 'react'
import AppManager from 'managers/appManager'
import globalState from 'context'
import ScreenNames from 'constants/screenNames'
import Manager from 'managers/manager'
import DB from 'database/DB'
import DB_UserScoped from 'database/db_userScoped'
import Shortcut from '../models/shortcut'
import MenuMapper from '../mappers/menuMapper'

const defaultShortcuts = ['Calendar', 'Chats', 'Child Info', 'Memories']

function ShortcutMenu() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, showNavbar, menuIsOpen, currentScreen } = state
  const [firstHalfShortcutsFromDB, setFirstHalfShortcutsFromDB] = useState([])
  const [secondHalfShortcutsFromDB, setSecondHalfShortcutsFromDB] = useState([])

  const changeCurrentScreen = async (screen) => {
    await setCurrentUser({
      currentScreen: screen,
      menuIsOpen: false,
      setAlertMessage: '',
      setShowAlert: false,
      viewExpenseForm: false,
      showNavbar: false,
    })
  }

  const setCurrentUser = async (stateUpdates) =>
    new Promise(async (resolve, reject) => {
      const rememberKey = localStorage.getItem('rememberKey')
      await DB.getTable(DB.tables.users)
        .then(async (people) => {
          people = Manager.convertToArray(people)
          if (people && people.length > 0) {
            const user = people.filter((x) => x.id === rememberKey)[0]
            if (user) {
              setState({
                ...state,
                theme: user.theme,
                currentScreen: ScreenNames.calendar,
                currentUser: user,
                userIsLoggedIn: true,
                ...stateUpdates,
              })
            } else {
              resolve('')
            }
          } else {
            resolve('')
          }
        })
        .finally(async () => {
          resolve('')
        })
    })

  const addMenuItemAnimation = async () => {
    document.querySelectorAll('.menu-item').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 60 * i)
    })
  }

  const createShortcutArray = (inputArray) => {
    const returnArray = []
    inputArray.forEach((item) => {
      const shortcut = new Shortcut()
      shortcut.iconName = MenuMapper.stringToIconName(item)
      shortcut.accessType = 'parent'
      shortcut.screenName = item.toCamelCase()
      returnArray.push(shortcut)
    })

    return returnArray
  }

  const setShortcuts = async () => {
    let shortcuts = await DB_UserScoped.getRecordsByUser(DB.tables.users, currentUser, theme, 'settings/shortcuts')

    if (shortcuts.length === 0) {
      shortcuts = createShortcutArray(defaultShortcuts)
    }
    const firstHalf = shortcuts.slice(0, 2)
    const secondHalf = shortcuts.slice(2, 4)
    setFirstHalfShortcutsFromDB(firstHalf)
    setSecondHalfShortcutsFromDB(secondHalf)
  }

  useEffect(() => {
    // setTimeout(() => {
    const pageOverlay = document.querySelector('.page-overlay')

    if (pageOverlay) {
      pageOverlay.classList.add('active')
    }
    // }, 200)
    setShortcuts().then((r) => r)
    setTimeout(() => {
      const accountType = currentUser?.accountType
      if (accountType === 'child') {
        const parentElements = document.querySelectorAll('.parent')
        parentElements.forEach((el) => el.remove())
      }
      addMenuItemAnimation().then((r) => r)
    }, 200)
  }, [])

  return (
    <div>
      <div id="shortcuts" className={`${theme}`}>
        {!menuIsOpen && (
          <div id="shortcut-menu-container">
            {/* SKY */}
            <div className="page-overlay shortcut-menu" id="star-parallax">
              <div id="sky">
                <div id="stars"></div>
                <div id="stars2"></div>
                <div id="stars3"></div>
                <img id="moon" src={require('../img/moon.png')} alt="Moon" />
                <div id="quote">
                  <p className="">
                    our children are stars,
                    <br /> they shine brightest <br /> when the sky is clear{' '}
                  </p>
                </div>
              </div>
              <span className="shooting-star"></span>
              <span className="shooting-star-two"></span>
              <span
                onClick={() => setState({ ...state, currentScreen: ScreenNames.settings, showNavbar: false })}
                id="customize-button"
                className="material-icons-round">
                edit
              </span>
            </div>

            <div id="shortcut-menu-content">
              {Manager.isValid(firstHalfShortcutsFromDB, true) &&
                firstHalfShortcutsFromDB.map((shortcut, index) => {
                  return (
                    <div
                      key={index}
                      className={`menu-item ${AppManager.getAccountType(shortcut.accessType) === 'child' ? 'child' : 'parent'}`}
                      onClick={() => changeCurrentScreen(shortcut.screenName)}>
                      <span className="material-icons-round calendar-icon">{shortcut.iconName}</span>
                    </div>
                  )
                })}

              {/* MENU BUTTON */}
              <div className="menu-item menu-button" onClick={(e) => setState({ ...state, menuIsOpen: true, showNavbar: false })}>
                <span className="material-icons-round">menu</span>
              </div>

              {Manager.isValid(secondHalfShortcutsFromDB, true) &&
                secondHalfShortcutsFromDB.map((shortcut, index) => {
                  return (
                    <div
                      key={index}
                      className={`menu-item ${AppManager.getAccountType(shortcut.accessType) === 'child' ? 'child' : 'parent'}`}
                      onClick={() => changeCurrentScreen(shortcut.screenName)}>
                      <span className="material-icons-round calendar-icon">{shortcut.iconName}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShortcutMenu
