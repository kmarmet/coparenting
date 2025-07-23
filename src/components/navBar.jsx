// Path: src\components\navBar.jsx
import moment from "moment"
import React, {useContext, useEffect} from "react"
import {BsCalendar, BsCalendar2Fill} from "react-icons/bs"
import {IoMdImages} from "react-icons/io"
import {IoChatbubblesOutline, IoChatbubblesSharp, IoNotifications, IoNotificationsOutline} from "react-icons/io5"
import {PiPlusBold} from "react-icons/pi"
import {TbMenu2} from "react-icons/tb"
import ScreenNames from "../constants/screenNames"
import globalState from "../context"
import useCurrentUser from "../hooks/useCurrentUser"
import useUpdates from "../hooks/useUpdates"
import DomManager from "../managers/domManager"
import Manager from "../managers/manager"

export default function NavBar({children, navbarClass}) {
      const {state, setState} = useContext(globalState)
      const {currentScreen, creationFormToShow, theme, menuIsOpen} = state
      const {currentUser} = useCurrentUser()
      const {updates} = useUpdates()

      const screensToHideUpdates = [ScreenNames.children, ScreenNames.coparents, ScreenNames.chats, ScreenNames.contacts, ScreenNames.docViewer]

      const ChangeCurrentScreen = async (screen) => {
            setState({
                  ...state,
                  currentScreen: screen,
                  activeChild: null,
                  refreshKey: Manager.GetUid(),
                  notificationCount: 0,
            })
      }

      useEffect(() => {
            const addNewButton = document.getElementById("add-new-button")
            if (addNewButton) {
                  if (addNewButton.classList.contains("add")) {
                        addNewButton.classList.remove("add")
                        addNewButton.classList.add("close")
                  }
            }
      }, [currentScreen])

      if (creationFormToShow) {
            return null
      }

      return (
            <>
                  <div
                        id="navbar"
                        className={`${theme} ${DomManager.Animate.FadeInUp(true, ".menu-item")} ${currentUser?.accountType} ${navbarClass} ${menuIsOpen ? "hide" : ""}`}>
                        <div id="menu-items" className="flex">
                              {/* MENU */}
                              <div
                                    style={DomManager.AnimateDelayStyle(1, 0.07)}
                                    onClick={() => setState({...state, showCreationMenu: false, menuIsOpen: true, showOverlay: true})}
                                    className={`menu-item menu-button ${DomManager.Animate.FadeInUp(true, ".menu-item")}`}>
                                    <TbMenu2 className={"menu"} />
                                    <p>Menu</p>
                              </div>
                              {/* CALENDAR */}
                              <div
                                    style={DomManager.AnimateDelayStyle(1, 0.02)}
                                    onClick={() => ChangeCurrentScreen(ScreenNames.calendar)}
                                    className={`${currentScreen === ScreenNames.calendar ? "active menu-item" : "menu-item"} `}>
                                    <div id="calendar-and-month">
                                          {currentScreen === ScreenNames.calendar && <BsCalendar2Fill />}
                                          {currentScreen !== ScreenNames.calendar && <BsCalendar />}
                                          <span>{moment().format("D")}</span>
                                    </div>

                                    <p>Calendar</p>
                              </div>

                              {/* CREATE BUTTON */}
                              <div
                                    className={`menu-item create-button`}
                                    onClick={() => setState({...state, showOverlay: true, showCreationMenu: true})}>
                                    <div id="svg-wrapper">
                                          <PiPlusBold className={"create-icon"} />
                                    </div>
                              </div>

                              {/* CHATS */}
                              {currentUser && currentUser?.accountType === "parent" && (
                                    <div
                                          style={DomManager.AnimateDelayStyle(1, 0.03)}
                                          id="chat-menu-item"
                                          onClick={() => ChangeCurrentScreen(ScreenNames.chats)}
                                          className={`${currentScreen === ScreenNames.chats ? "active menu-item" : "menu-item"}`}>
                                          {currentScreen === ScreenNames.chats && <IoChatbubblesSharp className={"chats"} />}
                                          {currentScreen !== ScreenNames.chats && <IoChatbubblesOutline className={"chats"} />}
                                          <p>Chats</p>
                                    </div>
                              )}
                              {/* MEMORIES */}
                              {currentUser?.accountType === "child" && currentScreen !== ScreenNames.parents && (
                                    <div
                                          style={DomManager.AnimateDelayStyle(1, 0.05)}
                                          id="memories-menu-item"
                                          onClick={() => ChangeCurrentScreen(ScreenNames.memories)}
                                          className={`${currentScreen === ScreenNames.memories ? "active menu-item" : "menu-item"}`}>
                                          <IoMdImages />
                                          <p>Memories</p>
                                    </div>
                              )}
                              {/* UPDATES */}
                              {currentUser?.accountType === "parent" && !screensToHideUpdates.includes(currentScreen) && (
                                    <div
                                          style={DomManager.AnimateDelayStyle(1, 0.06)}
                                          onClick={() => ChangeCurrentScreen(ScreenNames.updates)}
                                          className={`${Manager.IsValid(updates) ? "unread" : ""} ${currentScreen === ScreenNames.updates ? "active menu-item updates" : "menu-item updates"}`}>
                                          {currentScreen === ScreenNames.updates && <IoNotifications className={"updates"} />}
                                          {currentScreen !== ScreenNames.updates && <IoNotificationsOutline className={"updates"} />}
                                          {Manager.IsValid(updates) && <span className="notification-badge navbar">{updates?.length}</span>}
                                    </div>
                              )}
                              {Manager.IsValid(children) && children}
                        </div>
                  </div>
            </>
      )
}