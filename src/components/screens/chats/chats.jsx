// Path: src\components\screens\chats\chats?.jsx
import React, {useContext, useState} from "react"
import {BsFillSendFill} from "react-icons/bs"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoChatbubblesSharp} from "react-icons/io5"
import CreationForms from "../../../constants/creationForms"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context.js"
import useChats from "../../../hooks/useChats"
import useCoParents from "../../../hooks/useCoParents"
import AlertManager from "../../../managers/alertManager"
import DomManager from "../../../managers/domManager"
import EmailManager from "../../../managers/emailManager"
import Manager from "../../../managers/manager"
import NewChat from "../../forms/newChat"
import NavBar from "../../navBar"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Screen from "../../shared/screen"
import ScreenActionsMenu from "../../shared/screenActionsMenu"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"
import Chat from "./chat"
import ChatRow from "./chatRow.jsx"

const Chats = () => {
      const {state, setState} = useContext(globalState)
      const {theme, creationFormToShow} = state
      const [showInvitationCard, setShowInvitationCard] = useState(false)
      const [inviteeName, setInviteeName] = useState("")
      const [inviteeEmail, setInviteeEmail] = useState("")
      const [showChat, setShowChat] = useState(false)
      const [recipient, setRecipient] = useState()
      const {chats} = useChats()
      const {coParents} = useCoParents()

      return (
            <Screen activeScreen={ScreenNames.chats} classes={`${showChat ? "no-padding" : ""}`}>
                  {/* INVITATION FORM */}
                  <Form
                        submitText={"Send Invitation"}
                        wrapperClass="invite-coparent-card"
                        title={"Invite Co-Parent"}
                        subtitle="Extend an invitation to a co-parent to facilitate the sharing of essential information with them"
                        onClose={() => setShowInvitationCard(false)}
                        showCard={showInvitationCard}
                        onSubmit={() => {
                              if (!Manager.IsValid(inviteeEmail) || !Manager.IsValid(inviteeName)) {
                                    AlertManager.throwError("Please fill out all fields")
                                    return false
                              }
                              EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, "", inviteeEmail, inviteeName)
                              setState({...state, successAlertMessage: "Invitation Sent!"})
                              setShowInvitationCard(false)
                        }}
                        hideCard={() => setShowInvitationCard(false)}>
                        <Spacer height={5} />
                        <InputField
                              inputType={InputTypes.text}
                              placeholder={"Co-Parent Name"}
                              required={true}
                              onChange={(e) => setInviteeName(e.target.value)}
                        />
                        <InputField
                              inputType={InputTypes.email}
                              placeholder={"Co-Parent Email Address"}
                              required={true}
                              onChange={(e) => setInviteeEmail(e.target.value)}
                        />
                  </Form>

                  {/* NEW CHAT FORM */}
                  <NewChat
                        onClick={(coParent) => {
                              setShowChat(true)
                              setRecipient(coParent)
                        }}
                        show={creationFormToShow === CreationForms.chat}
                        hide={() => setState({...state, creationFormToShow: null})}
                  />

                  <Chat show={showChat} hide={() => setShowChat(false)} recipient={recipient} />

                  {/*  SCREEN ACTIONS */}
                  <ScreenActionsMenu title="Manage Chats">
                        <div
                              className="action-item more-text"
                              onClick={() => {
                                    setShowInvitationCard(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>
                                          Invite Another Co-Parent
                                          <span className={"subtitle"}>
                                                Currently, your account is linked to {coParents?.length}{" "}
                                                {coParents?.length > 1 ? "Co-Parents" : "Co-Parent"}. Feel free to invite another Co-Parent.
                                          </span>
                                    </p>
                                    <div className="svg-wrapper invite-co-parent">
                                          <BsFillSendFill className={"paper-airplane"} />
                                    </div>
                              </div>
                        </div>
                  </ScreenActionsMenu>

                  {/* PAGE CONTAINER */}
                  {!showChat && (
                        <div id="chats-container" className={`${theme} chats page-container`}>
                              <ScreenHeader
                                    screenName={ScreenNames.chats}
                                    title={"Chats"}
                                    titleIcon={<IoChatbubblesSharp />}
                                    screenDescription="Your space to peacefully chat with your co-parent and pass along any important info they need to know, or to seek clarification on
          information that is unfamiliar to you"
                              />

                              <div className="screen-content bottom-padding-only">
                                    {/* NO DATA FALLBACK */}
                                    {chats?.length === 0 && <p className={"no-data-fallback-text"}>No Chats</p>}
                                    {/* CHAT ROWS */}
                                    {Manager.IsValid(chats) &&
                                          chats?.map((chat, index) => {
                                                return (
                                                      <ChatRow
                                                            chat={chat}
                                                            onClick={(otherMember) => {
                                                                  setShowChat(true)
                                                                  setRecipient(otherMember)
                                                            }}
                                                            key={index}
                                                            index={index}
                                                      />
                                                )
                                          })}
                              </div>
                              {!showChat && (
                                    <>
                                          {/* NAVBAR */}
                                          <NavBar navbarClass={"white"}>
                                                <div
                                                      style={DomManager.AnimateDelayStyle(1, 0.06)}
                                                      onClick={() => setState({...state, showScreenActions: true})}
                                                      className={`menu-item ${DomManager.Animate.FadeInUp(true, ".menu-item")}`}>
                                                      <HiDotsHorizontal className={"screen-actions-menu-icon more"} />
                                                      <p>More</p>
                                                </div>
                                          </NavBar>
                                    </>
                              )}
                        </div>
                  )}
            </Screen>
      )
}

export default Chats