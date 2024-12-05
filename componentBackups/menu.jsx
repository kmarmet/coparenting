import React, { useContext, useEffect } from 'react'
import globalState from '../context'
import ScreenNames from '@screenNames'
import Manager from '@manager'
import AppManager from '@managers/appManager'
import ThemeToggle from './screens/settings/themeToggle'

export default function Menu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, currentUser, theme } = state

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
    Manager.showPageContainer('show')
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

  useEffect(() => {
    if (menuIsOpen) {
      Manager.showPageContainer('hide')
      setState({ ...state, showMenuButton: false })
      setTimeout(() => {
        document.querySelector('#menu').classList.add('open')
        addMenuItemAnimation().then((r) => r)
      }, 200)
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        cal.classList.add('hide')
      }
    } else {
      const cal = document.querySelector('.flatpickr-calendar')
      if (cal) {
        cal.classList.remove('hide')
      }
    }
  }, [menuIsOpen])

  return (
    <>
      <div id="menu" className={`${theme}`}>
        <div className="content">
          <ThemeToggle />
          <div id="menu-title">
            <div className="contents">
              <span className="title-icon material-icons-round">family_restroom</span>
              <p className="">Peaceful </p>
              <p className="">
                <span className="">co</span>Parenting
              </p>
              <p
                id="install-button"
                className="mb-20 button purple default"
                onClick={() => {
                  setState({ ...state, menuIsOpen: false })
                  document.querySelector('.install-app').classList.add('active')
                }}>
                Install App <span className="material-icons">install_mobile</span>
              </p>
            </div>
          </div>
          <div id="menu-items">
            <>
              {AppManager.getAccountType(currentUser) === 'parent' && (
                <>
                  <div
                    className={`menu-item mt-20 ${currentScreen === ScreenNames.coparentingSpace ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.coparentingSpace)}>
                    <span className="material-icons-round">meeting_room</span>
                    <p>Coparenting Space</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.chats)}>
                    <span className="material-icons-round">question_answer</span>
                    <p className="text">Chat</p>
                  </div>
                </>
              )}
              <>
                <div
                  className={`menu-item ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
                  onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
                  <span className="material-icons-round">calendar_month</span>
                  <p>Calendar</p>
                </div>
              </>
              {AppManager.getAccountType(currentUser) === 'parent' && (
                <>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
                    <span className="material-icons-round">paid</span>
                    <p>Expense Tracker</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
                    <span className="material-icons-round">swap_horizontal_circle</span>
                    <p>Swap Requests</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
                    <span className="material-icons-round">update</span>
                    <p>Transfer Change</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
                    <span className="material-icons-round">description</span>
                    <p>Documents</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.memories)}>
                    <span className="material-icons-round">collections</span>
                    <p>Memories</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.childSelector)}>
                    <span className="material-icons-round">face</span>
                    <p>Child Info</p>
                  </div>
                  <div
                    className={`menu-item ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                    onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
                    <span className="material-icons-round">family_restroom</span>
                    <p>Coparents</p>
                  </div>
                </>
              )}
            </>
            <div
              className={`menu-item ${currentScreen === ScreenNames.account ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.account)}>
              <span className="material-icons-round">manage_accounts</span>
              <p>Account</p>
            </div>
            <div
              className={`menu-item ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.settings)}>
              <span className="material-icons">settings</span>
              <p>Settings</p>
            </div>
            <div className={`menu-item`} onClick={logout}>
              <span className="material-icons">logout</span> <p>Logout</p>
            </div>
            <p className="center-text mt-20">Hello {currentUser?.name?.formatNameFirstNameOnly()}!</p>
          </div>
          <span
            onClick={async (e) => {
              Manager.showPageContainer('show')
              await deleteMenuAnimation()
              if (currentScreen === ScreenNames.calendar) {
                setState({ ...state, menuIsOpen: false, currentScreen: ScreenNames.chats })
                setTimeout(() => {
                  setState({ ...state, menuIsOpen: false, currentScreen: ScreenNames.calendar })
                }, 100)
              }
            }}
            className={`material-icons-round back mb-20`}>
            arrow_back_ios
          </span>
        </div>
      </div>
    </>
  )
}