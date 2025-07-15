import React, {useContext, useEffect, useRef, useState} from 'react'
import {FaUserAlt} from 'react-icons/fa'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import {PiCameraRotateFill, PiListChecksFill} from 'react-icons/pi'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import Storage from '../../../database/storage'
import useActiveChild from '../../../hooks/useActiveChild'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import NavBar from '../../navBar'
import Behavior from '../../screens/children/behavior'
import General from '../../screens/children/general'
import Medical from '../../screens/children/medical'
import NewChildForm from '../../screens/children/newChildForm'
import Schooling from '../../screens/children/schooling'
import CustomChildInfo from '../../shared/customChildInfo'
import Screen from '../../shared/screen'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import Checklist from './checklist'
import Checklists from './checklists'
import ManageTransferChecklists from './manageTransferChecklists'

export default function Children() {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state
    const {currentUser} = useCurrentUser()
    const {children} = useChildren()
    const [showInfoCard, setShowInfoCard] = useState(false)
    const [showNewChildForm, setShowNewChildForm] = useState(false)
    const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
    const [showChecklistsCard, setShowChecklistsCard] = useState(false)
    const [activeChildId, setActiveChildId] = useState(currentUser?.children?.[0]?.id)
    const {activeChild} = useActiveChild(activeChildId)
    const imgRef = useRef(null)

    const UploadProfilePic = async (fromButton = false) => {
        const uploadIcon = document.querySelector(`[data-id="${activeChild?.id}" ]`)
        const uploadButton = document.querySelector('#upload-image-input.from-button')
        let imgFiles = uploadIcon?.files

        if (fromButton) {
            imgFiles = uploadButton?.files
        }
        if (imgFiles?.length === 0) {
            // AlertManager.throwError('Please choose an image')
            return false
        }

        // Upload -> Set child/general/profilePic
        const uploadedImageUrl = await Storage.upload(
            Storage.directories.profilePics,
            `${currentUser?.key}/${activeChild?.id}`,
            imgFiles[0],
            'profilePic'
        )

        // Update Child profilePic
        const childIndex = DB.GetChildIndex(children, activeChild?.id)
        await DB_UserScoped.UpdateChild(`${DB.tables.users}/${currentUser?.key}/children/${childIndex}`, uploadedImageUrl)
    }

    const DeleteChild = async () => {
        AlertManager.confirmAlert(
            `Are you sure you want to remove ${StringManager.GetFirstNameOnly(activeChild?.general?.name)} from your contacts?`,
            `I'm Sure`,
            true,
            async () => {
                await DB_UserScoped.DeleteChild(currentUser, activeChild)
            }
        )
    }

    // Set active child on page load
    useEffect(() => {
        if (Manager.IsValid(children) && !Manager.IsValid(activeChild)) {
            setActiveChildId(children?.[0]?.id)
        }
    }, [children])

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
                    <ManageTransferChecklists
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
            <ScreenActionsMenu title="Manage Children" wrapperClasses={'less-border-radius'}>
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
                            <IoPersonAdd className={'Add-child'} />
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
                                    <FaWandMagicSparkles className={'magic'} />
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
                                    <PiCameraRotateFill className={'profile-pic'} />
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
                                    Manage Checklists{' '}
                                    <span className="subtitle">Add or edit checklists for transferring to or from a co-parent&#39;s home</span>
                                </p>
                                <div className="svg-wrapper">
                                    <PiListChecksFill className={'checklist'} />
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
                                    <IoPersonRemove className={'remove-child'} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </ScreenActionsMenu>

            {/* PAGE CONTAINER */}
            <div id="child-info-container" className={`${theme} page-container child-info`}>
                <ScreenHeader
                    title={'Children'}
                    screenDescription="You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
          moment."
                />

                <Spacer height={10} />

                <div className="screen-content">
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, '.fade-up-wrapper')}`}>
                        {/* CHILDREN WRAPPER */}
                        <div id="child-wrapper">
                            {Manager.IsValid(children) &&
                                children?.map((child, index) => {
                                    return (
                                        <div key={index}>
                                            {/* PROFILE PIC */}
                                            {Manager.IsValid(child?.profilePic) && (
                                                <div
                                                    onClick={() => setActiveChildId(child?.id)}
                                                    className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                                                    <div
                                                        className="child-image"
                                                        style={{backgroundImage: `url(${child?.profilePic})`, transition: 'all .3s linear'}}></div>
                                                    {/* CHILD NAME */}
                                                    <span className="child-name">{StringManager.GetFirstNameOnly(child?.general?.name)}</span>
                                                </div>
                                            )}

                                            {/* NO IMAGE */}
                                            {!Manager.IsValid(child?.profilePic, true) && (
                                                <div
                                                    onClick={() => setActiveChildId(child?.id)}
                                                    className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                                                    <div className="child-image no-image">
                                                        <FaUserAlt />
                                                    </div>
                                                    {/* CHILD NAME */}
                                                    <span className="child-name">{StringManager.GetFirstNameOnly(child?.general?.name)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>

                        {/* INFO */}
                        <div id="child-info">
                            {Manager.IsValid(activeChild) && Manager.IsValid(currentUser) && (
                                <>
                                    <General activeChild={activeChild} />
                                    <Medical activeChild={activeChild} />
                                    <Schooling activeChild={activeChild} />
                                    <Behavior activeChild={activeChild} />
                                    <Checklist fromOrTo={'from'} activeChildId={activeChild?.id} />
                                    <Checklist fromOrTo={'to'} activeChildId={activeChild?.id} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <NavBar navbarClass={'actions'}>
                <div
                    style={DomManager.AnimateDelayStyle(1, 0.06)}
                    onClick={() => setState({...state, showScreenActions: true})}
                    className={`menu-item ${DomManager.Animate.FadeInUp(true, '.menu-item')}`}>
                    <HiDotsHorizontal className={'screen-actions-menu-icon more'} />
                    <p>More</p>
                </div>
            </NavBar>
            {!Manager.IsValid(children) && (
                <p className={'no-data-fallback-text'}>
                    Currently, no children have been added. To share events with your children or to store their information, please Add them here.
                </p>
            )}
        </Screen>
    )
}