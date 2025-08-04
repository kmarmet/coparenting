import React, {useContext, useEffect, useRef, useState} from "react"
import {FaBriefcaseMedical, FaUserAlt} from "react-icons/fa"
import {FaBrain, FaWandMagicSparkles} from "react-icons/fa6"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoPersonAdd, IoPersonRemove, IoSchool} from "react-icons/io5"
import {PiCameraRotateFill, PiIdentificationCardFill, PiListChecksFill, PiUsersThreeFill} from "react-icons/pi"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import Storage from "../../../database/storage"
import useChildren from "../../../hooks/useChildren"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import NavBar from "../../navBar"
import NewChildForm from "../../screens/children/newChildForm"
import CustomChildInfo from "../../shared/customChildInfo"
import Screen from "../../shared/screen"
import ScreenActionsMenu from "../../shared/screenActionsMenu"
import ScreenHeader from "../../shared/screenHeader"
import Checklist from "./checklist"
import Checklists from "./checklists"
import InfoAccordion from "./childInfoAccordion"
import ManageHandoffChecklists from "./manageHandoffChecklists"

export default function Children() {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state

    // Hooks
    const {currentUser} = useCurrentUser()
    const {children} = useChildren()

    // State
    const [showInfoCard, setShowInfoCard] = useState(false)
    const [showNewChildForm, setShowNewChildForm] = useState(false)
    const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
    const [showChecklistsCard, setShowChecklistsCard] = useState(false)
    const [activeChild, setActiveChild] = useState()

    // Image Ref
    const imgRef = useRef(null)

    const ThrowError = (title, message = "") => {
        setState({...state, isLoading: false, bannerTitle: title, bannerMessage: message, bannerType: "error"})

        return false
    }

    const UploadProfilePic = async (fromButton = false) => {
        const uploadIcon = document.querySelector(`[data-id="${activeChild?.id}" ]`)
        const uploadButton = document.querySelector("#upload-image-input.from-button")
        let imgFiles = uploadIcon?.files

        if (fromButton) {
            imgFiles = uploadButton?.files
        }
        if (imgFiles?.length === 0) ThrowError("Please choose an image")

        // Upload to Firebase Storage -> Set child/general/profilePic
        const uploadedImageUrl = await Storage.UploadByPath(
            `${Storage.directories.profilePics}/${currentUser?.key}/${activeChild?.id}`,
            imgFiles[0],
            "profilePic"
        )

        const activeChildIndex = children?.findIndex((c) => c.id === activeChild?.id)

        console.log(activeChildIndex)

        // Update Child profilePic Record Prop
        if (activeChildIndex === -1) return

        const newChild = children[activeChildIndex]
        newChild.profilePic = uploadedImageUrl
        console.log(`${DB.tables.users}/${currentUser?.key}/children/${activeChildIndex}`)
        await DB.ReplaceEntireRecord(`${DB.tables.users}/${currentUser?.key}/children/${activeChildIndex}`, newChild)
    }

    const DeleteChild = async () => {
        AlertManager.confirmAlert({
            title: `Removing ${StringManager.GetFirstNameOnly(activeChild?.general?.name)} from your contacts`,
            html: `Are you sure you want to remove ${StringManager.GetFirstNameOnly(activeChild?.general?.name)} from your contacts?`,
            confirmButtonText: `I'm Sure`,
            hasCancelButton: true,
            bg: "#c71436",
            color: "#fff",
            onConfirm: async () => {
                await DB_UserScoped.DeleteChild(currentUser, activeChild)
            },
        })
    }

    // Set active child on page load
    useEffect(() => {
        if (Manager.IsValid(children)) {
            if (Manager.IsValid(activeChild)) {
                const _activeChild = children?.find((c) => c.id === activeChild?.id)
                if (Manager.IsValid(_activeChild)) {
                    setActiveChild(_activeChild)
                }
            } else {
                setActiveChild(children?.[0])
            }
        }
    }, [children, currentUser])

    return (
        <Screen
            activeScreen={ScreenNames.children}
            loadingByDefault={true}
            stopLoadingBool={Manager.IsValid(children) && Manager.IsValid(activeChild)}>
            {Manager.IsValid(activeChild) && (
                <>
                    {/* CUSTOM INFO FORM */}
                    <CustomChildInfo showCard={showInfoCard} activeChild={activeChild} hideCard={() => setShowInfoCard(false)} />

                    {/* NEW CHECKLIST */}
                    <ManageHandoffChecklists
                        activeChildId={activeChild?.id}
                        showCard={showNewChecklistCard}
                        hideCard={() => setShowNewChecklistCard(false)}
                    />

                    {/* VIEW CHECKLISTS */}
                    <Checklists showCard={showChecklistsCard} hideCard={() => setShowChecklistsCard(false)} activeChild={activeChild} />
                </>
            )}

            {/* NEW CHILD  */}
            <NewChildForm showCard={showNewChildForm} hideCard={() => setShowNewChildForm(false)} />

            {/* SCREEN ACTIONS */}
            <ScreenActionsMenu title="Manage Children" wrapperClasses={"less-border-radius"}>
                {/* ADD CHILD */}
                <div
                    style={DomManager.AnimateDelayStyle(0)}
                    className={`action-item more-text ${DomManager.Animate.FadeInUp(showScreenActions)}`}
                    onClick={() => {
                        setShowNewChildForm(true)
                        setState({...state, showScreenActions: false})
                    }}>
                    <div className="content">
                        <p>
                            Add a Child
                            <span className="subtitle">
                                Store information and provide sharing permissions for a child that has not been added to your profile yet
                            </span>
                        </p>
                        <div className="svg-wrapper add-child">
                            <IoPersonAdd className={"Add-child"} />
                        </div>
                    </div>
                </div>
                {Manager.IsValid(children) && (
                    <>
                        {/* CUSTOM INFO */}
                        <div
                            style={DomManager.AnimateDelayStyle(1.5)}
                            className={`action-item more-text ${DomManager.Animate.FadeInUp(showScreenActions)}`}
                            onClick={() => {
                                setShowInfoCard(true)
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content">
                                <p>
                                    Add Your Own Info<span className="subtitle">Include personalized details about your child</span>
                                </p>
                                <div className="svg-wrapper">
                                    <FaWandMagicSparkles className={"magic"} />
                                </div>
                            </div>
                        </div>

                        {/* PROFILE PIC */}
                        <div
                            style={DomManager.AnimateDelayStyle(2)}
                            className={`action-item more-text ${DomManager.Animate.FadeInUp(showScreenActions)}`}
                            onClick={() => setState({...state, showScreenActions: false})}>
                            <div className="content">
                                <input
                                    ref={imgRef}
                                    type="file"
                                    id="upload-image-input"
                                    data-id={activeChild?.id}
                                    placeholder=""
                                    accept="image/*"
                                    onChange={() => UploadProfilePic(false)}
                                />
                                <p>
                                    Manage Profile Picture
                                    <span className="subtitle">
                                        Add or update a profile picture of {StringManager.GetFirstNameOnly(activeChild?.general?.name)}
                                    </span>
                                </p>
                                <div className="svg-wrapper">
                                    <PiCameraRotateFill className={"profile-pic"} />
                                </div>
                            </div>
                        </div>

                        {/* EDIT/ADD CHECKLIST */}
                        <div
                            style={DomManager.AnimateDelayStyle(2.5)}
                            className={`action-item more-text ${DomManager.Animate.FadeInUp(showScreenActions)}`}
                            onClick={() => {
                                setShowNewChecklistCard(true)
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content">
                                <p>
                                    Manage Checklists{" "}
                                    <span className="subtitle">Add or edit checklists for transferring to or from a co-parent&#39;s home</span>
                                </p>
                                <div className="svg-wrapper">
                                    <PiListChecksFill className={"checklist"} />
                                </div>
                            </div>
                        </div>

                        {/*  UNLINK CHILD */}
                        <div
                            style={DomManager.AnimateDelayStyle(3)}
                            className={`action-item more-text ${DomManager.Animate.FadeInUp(showScreenActions)}`}
                            onClick={async () => {
                                await DeleteChild()
                                setState({...state, showScreenActions: false})
                            }}>
                            <div className="content">
                                <p>
                                    Remove {activeChild?.general?.name} as a Contact
                                    <span className="subtitle">
                                        Remove sharing permissions for {activeChild?.general?.name} along with their stored information
                                    </span>
                                </p>
                                <div className="svg-wrapper add-child">
                                    <IoPersonRemove className={"remove-child"} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </ScreenActionsMenu>

            {/* PAGE CONTAINER */}
            <div id="child-info-container" className={`${theme} page-container child-info`}>
                <ScreenHeader
                    titleIcon={<PiUsersThreeFill />}
                    title={"Children"}
                    screenDescription="You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
          moment."
                />

                <div className="screen-content">
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, ".fade-up-wrapper")}`}>
                        {/* CHILDREN WRAPPER */}
                        <div id="child-wrapper">
                            {Manager.IsValid(children) &&
                                children?.map((child, index) => {
                                    console.log(child)
                                    return (
                                        <div key={index}>
                                            {/* PROFILE PIC */}
                                            {Manager.IsValid(child?.profilePic) && (
                                                <div
                                                    onClick={() => setActiveChild(child)}
                                                    className={activeChild?.id === child?.id ? "child active" : "child"}>
                                                    <div
                                                        className="child-image"
                                                        style={{
                                                            backgroundImage: `url(${child?.profilePic})`,
                                                            transition: "all .3s ease",
                                                        }}></div>
                                                    {/* CHILD NAME */}
                                                    <span className="child-name">
                                                        {StringManager.GetFirstNameOnly(
                                                            child?.details?.find((x) => x?.dbFormattedLabel === "name")?.value
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                            {/* NO IMAGE */}
                                            {!Manager.IsValid(child?.profilePic, true) && (
                                                <div
                                                    onClick={() => setActiveChild(child)}
                                                    className={activeChild?.id === child?.id ? "child active" : "child"}>
                                                    <div className="child-image no-image">
                                                        <FaUserAlt />
                                                    </div>
                                                    {/* CHILD NAME */}
                                                    <span className="child-name">
                                                        {StringManager.GetFirstNameOnly(child?.name || child?.details?.name)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>

                        {/* INFO */}
                        <div id="child-info">
                            <>
                                <InfoAccordion
                                    setActiveChild={(child) => setActiveChild(child)}
                                    activeChild={activeChild}
                                    icon={<PiIdentificationCardFill className={"svg general"} />}
                                    infoParentTitle={"general"}
                                />
                                <InfoAccordion
                                    setActiveChild={(child) => setActiveChild(child)}
                                    activeChild={activeChild}
                                    icon={<FaBriefcaseMedical className={"svg medical"} />}
                                    infoParentTitle={"medical"}
                                />
                                <InfoAccordion
                                    setActiveChild={(child) => setActiveChild(child)}
                                    activeChild={activeChild}
                                    icon={<IoSchool className={"svg schooling"} />}
                                    infoParentTitle={"schooling"}
                                />
                                <InfoAccordion
                                    setActiveChild={(child) => setActiveChild(child)}
                                    activeChild={activeChild}
                                    icon={<FaBrain className={"svg behavior"} />}
                                    infoParentTitle={"behavior"}
                                />
                                <Checklist fromOrTo={"from"} activeChild={activeChild} />
                                <Checklist fromOrTo={"to"} activeChild={activeChild} />
                            </>
                        </div>
                    </div>
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
            {!Manager.IsValid(children) && (
                <p className={"no-data-fallback-text"}>
                    Currently, no children have been added. To share events with your children or to store their information, please Add them here.
                </p>
            )}
        </Screen>
    )
}