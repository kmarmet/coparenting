import React, { useContext } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import ScreenNames from '@screenNames'
import globalState from '../../context'
import Manager from '@manager'
import AppManager from '@managers/appManager'
import { getAuth, signOut } from 'firebase/auth'
// ICONS
import {
  PiCalendarDotsDuotone,
  PiCarProfileDuotone,
  PiChatsCircleDuotone,
  PiHouseLineDuotone,
  PiImagesSquareDuotone,
  PiMoneyWavyDuotone,
  PiMoonStarsDuotone,
  PiSignOutDuotone,
  PiSunDuotone,
  PiSwapDuotone,
  PiToolboxDuotone,
} from 'react-icons/pi'
import DB_UserScoped from '@userScoped'
import { RiMailSendLine } from 'react-icons/ri'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { BsPeople } from 'react-icons/bs'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { FiSettings } from 'react-icons/fi'
import { BiFace } from 'react-icons/bi'

export default function SideNavbar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, currentScreen } = state

  const auth = getAuth()

  const changeCurrentScreen = (screen) => {
    setState({ ...state, currentScreen: screen, updateKey: Manager.getUid(), menuIsOpen: false })
    Manager.showPageContainer('show')
  }

  const changeTheme = async (theme) => {
    console.log(theme)
    await DB_UserScoped.updateUserRecord(currentUser?.phone, `settings/theme`, theme)
    window.location.reload()
  }

  const logout = () => {
    const pageOverlay = document.getElementById('page-overlay')
    if (pageOverlay) {
      pageOverlay.classList.remove('active')
    }
    signOut(auth)
      .then(() => {
        window.location.reload()
        // Sign-out successful.
        console.log('User signed out')
      })
      .catch((error) => {
        // An error happened.
      })
  }

  return (
    <div id="side-navbar" className={theme}>
      <div id="top">
        {/* ADMIN DASHBOARD */}
        {currentUser?.email === 'kmarmet1@gmail.com' && (
          <div
            className={`menu-item admin ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
            onClick={() => changeCurrentScreen(ScreenNames.adminDashboard)}>
            <PiToolboxDuotone />
            <p>Admin Dashboard</p>
          </div>
        )}
        {/* CALENDAR */}
        <div
          className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
          <PiCalendarDotsDuotone />
          <p>Calendar</p>
        </div>

        {/* PARENTS ONLY */}
        {AppManager.getAccountType(currentUser) === 'parent' && (
          <>
            {/* VISITATION */}
            <div
              className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.visitation)}>
              <PiHouseLineDuotone />
              <p>Visitation</p>
            </div>

            {/* CHATS */}
            <div
              className={`menu-item chats ${currentScreen === ScreenNames.chats || currentScreen === ScreenNames.conversation ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.chats)}>
              <PiChatsCircleDuotone />
              <p className="text">Chats</p>
            </div>

            {/* EXPENSES */}
            <div
              className={`menu-item expenses ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
              <PiMoneyWavyDuotone />
              <p>Expense Tracker</p>
            </div>

            {/* SWAP REQUESTS */}
            <div
              className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
              <PiSwapDuotone />
              <p>Swap Requests</p>
            </div>

            {/* TRANSFER CHANGE */}
            <div
              className={`menu-item transfer-change ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
              <PiCarProfileDuotone />
              <p>Transfer Change</p>
            </div>

            {/* DOCUMENTS */}
            <div
              className={`menu-item documents ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.docsList)}>
              <HiOutlineDocumentText />
              <p>Documents</p>
            </div>
          </>
        )}
        {AppManager.getAccountType(currentUser) === 'parent' && (
          <>
            {/* MEMORIES */}
            <div
              className={`menu-item memories ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.memories)}>
              <PiImagesSquareDuotone />
              <p>Memories</p>
            </div>

            {/* CHILD INFO */}
            <div
              className={`menu-item child-info ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.childInfo)}>
              <BiFace />
              <p>Child Info</p>
            </div>

            {/* COPARENTS */}
            <div
              className={`menu-item coparents ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.coparents)}>
              <BsPeople />
              <p>Coparents</p>
            </div>
          </>
        )}
      </div>

      <div id="bottom">
        {/* ACCOUNT */}
        <div
          className={`menu-item account ${currentScreen === ScreenNames.account ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.account)}>
          <MdOutlineManageAccounts />
          <p>Account</p>
        </div>

        {/* SETTINGS */}
        <div
          className={`menu-item settings ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.settings)}>
          {/*<span className="material-icons-round">settings</span>*/}
          <FiSettings /> <p>Settings</p>
        </div>

        {/* CONTACT US */}
        <div
          className={`menu-item contact-us ${currentScreen === ScreenNames.contactUs ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.contactUs)}>
          <RiMailSendLine />
          <p>Contact Us</p>
        </div>

        {/* THEME TOGGLE */}
        {currentUser?.settings?.theme === 'dark' && (
          <div className="menu-item theme">
            <PiSunDuotone />
            <p onClick={() => changeTheme('light')}>Light Mode</p>
          </div>
        )}
        {currentUser?.settings?.theme === 'light' && (
          <div className="menu-item theme">
            <PiMoonStarsDuotone />
            <p onClick={() => changeTheme('dark')}> Dark Mode</p>
          </div>
        )}

        {/* LOGOUT BUTTON */}
        <div className={`menu-item logout`} onClick={logout}>
          <PiSignOutDuotone />
          <p>Logout</p>
        </div>
      </div>
    </div>
  )
}