import React, {useContext, useEffect, useRef, useState} from "react"
import {FaUserEdit} from "react-icons/fa"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoPersonAdd} from "react-icons/io5"
import {MdContacts} from "react-icons/md"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useChildren from "../../../hooks/useChildren"
import useCoParents from "../../../hooks/useCoParents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useParents from "../../../hooks/useParents"
import useUsers from "../../../hooks/useUsers"
import AlertManager from "../../../managers/alertManager"
import DomManager from "../../../managers/domManager"
import InvitationManager from "../../../managers/invitationManager"
import Manager from "../../../managers/manager"
import SmsManager from "../../../managers/smsManager"
import StringManager from "../../../managers/stringManager"
import Invitation from "../../../models/new/invitation"
import NavBar from "../../navBar"
import DetailBlock from "../../shared/detailBlock"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Label from "../../shared/label"
import Map from "../../shared/map"
import Screen from "../../shared/screen"
import ScreenActionsMenu from "../../shared/screenActionsMenu"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"
import ToggleButton from "../../shared/toggleButton"
import ViewDropdown from "../../shared/viewDropdown"
import NewChildForm from "../children/newChildForm"
import NewCoParentForm from "../coparents/newCoParentForm"
import NewParentForm from "../parents/newParentForm"

const Contacts = () => {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state

    // HOOKS
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {children, childrenAreLoading} = useChildren()
    const {coParents, coParentsAreLoading} = useCoParents()
    const {parents, parentsAreLoading} = useParents()
    const {users, usersAreLoading} = useUsers()

    // STATE
    const [activeContact, setActiveContact] = useState()
    const [showNewCoparentCard, setShowNewCoparentCard] = useState(false)
    const [showNewParentCard, setShowNewParentCard] = useState(false)
    const [showNewChildCard, setShowNewChildCard] = useState(false)
    const [showInvitationCard, setShowInvitationCard] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [view, setView] = useState([{label: "Details", value: "details"}])
    const [showMap, setShowMap] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [notificationToggleState, setNotificationToggleState] = useState(true)

    // REFS
    const updateObject = useRef({})

    // CONTACT UPDATE STATE
    const UpdateContact = async () => {
        const {model, propertyPath, inputValue} = updateObject
        let userIndex = DB.GetIndexById(children, activeContact?.id)
        let groupType = "children"
        // Parents
        if (currentUser?.accountType === "child" && GetAccountType() === "parent") {
            userIndex = DB.GetIndexById(parents, activeContact?.id)
            groupType = "parents"
        }

        // Co-parents
        else if (currentUser?.accountType === "parent" && GetAccountType() === "parent") {
            userIndex = DB.GetIndexById(coParents, activeContact?.id)
            groupType = "coparents"
        }
        const updatedContact = {...activeContact}
        updatedContact[propertyPath] = inputValue

        // Database Update

        if (userIndex > -1 && Manager.IsValid(updatedContact)) {
            await DB.ReplaceEntireRecord(`${DB.tables.users}/${currentUser?.key}/${groupType}/${userIndex}`, updatedContact)
            setState({...state, bannerMessage: `${StringManager.GetFirstNameOnly(activeContact?.name)} updated!`})
            setShowModal(false)
        }
    }

    const ToggleNotifications = async () => {
        const mutedUserKeys = currentUser?.mutedUserKeys
        const updatedMutesUserKeys = mutedUserKeys || []
        if (mutedUserKeys?.includes(activeContact?.userKey)) {
            updatedMutesUserKeys.splice(mutedUserKeys.indexOf(activeContact?.userKey), 1)
            setState({...state, bannerMessage: `Notifications from ${StringManager.GetFirstNameOnly(activeContact?.name)} have been enabled`})
        } else {
            setState({...state, bannerMessage: `Notifications from ${StringManager.GetFirstNameOnly(activeContact?.name)} have been muted`})
            updatedMutesUserKeys.push(activeContact?.userKey)
        }
        await DB.UpdateByPath(`${DB.tables.users}/${currentUser?.key}/mutedUserKeys`, updatedMutesUserKeys)
        setShowModal(false)
    }

    const RemoveContact = async () => {
        AlertManager.confirmAlert({
            title: `Removing ${StringManager.GetFirstNameOnly(activeContact?.name)} as a Contact`,
            html: `Doing so will <b>remove them from your contact list, along with any information stored about them and sharing permissions.</b>`,
            confirmButtonText: `I'm Sure`,
            bg: "#c71436",
            color: "#fff",
            showCancelButton: true,
            onConfirm: async () => {
                // Remove co-parent
                if (currentUser?.accountType === "parent" && activeContact?.accountType === "parent") {
                    let toRemove = coParents?.find((x) => x.id === activeContact?.id)

                    if (Manager.IsValid(toRemove)) {
                        const coParentIndex = DB.GetIndexById(coParents, activeContact?.id)
                        await DB_UserScoped.DeleteCoParent(currentUser, coParentIndex, toRemove?.userKey)
                    }
                }

                // Remove parent
                else if (currentUser?.accountType === "child" && activeContact?.accountType === "parent") {
                    let toRemove = parents.find((x) => x.id === activeContact?.id)

                    if (Manager.IsValid(toRemove)) {
                        const parentIndex = DB.GetIndexById(parents, activeContact?.id)
                        await DB_UserScoped.DeleteParent(currentUser, parentIndex, toRemove?.userKey)
                    }
                }

                // Remove child
                else {
                    let toRemove = children.find((x) => x.id === activeContact?.id)

                    if (Manager.IsValid(toRemove)) {
                        const childIndex = DB.GetChildIndex(children, activeContact?.id)
                        await DB_UserScoped.DeleteChild(currentUser, childIndex, toRemove?.userKey)
                    }
                }

                setShowNewChildCard(false)
                setShowNewParentCard(false)
                setShowNewCoparentCard(false)
                setShowModal(false)
            },
        })
    }

    const GetContactName = () => {
        let name = activeContact?.name
        if (!Manager.IsValid(activeContact?.name)) {
            name = activeContact?.general?.name
        }
        return StringManager.GetFirstNameOnly(name)
    }

    const GetContactEmail = () => {
        let email = activeContact?.email
        if (!Manager.IsValid(activeContact?.email)) {
            email = activeContact?.general?.email
        }
        return email
    }

    const GetContactPhone = () => {
        let phone = activeContact?.phone
        if (!Manager.IsValid(activeContact?.phone)) {
            phone = activeContact?.general?.phone
        }
        return phone
    }

    const GetAccountType = () => {
        // eslint-disable-next-line no-prototype-builtins
        if (activeContact?.hasOwnProperty("general")) {
            return "children"
        } else {
            return "parent"
        }
    }

    // Update Notification State Toggle
    useEffect(() => {
        if (Manager.IsValid(activeContact)) {
            // Muted User Keys is Empty and Active Contact is MUTED
            if (Manager.IsValid(currentUser?.mutedUserKeys) && currentUser?.mutedUserKeys?.includes(activeContact?.userKey)) {
                setNotificationToggleState(false)
            }
            // Muted User Keys is Empty and Active Contact is UNMUTED
            else if (Manager.IsValid(currentUser?.mutedUserKeys) && !currentUser?.mutedUserKeys?.includes(activeContact?.userKey)) {
                setNotificationToggleState(true)
            } else if (!Manager.IsValid(currentUser?.mutedUserKeys)) {
                setNotificationToggleState(true)
            } else {
                setNotificationToggleState(true)
            }
        }
    }, [activeContact, view?.label])

    // Remove view from the active form
    useEffect(() => {
        if (showNewCoparentCard || showNewParentCard || showNewChildCard) {
            const activeModal = document.querySelector(".form-wrapper.active")
            if (Manager.IsValid(activeModal)) {
                const modalCard = activeModal.querySelector("#form-card")
                if (Manager.IsValid(modalCard)) {
                    modalCard.classList.remove("details")
                }
            }
        }
    }, [showNewCoparentCard, showNewParentCard, showNewChildCard])

    return (
        <Screen
            loadingByDefault={true}
            activeScreen={ScreenNames.contacts}
            stopLoadingBool={!currentUserIsLoading && !childrenAreLoading && !parentsAreLoading && !coParentsAreLoading && !usersAreLoading}>
            {/* NEW */}
            <NewCoParentForm showCard={showNewCoparentCard} hideCard={() => setShowNewCoparentCard(false)} />
            <NewChildForm showCard={showNewChildCard} hideCard={() => setShowNewChildCard(false)} />
            <NewParentForm showCard={showNewParentCard} hideCard={() => setShowNewParentCard(false)} />

            {/* INVITATION FORM */}
            <Form
                submitText={"Send"}
                wrapperClass="invitation-card"
                title={`Invite ${GetContactName()}`}
                subtitle="Extend an invitation to facilitate the sharing of essential information with them"
                onClose={() => setShowInvitationCard(false)}
                showCard={showInvitationCard}
                onSubmit={async () => {
                    if (!Manager.IsValid(updateObject.current.email)) {
                        AlertManager.throwError("Email is required")
                        return false
                    }
                    const newInvitation = new Invitation({
                        recipientPhone: updateObject.current.phone,
                        sender: {
                            key: currentUser?.key,
                            name: currentUser?.name,
                            email: currentUser?.email,
                        },
                    })
                    await InvitationManager.AddInvitation(newInvitation, currentUser?.key)
                    SmsManager.Send(
                        updateObject.current.phone,
                        SmsManager.Templates.Invitation(currentUser, activeContact?.name, updateObject.current.phone)
                    )
                    setState({...state, bannerMessage: "Invitation Sent!"})
                    setShowInvitationCard(false)
                }}
                hideCard={() => setShowInvitationCard(false)}>
                <Spacer height={8} />
                <InputField
                    inputType={InputTypes.email}
                    placeholder={"Email Address"}
                    required={true}
                    onChange={(e) => (updateObject.current.email = e.target.value)}
                />
            </Form>

            {/* UPDATE FORM */}
            <Form
                onSubmit={UpdateContact}
                onClose={() => setShowModal(false)}
                hideCard={() => setShowModal(false)}
                wrapperClass="contact-form-wrapper"
                hasSubmitButton={view?.label === "Edit"}
                hasDelete={true}
                onDelete={RemoveContact}
                deleteButtonText={`Remove`}
                submitText={"Update"}
                viewDropdown={<ViewDropdown hasSpacer={true} dropdownPlaceholder="Details" selectedView={view} onSelect={setView} />}
                subtitle={`${!users?.map((x) => x?.key).includes(activeContact?.userKey) ? `${GetContactName()} has not created an account with us yet. Invite them to create an account to begin sharing with and receiving information from them.` : ""}`}
                title={`${GetContactName()} ${Manager.IsValid(activeContact?.parentType) ? `<br/><span>${activeContact?.parentType}</span>` : ""}`}
                showCard={showModal}>
                {/* DETAILS */}

                <div className={!Manager.IsValid(view?.label) || view?.label === "Details" ? "views-wrapper details active" : "view-wrapper"}>
                    <Spacer height={8} />
                    {/* BLOCKS */}
                    <DetailBlock isCustom={true} isFullWidth={true} valueToValidate={activeContact} text={""} title={""}>
                        <p className="custom-info-text">
                            Add custom information about {GetContactName()} at the&nbsp;
                            <span className="link" onClick={() => setState({...state, currentScreen: ScreenNames.children})}>
                                {GetAccountType()}
                            </span>
                            &nbsp;page
                        </p>
                    </DetailBlock>
                    <DetailBlock valueToValidate={activeContact?.relationshipToMe} text={activeContact?.relationshipToMe} title={"Relationship"} />
                    <div className="multiline-blocks">
                        <DetailBlock
                            topSpacerMargin={10}
                            bottomSpacerMargin={10}
                            valueToValidate={GetContactPhone()}
                            text={GetContactPhone()}
                            isPhone={true}
                            title={"Phone"}
                        />
                        <DetailBlock
                            topSpacerMargin={10}
                            bottomSpacerMargin={10}
                            valueToValidate={GetContactEmail()}
                            text={GetContactEmail()}
                            isEmail={true}
                            title={"Email"}
                        />
                        {!users?.map((x) => x?.key).includes(activeContact?.userKey) && (
                            <DetailBlock
                                topSpacerMargin={10}
                                bottomSpacerMargin={10}
                                valueToValidate={activeContact}
                                text={""}
                                isInviteButton={true}
                                title={"Send Invite"}
                                onClick={() => {
                                    setShowInvitationCard(true)
                                    setShowModal(false)
                                }}
                            />
                        )}
                    </div>
                    {Manager.IsValid(activeContact?.address) && <Map locationString={activeContact?.address} />}
                </div>

                {/* EDIT */}
                <div className={view?.label === "Edit" ? "view-wrapper edit active" : "edit view-wrapper"}>
                    <Spacer height={8} />

                    {GetAccountType() === "parent" && (
                        <>
                            <div className="notifications-toggle">
                                <Label text={`Receive Notifications from ${GetContactName()}`} classes={"always-show toggle"} />
                                <ToggleButton
                                    isDefaultChecked={notificationToggleState}
                                    onCheck={() => ToggleNotifications(true)}
                                    onUncheck={() => ToggleNotifications(false)}
                                />
                            </div>
                            <p className={"notification-disclaimer"}>If disabled, you will not receive ANY notifications from {GetContactName()}</p>
                        </>
                    )}
                    <Spacer height={10} />

                    {/* NAME */}
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Name"}
                        defaultValue={GetContactName()}
                        wrapperClasses="show-label"
                        required={true}
                        customDebounceDelay={2000}
                        onChange={async (e) => {
                            const inputValue = e.target.value
                            if (inputValue.length > 1) {
                                updateObject.current.recipientName = inputValue
                            }
                        }}
                    />
                    <Spacer height={5} />

                    {/* EMAIL */}
                    {Manager.IsValid(GetContactEmail()) && (
                        <InputField
                            inputType={InputTypes.email}
                            placeholder={"Email Address"}
                            defaultValue={GetContactEmail()}
                            wrapperClasses="show-label"
                            required={true}
                            onChange={async (e) => {
                                const inputValue = e.target.value

                                if (inputValue.length > 1) {
                                    updateObject.current.recipientEmail = inputValue
                                }
                            }}
                        />
                    )}

                    <Spacer height={5} />
                    {/* PHONE */}
                    {Manager.IsValid(GetContactPhone()) && (
                        <InputField
                            inputType={InputTypes.phone}
                            placeholder={"Phone Number"}
                            defaultValue={GetContactPhone()}
                            wrapperClasses="show-label"
                            required={true}
                            onChange={async (e) => {
                                const inputValue = e.target.value
                                if (inputValue.length > 1) {
                                    updateObject.current.recipientPhone = inputValue
                                }
                            }}
                        />
                    )}
                </div>
            </Form>

            {/* SCREEN ACTIONS */}
            <ScreenActionsMenu>
                {/* CREATE CONTACT */}
                {currentUser?.accountType === "parent" && (
                    <>
                        {/* NEW CHILD CONTACT */}
                        <div
                            className="action-item"
                            onClick={() => {
                                setShowNewChildCard(true)
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Create Child Contact</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>

                        {/* NEW CO-PARENT CONTACT */}
                        <div
                            className="action-item"
                            onClick={() => {
                                setShowNewCoparentCard(true)
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Create Co-Parent Contact</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>

                        {/* MANAGE CHILDREN */}
                        <div
                            className="action-item"
                            onClick={() => {
                                setState({...state, currentScreen: ScreenNames.children, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Manage Children</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>

                        {/* MANAGE CO-PARENTS */}
                        <div
                            className="action-item"
                            onClick={() => {
                                setState({...state, currentScreen: ScreenNames.coparents, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Manage Co-Parents</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* NEW PARENT CONTACT */}
                {currentUser?.accountType === "child" && (
                    <>
                        <div
                            className="action-item"
                            onClick={() => {
                                setShowNewParentCard(true)
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Create Parent Contact</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>
                        {/* MANAGE CO-PARENTS */}
                        <div
                            className="action-item"
                            onClick={() => {
                                setState({...state, currentScreen: ScreenNames.parents, showScreenActions: false})
                            }}>
                            <div className="content align-center">
                                <p>Manage Parents</p>
                                <div className="svg-wrapper">
                                    <IoPersonAdd className={"checklist"} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </ScreenActionsMenu>

            {/* PAGE CONTAINER */}
            <div id="contacts-wrapper" className={`${theme} contacts page-container`}>
                <ScreenHeader
                    titleIcon={<MdContacts />}
                    title={"Contacts"}
                    screenDescription="Access and manage all essential and personal contact details for each of your contacts."
                />
                <Spacer height={8} />
                <div className="screen-content">
                    {/* CO-PARENTS */}
                    {currentUser?.accountType === "parent" && (
                        <div>
                            <Label classes={"dark toggle always-show"} text={"Co-Parents"} />
                            <Spacer height={5} />

                            <div className={"contacts-wrapper"}>
                                {Manager.IsValid(coParents) &&
                                    coParents.map((contact, index) => {
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    contact.accountType = "coParent"
                                                    setActiveContact(contact)
                                                    setShowModal(true)
                                                }}
                                                className={`contact-card${!Manager.IsValid(contact?.profilePic) ? " no-pic" : ""} ${DomManager.Animate.FadeInUp(contact, ".contact-card")}`}
                                                style={{
                                                    backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : "",
                                                }}>
                                                <div className="header">
                                                    <div
                                                        className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? "no-pic" : ""}`}
                                                        style={{
                                                            backgroundImage: Manager.IsValid(contact?.profilePic)
                                                                ? `url(${contact?.profilePic})`
                                                                : "",
                                                        }}>
                                                        {!Manager.IsValid(contact?.profilePic) && (
                                                            <span>{StringManager.GetFirstNameOnly(contact?.name)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* CHILDREN */}
                    {currentUser?.accountType === "parent" && (
                        <div>
                            <Spacer height={15} />
                            <Label classes={"dark toggle always-show"} text={"Children"} />
                            <Spacer height={5} />
                            <div className={"contacts-wrapper"}>
                                {Manager.IsValid(children) &&
                                    children.map((contact, index) => {
                                        return (
                                            <div
                                                onClick={() => {
                                                    contact.accountType = "child"
                                                    setView([{label: "Details", value: "Details"}])
                                                    setActiveContact(contact)
                                                    setShowModal(true)
                                                }}
                                                style={{
                                                    backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : "",
                                                }}
                                                className={`contact-card ${pressed ? "pressed" : ""} ${DomManager.Animate.FadeInUp(contact, ".contact-card")}${Manager.IsValid(contact?.profilePic) ? "" : " no-pic"}`}
                                                key={index}>
                                                <div className="header">
                                                    {/*<div*/}
                                                    {/*    className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? 'no-pic' : ''}`}*/}
                                                    {/*    style={{*/}
                                                    {/*        backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : '',*/}
                                                    {/*    }}>*/}
                                                    {/*    {!Manager.IsValid(contact?.profilePic) && (*/}
                                                    {/*        <span>{StringManager.GetFirstNameOnly(contact?.general?.name)[0]} </span>*/}
                                                    {/*    )}*/}
                                                    {/*</div>*/}
                                                    <p className="contact-card-name">{StringManager.GetFirstNameOnly(contact?.general?.name)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* PARENTS */}
                    {currentUser?.accountType === "child" && (
                        <div id="contacts-wrapper">
                            <Spacer height={15} />
                            <Label classes={"dark toggle always-show"} text={"Parents"} />
                            <Spacer height={5} />
                            {Manager.IsValid(parents) &&
                                parents.map((contact, index) => {
                                    return (
                                        <div
                                            onClick={() => {
                                                contact.accountType = "parent"
                                                setActiveContact(contact)
                                                setShowModal(true)
                                            }}
                                            className={`contact-card ${DomManager.Animate.FadeInUp(contact, ".contact-card")}`}
                                            style={DomManager.AnimateDelayStyle(index)}
                                            key={index}>
                                            <div className="header">
                                                <div
                                                    className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? "no-pic" : ""}`}
                                                    style={{
                                                        backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : "",
                                                    }}>
                                                    {" "}
                                                    {!Manager.IsValid(contact?.profilePic) && (
                                                        <span>{StringManager.GetFirstNameOnly(contact?.name)[0]}</span>
                                                    )}
                                                </div>
                                                <p className="contact-card-name">
                                                    {contact?.name}
                                                    {!users?.map((x) => x?.key).includes(contact?.userKey) && (
                                                        <span className="no-account">no account - invite them now</span>
                                                    )}
                                                </p>

                                                <FaUserEdit />
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>
            </div>
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

export default Contacts