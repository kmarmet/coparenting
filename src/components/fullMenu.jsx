// Path: src\components\fullMenu.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import Manager from '../managers/manager'
import AppManager from '../managers/appManager'
import { getAuth, signOut } from 'firebase/auth'
import { VscSettings } from 'react-icons/vsc'
import { RxActivityLog } from 'react-icons/rx'
import {
  PiArchiveDuotone,
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
} from 'react-icons/pi'
import { GrInstallOption } from 'react-icons/gr'
import DB_UserScoped from '../database/db_userScoped'
import { RiMailSendLine } from 'react-icons/ri'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { BsPeople } from 'react-icons/bs'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { BiFace } from 'react-icons/bi'
import BottomCard from './shared/bottomCard'
import DB from '../database/DB'

export default function FullMenu() {
  const { state, setState } = useContext(globalState)
  const { currentScreen, menuIsOpen, theme, currentUser, authUser } = state

  const auth = getAuth()

  const changeCurrentScreen = async (screen) => {
    const _user = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentScreen: screen, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: _user })
  }

  const changeTheme = async (theme) => {
    await DB_UserScoped.updateUserRecord(currentUser?.phone, `settings/theme`, theme)
    window.location.reload()
  }

  const logout = () => {
    const pageOverlay = document.getElementById('page-overlay')
    const currentUserFromLocalStorage = JSON.parse(localStorage.getItem('currentUser'))
    if (currentUserFromLocalStorage) {
      localStorage.removeItem('currentUser')
    }
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
    <BottomCard
      wrapperClass="full-menu"
      title={'Menu'}
      className={`full-menu ${theme}`}
      showCard={menuIsOpen}
      onClose={() => {}}
      hasDelete={false}
      hasSubmitButton={false}>
      <div id="full-menu" className={`${theme} ${menuIsOpen ? 'active' : ''}`}>
        {/* ADMIN DASHBOARD */}
        {/*{currentUser?.email === 'kmarmet1@gmail.com' && (*/}
        {/*  <div*/}
        {/*    className={`menu-item admin ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}*/}
        {/*    onClick={() => changeCurrentScreen(ScreenNames.adminDashboard)}>*/}
        {/*    <PiToolboxDuotone />*/}
        {/*    <p>Admin Dashboard</p>*/}
        {/*  </div>*/}
        {/*)}*/}
        {/* CALENDAR */}
        <div
          className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.calendar)}>
          <PiCalendarDotsDuotone />
          <p>Calendar</p>
        </div>

        {/* ACTIVITY */}
        <div
          className={`menu-item activity ${currentScreen === ScreenNames.activity ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.activity)}>
          <RxActivityLog />
          <p>Activity</p>
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
              className={`menu-item chats ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.chats)}>
              <PiChatsCircleDuotone />
              <p className="text">Chats</p>
            </div>

            {/* EXPENSES */}
            <div
              className={`menu-item expenses ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.expenseTracker)}>
              <PiMoneyWavyDuotone />
              <p>Expenses</p>
            </div>

            {/* SWAP REQUESTS */}
            <div
              className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.swapRequests)}>
              <PiSwapDuotone />
              <p>Swaps</p>
            </div>

            {/* TRANSFER CHANGE */}
            <div
              className={`menu-item transfer-change ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.transferRequests)}>
              <PiCarProfileDuotone />
              <p>Transfers</p>
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
              <p>Co-Parents</p>
            </div>

            {/* RECORDS */}
            <div
              className={`menu-item records ${currentScreen === ScreenNames.records ? 'active' : ''}`}
              onClick={() => changeCurrentScreen(ScreenNames.records)}>
              <PiArchiveDuotone />
              <p>Records</p>
            </div>
          </>
        )}

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
          <VscSettings /> <p>Settings</p>
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
        {/* INSTALL APP BUTTON */}
        <div
          className={`menu-item install-app ${currentScreen === ScreenNames.installApp ? 'active' : ''}`}
          onClick={() => changeCurrentScreen(ScreenNames.installApp)}>
          <GrInstallOption />
          <p>Install</p>
        </div>
        {/* LOGOUT BUTTON */}
        <div className={`menu-item logout`} onClick={logout}>
          <PiSignOutDuotone />
          <p>Logout</p>
        </div>
      </div>
    </BottomCard>
  )
}
