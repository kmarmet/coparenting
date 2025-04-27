// Path: src\components\fullMenu.jsx
import React, {useContext} from 'react'
import globalState from '../context'
import ScreenNames from '../constants/screenNames'
import Manager from '../managers/manager'
import {getAuth, signOut} from 'firebase/auth'
import {BsHouses, BsImages} from 'react-icons/bs'
import {PiFiles, PiIdentificationCard, PiSwapLight, PiUserCircleCheckLight, PiUsersLight, PiVaultLight} from 'react-icons/pi'
import {IoChatbubblesOutline, IoClose, IoSettingsOutline} from 'react-icons/io5'
import {GrInstallOption, GrUserAdmin} from 'react-icons/gr'
import {RiMailSendLine, RiParentLine} from 'react-icons/ri'
import {LuBellRing, LuCalendarDays} from 'react-icons/lu'
import Overlay from './shared/overlay'
import {AiOutlineLogout} from 'react-icons/ai'
import useCurrentUser from '../hooks/useCurrentUser'
import {LiaFileInvoiceDollarSolid} from 'react-icons/lia'
import {TbTransferIn} from 'react-icons/tb'

export default function FullMenu() {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen, theme, notificationCount} = state
  const {currentUser} = useCurrentUser()
  const auth = getAuth()

  const ChangeCurrentScreen = async (screen) => setState({...state, currentScreen: screen, refreshKey: Manager.getUid(), menuIsOpen: false})

  const Logout = () => {
    const pageOverlay = document.getElementById('page-overlay')
    if (pageOverlay) {
      pageOverlay.classList.remove('active')
    }

    signOut(auth)
      .then(() => {
        window.location.reload()
        // Sign-out successful.
        console.log('User signed out manually')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  return (
    <Overlay show={menuIsOpen}>
      <div id="full-menu" className={`${theme} ${menuIsOpen ? 'open' : 'closed'}`}>
        <p className="menu-title mt-0 admin">Admin</p>
        <div className="menu-items admin">
          {currentUser?.email === 'kmarmet1@gmail.com' && (
            <div
              className={`menu-item admin ${currentScreen === ScreenNames.onboarding ? 'active' : ''}`}
              onClick={(e) => ChangeCurrentScreen(ScreenNames.onboarding, e)}>
              <p>Onboarding</p>
            </div>
          )}
          {/* ADMIN DASHBOARD */}
          {currentUser?.email === 'kmarmet1@gmail.com' && (
            <div
              className={`menu-item admin ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
              onClick={(e) => ChangeCurrentScreen(ScreenNames.adminDashboard, e)}>
              <div className="svg-wrapper">
                <GrUserAdmin />
              </div>
              <p>Dashboard</p>
            </div>
          )}
        </div>

        <hr />

        {/* SHARING */}
        <p className="menu-title sharing">Sharing</p>
        <div className="menu-items sharing">
          {/* CALENDAR */}
          <div
            className={`menu-item calendar ${currentScreen === ScreenNames.calendar ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.calendar, e)}>
            <div className="svg-wrapper">
              <LuCalendarDays />
            </div>
            <p>Calendar</p>
          </div>
          {/* MEMORIES */}
          <div
            className={`menu-item memories ${currentScreen === ScreenNames.memories ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.memories, e)}>
            <div className="svg-wrapper">
              <BsImages />
            </div>
            <p>Memories</p>
          </div>

          {/* DOCUMENTS */}
          {currentUser?.accountType === 'parent' && (
            <div
              className={`menu-item documents ${currentScreen === ScreenNames.docsList ? 'active' : ''}`}
              onClick={(e) => ChangeCurrentScreen(ScreenNames.docsList, e)}>
              <div className="svg-wrapper">
                <PiFiles />
              </div>
              <p>Documents</p>
            </div>
          )}

          {/* NOTIFICATIONS */}
          <div
            className={`menu-item notifications ${currentScreen === ScreenNames.notifications ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.notifications, e)}>
            {notificationCount > 0 && <div className="badge"></div>}
            <div className="svg-wrapper">
              <LuBellRing />
            </div>
            <p>Notifications</p>
          </div>
        </div>
        <hr />
        {/* INFORMATION DATABASE */}
        <p className="menu-title info-storage">Information Database</p>
        <div className="menu-items info-storage">
          {/* CHILD - PARENTS */}
          {currentUser?.accountType === 'child' && (
            <div
              className={`menu-item parents ${currentScreen === ScreenNames.parents ? 'active' : ''}`}
              onClick={(e) => ChangeCurrentScreen(ScreenNames.parents, e)}>
              <div className="svg-wrapper">
                <RiParentLine />
              </div>
              <p>Parents</p>
            </div>
          )}

          {/* PARENTS ONLY */}
          {currentUser?.accountType === 'parent' && (
            <>
              {/* CHILD INFO */}
              <div
                className={`menu-item child-info ${currentScreen === ScreenNames.childInfo ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.childInfo, e)}>
                <div className="svg-wrapper">
                  <PiIdentificationCard />
                </div>
                <p>Child Info</p>
              </div>

              {/* COPARENTS */}
              <div
                className={`menu-item coparents ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.coparents, e)}>
                <div className="svg-wrapper">
                  <PiUsersLight />
                </div>
                <p>Co-Parents</p>
              </div>

              {/* VISITATION */}
              <div
                className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.visitation, e)}>
                <div className="svg-wrapper">
                  <BsHouses />
                </div>
                <p>Visitation</p>
              </div>

              {/* ARCHIVES */}
              <div
                className={`menu-item archives ${currentScreen === ScreenNames.vault ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.vault, e)}>
                <div className="svg-wrapper">
                  <PiVaultLight />
                </div>
                <p>The Vault</p>
              </div>
              <hr />
            </>
          )}
        </div>

        {/* CO-PARENTING */}
        {currentUser?.accountType === 'parent' && (
          <>
            <p className="menu-title coparenting">Co-Parenting</p>
            <div className="menu-items coparenting">
              {/* TRANSFER CHANGE */}
              <div
                className={`menu-item transfer-change ${currentScreen === ScreenNames.transferRequests ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.transferRequests, e)}>
                <div className="svg-wrapper">
                  <TbTransferIn />
                </div>
                <p>Transfer Requests</p>
              </div>

              {/* EXPENSES */}
              <div
                className={`menu-item expenses ${currentScreen === ScreenNames.expenseTracker ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.expenseTracker, e)}>
                <div className="svg-wrapper">
                  <LiaFileInvoiceDollarSolid />
                </div>
                <p>Expenses</p>
              </div>

              {/* SWAP REQUESTS */}
              <div
                className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.swapRequests, e)}>
                <div className="svg-wrapper">
                  <PiSwapLight />
                </div>
                <p>Swap Requests</p>
              </div>

              {/* CHATS */}
              <div
                className={`menu-item chats ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                onClick={(e) => ChangeCurrentScreen(ScreenNames.chats, e)}>
                <div className="svg-wrapper">
                  <IoChatbubblesOutline />
                </div>
                <p className="text">Chats</p>
              </div>
            </div>
          </>
        )}
        <hr />
        {/* PROFILE SETTINGS & SUPPORT */}
        <p className="menu-title profile-settings-support">Settings & Support</p>
        <div className="menu-items profile-settings-support">
          {/* PROFILE */}
          <div
            className={`menu-item profile ${currentScreen === ScreenNames.profile ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.profile, e)}>
            <div className="svg-wrapper">
              <PiUserCircleCheckLight />
            </div>
            <p>My Profile</p>
          </div>

          {/* SETTINGS */}
          <div
            className={`menu-item settings ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.settings, e)}>
            <div className="svg-wrapper">
              <IoSettingsOutline />
            </div>
            <p>Settings</p>
          </div>

          {/* CONTACT US */}
          <div
            className={`menu-item contact-us ${currentScreen === ScreenNames.contactUs ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.contactUs, e)}>
            <div className="svg-wrapper">
              <RiMailSendLine />
            </div>
            <p>Contact Us</p>
          </div>

          {/* INSTALL APP BUTTON */}
          <div
            className={`menu-item install-app ${currentScreen === ScreenNames.installApp ? 'active' : ''}`}
            onClick={(e) => ChangeCurrentScreen(ScreenNames.installApp, e)}>
            <div className="svg-wrapper">
              <GrInstallOption />
            </div>
            <p>Install</p>
          </div>
          {/* LOGOUT BUTTON */}

          <div className={`menu-item logout`} onClick={Logout}>
            <div className="svg-wrapper">
              <AiOutlineLogout />
            </div>
            <p>Logout</p>
          </div>
        </div>
        <div id="close-icon-wrapper">
          <IoClose onClick={() => setState({...state, menuIsOpen: false})} id={'close-icon'} />
        </div>
      </div>
    </Overlay>
  )
}