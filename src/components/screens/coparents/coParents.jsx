// Path: src\components\screens\parents\parents.jsx
import React, {useContext, useEffect, useRef, useState} from "react"
import {BsFillSendFill} from "react-icons/bs"
import {CgClose} from "react-icons/cg"
import {FaWandMagicSparkles} from "react-icons/fa6"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoPersonAdd, IoPersonRemove} from "react-icons/io5"
import {PiUsersFill} from "react-icons/pi"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useCoParents from "../../../hooks/useCoParents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import DomManager from "../../../managers/domManager"
import EmailManager from "../../../managers/emailManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import NavBar from "../../navBar.jsx"
import AddressInput from "../../shared/addressInput"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Screen from "../../shared/screen"
import ScreenActionsMenu from "../../shared/screenActionsMenu"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"
import CustomCoParentInfo from "./customCoParentInfo"
import NewCoParentForm from "./newCoParentForm"

export default function CoParents() {
      const {state, setState} = useContext(globalState)
      const {theme, refreshKey} = state

      // Hooks
      const {currentUser} = useCurrentUser()
      const {coParents} = useCoParents()

      // State
      const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
      const [showNewCoParentFormCard, setShowNewCoParentFormCard] = useState(false)
      const [activeCoParent, setActiveCoParent] = useState(coParents?.[0])
      const [showInvitationForm, setShowInvitationForm] = useState(false)
      const invite = useRef({name: "", email: ""})

      const DeleteProp = async (prop) => {
            const coparentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)
            if (Manager.IsValid(coparentIndex)) {
                  await DB_UserScoped.DeleteCoparentInfoProp(currentUser?.key, coparentIndex, StringManager.formatDbProp(prop), activeCoParent)
            }
      }

      const Update = async (prop, value) => {
            const coParentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)

            if (!Manager.IsValid(coParentIndex)) {
                  return
            }
            await DB_UserScoped.UpdateCoparent(currentUser?.key, coParentIndex, StringManager.formatDbProp(prop), value)
            setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
      }

      const DeleteCoParent = async () => {
            const coParentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)
            if (!Manager.IsValid(coParentIndex)) {
                  return
            }
            await DB_UserScoped.DeleteCoParent(currentUser, coParentIndex, activeCoParent?.userKey)
            await DB_UserScoped.DeleteSharedDataUserKey(currentUser, activeCoParent?.userKey)
            setState({
                  ...state,
                  successAlertMessage: `${StringManager.GetFirstNameAndLastInitial(activeCoParent?.name)} Has Been Removed as a Contact`,
                  showScreenActions: false,
            })
      }

      const HandleCoParentChange = (coParent) => {
            setActiveCoParent(coParent)
            setShowCustomInfoCard(false)
      }

      useEffect(() => {
            if (!Manager.IsValid(coParents)) {
                  setActiveCoParent(null)
            } else {
                  if (Manager.IsValid(coParents) && !Manager.IsValid(activeCoParent)) {
                        setActiveCoParent(coParents?.[0])
                  }
                  if (Manager.IsValid(activeCoParent) && Manager.IsValid(coParents)) {
                        const coparentId = activeCoParent?.id
                        const updatedCoparent = coParents?.find((x) => x?.id === coparentId)
                        setActiveCoParent(updatedCoparent)
                  }
            }
      }, [coParents])

      return (
            <Screen
                  activeScreen={ScreenNames.coparents}
                  loadingByDefault={true}
                  stopLoadingBool={Manager.IsValid(coParents) && Manager.IsValid(activeCoParent)}>
                  {/* CUSTOM INFO FORM */}
                  <CustomCoParentInfo
                        hideCard={() => setShowCustomInfoCard(false)}
                        onAdd={(coParent) => setActiveCoParent(coParent)}
                        activeCoparent={activeCoParent}
                        showCard={showCustomInfoCard}
                  />

                  {/* NEW CO-PARENT FORM */}
                  <NewCoParentForm showCard={showNewCoParentFormCard} hideCard={() => setShowNewCoParentFormCard(false)} />

                  {/*  SCREEN ACTIONS */}
                  <ScreenActionsMenu title="Manage Co-Parents">
                        {/* ADD CO-PARENT */}
                        <div
                              className="action-item more-text"
                              onClick={() => {
                                    setShowNewCoParentFormCard(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>
                                          Add a Co-Parent
                                          <span className="subtitle">
                                                Store information and provide sharing permissions for a co-parent who that has not been added to your
                                                profile yet
                                          </span>
                                    </p>
                                    <div className="svg-wrapper">
                                          <IoPersonAdd className={"add-co-parent fs-22"} />
                                    </div>
                              </div>
                        </div>

                        {/* ONLY SHOW IF THERE ARE CO-PARENTS  */}
                        {Manager.IsValid(coParents) && (
                              <>
                                    {/*  ADD CUSTOM INFO */}
                                    <div
                                          className="action-item more-text"
                                          onClick={() => {
                                                setState({...state, showScreenActions: false})
                                                setShowCustomInfoCard(true)
                                          }}>
                                          <div className="content">
                                                <p>
                                                      Add your Own Info
                                                      <span className="subtitle">
                                                            Include personalized details about {StringManager.GetFirstNameOnly(activeCoParent?.name)}
                                                      </span>
                                                </p>
                                                <div className="svg-wrapper">
                                                      <FaWandMagicSparkles className={"magic"} />
                                                </div>
                                          </div>
                                    </div>

                                    {/*  REMOVE CO-PARENT */}
                                    <div
                                          className="action-item more-text"
                                          onClick={() => {
                                                setState({...state, showScreenActions: false})
                                                AlertManager.confirmAlert(
                                                      `Are you sure you would like to remove ${StringManager.GetFirstNameOnly(activeCoParent?.name)} as a contact?`,
                                                      "I'm Sure",
                                                      true,
                                                      async () => {
                                                            await DeleteCoParent()
                                                      }
                                                )
                                          }}>
                                          <div className="content">
                                                <p>
                                                      Remove {StringManager.GetFirstNameOnly(activeCoParent?.name)} as a Contact
                                                      <span className="subtitle">
                                                            Remove sharing permissions for {StringManager.GetFirstNameOnly(activeCoParent?.name)}{" "}
                                                            along with the information stored about them
                                                      </span>
                                                </p>
                                                <div className="svg-wrapper">
                                                      <IoPersonRemove className={"remove-user"} />
                                                </div>
                                          </div>
                                    </div>
                              </>
                        )}

                        <div
                              className="action-item more-text"
                              onClick={() => {
                                    setShowInvitationForm(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>
                                          Invite Another Co-Parent
                                          <span className="subtitle">
                                                Send invitation to a co-parent you would like to share essential information with
                                          </span>
                                    </p>
                                    <div className="svg-wrapper invite-co-parent">
                                          <BsFillSendFill className={"paper-airplane"} />
                                    </div>
                              </div>
                        </div>
                  </ScreenActionsMenu>

                  {/* INVITATION FORM */}
                  <Form
                        submitText={"Send Invitation"}
                        wrapperClass="invite-co-parent-card"
                        title={"Invite Co-Parent"}
                        subtitle="Extend an invitation to a co-parent to facilitate the sharing of essential information with them"
                        onClose={() => setShowInvitationForm(false)}
                        showCard={showInvitationForm}
                        onSubmit={() => {
                              if (!Manager.IsValid(invite.current.name) || !Manager.IsValid(invite.current.email)) {
                                    AlertManager.throwError("Please fill out all fields")
                                    return false
                              }
                              EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, "", invite.current.name, invite.current.email)
                              AlertManager.successAlert("Invitation Sent!")
                              setShowInvitationForm(false)
                        }}
                        hideCard={() => setShowInvitationForm(false)}>
                        <Spacer height={5} />
                        <InputField
                              inputType={InputTypes.text}
                              placeholder={"Co-Parent Name"}
                              required={true}
                              onChange={(e) => (invite.current.name = e.target.value)}
                        />
                        <InputField
                              inputType={InputTypes.email}
                              placeholder={"Co-Parent Email Address"}
                              required={true}
                              onChange={(e) => (invite.current.email = e.target.value)}
                        />
                  </Form>

                  {/* CO-PARENTS CONTAINER */}
                  <div id="co-parents-container" className={`${theme} page-container parents-wrapper`}>
                        <ScreenHeader
                              title={"Co-Parents"}
                              titleIcon={<PiUsersFill />}
                              screenDescription=" Maintain accessible records of important information regarding your co-parent."
                        />
                        <Spacer height={10} />
                        <div
                              style={DomManager.AnimateDelayStyle(1)}
                              className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, ".fade-up-wrapper")}`}>
                              <div className="screen-content">
                                    {/* CO-PARENT ICONS CONTAINER */}
                                    <div id="co-parent-container" key={activeCoParent?.id}>
                                          {Manager.IsValid(coParents) &&
                                                coParents?.map((coParent, index) => {
                                                      const coParentKey = activeCoParent?.userKey
                                                      const coParentInitial = StringManager.GetFirstNameAndLastInitial(
                                                            StringManager.UppercaseFirstLetterOfAllWords(coParent?.name)?.[0]
                                                      )
                                                      return (
                                                            <div
                                                                  onClick={() => HandleCoParentChange(coParent)}
                                                                  className={
                                                                        coParentKey && coParentKey === coParent?.userKey
                                                                              ? "active co-parent"
                                                                              : "co-parent"
                                                                  }
                                                                  key={index}>
                                                                  <span className="co-parent-name">{coParentInitial}</span>
                                                            </div>
                                                      )
                                                })}
                                    </div>

                                    {/* CO-PARENT INFO */}
                                    <div id="co-parent-info" key={activeCoParent?.current?.userKey}>
                                          <p id="co-parent-name-primary">{StringManager.GetFirstNameAndLastInitial(activeCoParent?.name)}</p>
                                          <p id="co-parent-type-primary"> {activeCoParent?.parentType}</p>
                                          {/* ITERATE CO-PARENT INFO */}
                                          {Manager.IsValid(activeCoParent) &&
                                                Object.entries(activeCoParent).map((propArray, index) => {
                                                      let infoLabel = propArray[0]
                                                      infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                                                      infoLabel = StringManager.FormatTitle(infoLabel, true)
                                                      const value = propArray[1]

                                                      const inputsToSkip = ["address", "key", "id", "user key"]

                                                      return (
                                                            <div key={index} className="info-row">
                                                                  {/* ADDRESS */}
                                                                  {infoLabel.toLowerCase().includes("address") && (
                                                                        <>
                                                                              <AddressInput
                                                                                    key={activeCoParent?.id}
                                                                                    wrapperClasses={"address-input blue-background"}
                                                                                    defaultValue={value}
                                                                                    placeholder="Home Address"
                                                                                    onChange={(address) => Update("address", address)}
                                                                              />
                                                                              <Spacer height={3} />
                                                                        </>
                                                                  )}

                                                                  {/* TEXT INPUT */}
                                                                  {!inputsToSkip.includes(infoLabel.toLowerCase()) &&
                                                                        !infoLabel.toLowerCase().includes("address") && (
                                                                              <>
                                                                                    <div className="flex input">
                                                                                          <InputField
                                                                                                hasBottomSpacer={false}
                                                                                                defaultValue={value}
                                                                                                onChange={async (e) => {
                                                                                                      const inputValue = e.target.value
                                                                                                      await Update(infoLabel, `${inputValue}`).then(
                                                                                                            (r) => r
                                                                                                      )
                                                                                                      setActiveCoParent(activeCoParent)
                                                                                                }}
                                                                                                inputType={InputTypes.text}
                                                                                                placeholder={infoLabel}
                                                                                          />
                                                                                          <CgClose
                                                                                                className={"close-x children"}
                                                                                                onClick={() => DeleteProp(infoLabel)}
                                                                                          />
                                                                                    </div>
                                                                                    <Spacer height={3} />
                                                                              </>
                                                                        )}
                                                            </div>
                                                      )
                                                })}
                                    </div>
                              </div>
                        </div>
                  </div>
                  {/* NO DATA FALLBACK */}
                  {!Manager.IsValid(coParents) && <p className={"no-data-fallback-text"}>No Co-Parent Contacts Found</p>}

                  {/* NAVBAR */}
                  <NavBar>
                        <div
                              style={DomManager.AnimateDelayStyle(1, 0.06)}
                              onClick={() => setState({...state, showScreenActions: true})}
                              className={`menu-item ${DomManager.Animate.FadeInUp(true, ".menu-item")}`}>
                              <HiDotsHorizontal className={"screen-actions-menu-icon more"} />
                              <p>More</p>
                        </div>
                  </NavBar>
            </Screen>
      )
}