// Path: src\components\fullMenu.jsx
import {getAuth, signOut} from 'firebase/auth'
import React, {useContext, useEffect} from 'react'
import {AiOutlineLogout} from 'react-icons/ai'
import {BsHouses, BsImages} from 'react-icons/bs'
import {GrInstallOption, GrSettingsOption, GrUserAdmin} from 'react-icons/gr'
import {IoChatbubblesOutline} from 'react-icons/io5'
import {LiaFileInvoiceDollarSolid} from 'react-icons/lia'
import {LuCalendarDays} from 'react-icons/lu'
import {MdOutlineContacts} from 'react-icons/md'
import {PiFiles, PiNotificationFill, PiSealQuestion, PiSwap, PiUsers, PiUsersThree, PiVault} from 'react-icons/pi'
import {RiAccountPinCircleLine, RiParentLine} from 'react-icons/ri'
import {TbTransferIn} from 'react-icons/tb'
import {useSwipeable} from 'react-swipeable'
import ScreenNames from '../constants/screenNames'
import globalState from '../context'
import useCurrentUser from '../hooks/useCurrentUser'
import DomManager from '../managers/domManager'
import Manager from '../managers/manager'
import NotificationBadge from './shared/NotificationBadge'
import Overlay from './shared/overlay'

export default function FullMenu() {
  const {state, setState} = useContext(globalState)
  const {currentScreen, menuIsOpen} = state
  const {currentUser} = useCurrentUser()

  const handlers = useSwipeable({
    swipeDuration: 300,
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      setState({...state, menuIsOpen: false})
    },
  })

  const auth = getAuth()

  const ChangeCurrentScreen = async (screen) => setState({...state, currentScreen: screen, refreshKey: Manager.GetUid(), menuIsOpen: false})

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

  useEffect(() => {
    console.log(currentUser)
  }, [currentUser])

  return (
    <Overlay show={menuIsOpen}>
      <div className="swipe-bar"></div>
      {Manager.IsValid(currentUser) && (
        <div
          style={DomManager.AnimateDelayStyle(1, 0.1)}
          id="full-menu-wrapper"
          {...handlers}
          className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(menuIsOpen, '.fade-up-wrapper')}`}>
          <div id="full-menu" className={`full-menu-wrapper ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
            <div id="menu-sections">
              <div className="section sharing">
                {/* SHARING */}
                <p style={DomManager.AnimateDelayStyle(1, 0.3)} className={`menu-title sharing ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                  Sharing
                </p>
                <div
                  style={DomManager.AnimateDelayStyle(1, 0.3)}
                  className={`menu-items sharing ${DomManager.Animate.FadeInUp(menuIsOpen, 'slower')}`}>
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
                    <div className="content">
                      <div className="svg-wrapper">
                        <BsImages />
                      </div>
                      <p>Memories</p>
                    </div>
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

                  {/* UPDATES */}
                  <div
                    className={`menu-item updates ${currentScreen === ScreenNames.updates ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.updates, e)}>
                    <NotificationBadge classes={'menu'} />
                    <div className="content">
                      <div className="svg-wrapper">
                        <PiNotificationFill />
                      </div>
                      <p>Updates</p>
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              {/* INFORMATION DATABASE */}
              <div className="section info-storage">
                <p style={DomManager.AnimateDelayStyle(2, 0.3)} className={`menu-title info-storage ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                  Information Database
                </p>
                <div
                  style={DomManager.AnimateDelayStyle(2, 0.3)}
                  className={`menu-items info-storage ${DomManager.Animate.FadeInUp(menuIsOpen, 'slower')}`}>
                  {/* CONTACTS */}
                  <div
                    className={`menu-item contacts ${currentScreen === ScreenNames.contacts ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.contacts, e)}>
                    <div className="svg-wrapper">
                      <MdOutlineContacts />
                    </div>
                    <p>Contacts</p>
                  </div>
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
                      {/* CHILDREN */}
                      <div
                        className={`menu-item child-info ${currentScreen === ScreenNames.children ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.children, e)}>
                        <div className="content">
                          <div className="svg-wrapper">
                            <PiUsersThree />
                          </div>
                          <p>Children</p>
                        </div>
                      </div>

                      {/* COPARENTS */}
                      <div
                        className={`menu-item coparents ${currentScreen === ScreenNames.coparents ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.coparents, e)}>
                        <div className="svg-wrapper">
                          <PiUsers />
                        </div>
                        <p>Co-Parents</p>
                      </div>

                      {/* VISITATION */}
                      <div
                        className={`menu-item visitation ${currentScreen === ScreenNames.visitation ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.visitation, e)}>
                        <div className="content">
                          <div className="svg-wrapper">
                            <BsHouses />
                          </div>
                          <p>Visitation</p>
                        </div>
                      </div>

                      {/* ARCHIVES */}
                      <div
                        className={`menu-item archives ${currentScreen === ScreenNames.vault ? 'active' : ''}`}
                        onClick={(e) => ChangeCurrentScreen(ScreenNames.vault, e)}>
                        <div className="svg-wrapper">
                          <PiVault />
                        </div>
                        <p>The Vault</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <hr />

              {/* CO-PARENTING */}
              {currentUser?.accountType === 'parent' && (
                <div className="section coparenting">
                  <p style={DomManager.AnimateDelayStyle(3, 0.3)} className={`menu-title coparenting ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                    Co-Parenting
                  </p>
                  <div
                    style={DomManager.AnimateDelayStyle(3, 0.3)}
                    className={`menu-items coparenting ${DomManager.Animate.FadeInUp(menuIsOpen, 'slower')}`}>
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
                      <div className="content">
                        <div className="svg-wrapper">
                          <LiaFileInvoiceDollarSolid />
                        </div>
                        <p>Expenses</p>
                      </div>
                    </div>

                    {/* SWAP REQUESTS */}
                    <div
                      className={`menu-item swap-request ${currentScreen === ScreenNames.swapRequests ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.swapRequests, e)}>
                      <div className="svg-wrapper">
                        <PiSwap />
                      </div>
                      <p>Swap Requests</p>
                    </div>

                    {/* CHATS */}
                    <div
                      className={`menu-item chats ${currentScreen === ScreenNames.chats ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.chats, e)}>
                      <div className="content">
                        <div className="svg-wrapper">
                          <IoChatbubblesOutline />
                        </div>
                        <p className="text">Chats</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <hr />
              {/* PROFILE SETTINGS & SUPPORT */}
              <div className="section profile-settings-support">
                <p
                  style={DomManager.AnimateDelayStyle(4, 0.3)}
                  className={`menu-title profile-settings-support ${DomManager.Animate.FadeInUp(menuIsOpen)}`}>
                  Settings & Support
                </p>
                <div
                  style={DomManager.AnimateDelayStyle(4, 0.3)}
                  className={`menu-items profile-settings-support ${DomManager.Animate.FadeInUp(menuIsOpen, 'slower')}`}>
                  {/* PROFILE */}
                  <div
                    className={`menu-item profile ${currentScreen === ScreenNames.profile ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.profile, e)}>
                    <div className="svg-wrapper">
                      <RiAccountPinCircleLine />
                    </div>
                    <p>My Profile</p>
                  </div>

                  {/* SETTINGS */}
                  <div
                    className={`menu-item settings ${currentScreen === ScreenNames.settings ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.settings, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <GrSettingsOption />
                      </div>
                      <p>Settings</p>
                    </div>
                  </div>

                  {/* ADMIN DASHBOARD */}
                  {currentUser?.email === 'kmarmet1@gmail.com' && (
                    <div
                      className={`menu-item settings ${currentScreen === ScreenNames.adminDashboard ? 'active' : ''}`}
                      onClick={(e) => ChangeCurrentScreen(ScreenNames.adminDashboard, e)}>
                      <div className="svg-wrapper">
                        <GrUserAdmin />
                      </div>
                      <p>Dashboard</p>
                    </div>
                  )}

                  {/* HELP */}
                  <div
                    className={`menu-item help ${currentScreen === ScreenNames.help ? 'active' : ''}`}
                    onClick={(e) => ChangeCurrentScreen(ScreenNames.help, e)}>
                    <div className="content">
                      <div className="svg-wrapper">
                        <PiSealQuestion />
                      </div>
                      <p>Help</p>
                    </div>
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
                    <div className="content">
                      <div className="svg-wrapper">
                        <AiOutlineLogout />
                      </div>
                      <p>Logout</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Overlay>
  )
}