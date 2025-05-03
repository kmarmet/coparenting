// Path: src\components\screens\childInfo\childInfo.jsx
import NavBar from '/src/components/navBar'
import Behavior from '/src/components/screens/children/behavior'
import General from '/src/components/screens/children/general'
import Medical from '/src/components/screens/children/medical'
import NewChildForm from '/src/components/screens/children/newChildForm'
import Schooling from '/src/components/screens/children/schooling'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import FirebaseStorage from '/src/database/firebaseStorage'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoClose, IoPersonAdd, IoPersonAddOutline, IoPersonRemove} from 'react-icons/io5'
import {PiCameraRotateFill, PiListChecksFill} from 'react-icons/pi'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import CustomChildInfo from '../../shared/customChildInfo'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import Spacer from '../../shared/spacer'
import StandaloneLoadingGif from '../../shared/standaloneLoadingGif'
import AddOrUpdateTransferChecklists from './addOrUpdateTransferChecklists'
import Checklist from './checklist'
import Checklists from './checklists'

export default function Children() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {children, childrenAreLoading} = useChildren()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const [activeChild, setActiveChild] = useState(currentUser?.children?.[0])
  const imgRef = useRef()

  const UploadProfilePic = async (fromButton = false, childId = activeChild?.id) => {
    const uploadIcon = document.querySelector(`[data-id="${activeChild?.id}" ]`)
    console.log(uploadIcon)
    const uploadButton = document.querySelector('#upload-image-input.from-button')
    let imgFiles = uploadIcon?.files
    if (fromButton) {
      imgFiles = uploadButton?.files
    }
    if (imgFiles?.length === 0) {
      // AlertManager.throwError('Please choose an image')
      return false
    }
    console.log(imgFiles)
    // Upload -> Set child/general/profilePic
    const uploadedImageUrl = await FirebaseStorage.upload(
      FirebaseStorage.directories.profilePics,
      `${currentUser?.key}/${activeChild?.id}`,
      imgFiles[0],
      'profilePic'
    )

    // Update Child profilePic
    await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, 'general', 'profilePic', uploadedImageUrl)
  }

  const DeleteChild = async () => {
    AlertManager.confirmAlert(
      `Are you sure you want to unlink ${StringManager.getFirstNameOnly(activeChild?.general?.name)} from your profile?`,
      `I'm Sure`,
      true,
      async () => {
        await DB_UserScoped.DeleteChild(currentUser, activeChild)
      }
    )
  }

  // Set active child on page load
  useEffect(() => {
    if (Manager.isValid(children)) {
      setActiveChild(children?.[0])
    }
  }, [children])

  useEffect(() => {
    if (!childrenAreLoading && !currentUserIsLoading) {
      DomManager.ToggleAnimation('add', 'child-image', DomManager.AnimateClasses.names.zoomIn, 100)

      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'info-section', DomManager.AnimateClasses.names.fadeInRight, 50)
      }, 400)
    }
  }, [childrenAreLoading, currentUserIsLoading])

  if (childrenAreLoading || currentUserIsLoading) {
    return <StandaloneLoadingGif />
  }

  return (
    <>
      {Manager.isValid(activeChild) && (
        <>
          {/* CUSTOM INFO FORM */}
          <CustomChildInfo showCard={showInfoCard} activeChild={activeChild} hideCard={() => setShowInfoCard(false)} />

          {/* NEW CHECKLIST */}
          <AddOrUpdateTransferChecklists activeChild={activeChild} showCard={showNewChecklistCard} hideCard={() => setShowNewChecklistCard(false)} />

          {/* VIEW CHECKLISTS */}
          <Checklists showCard={showChecklistsCard} hideCard={() => setShowChecklistsCard(false)} activeChild={activeChild} />
        </>
      )}

      {/* NEW CHILD  */}
      <NewChildForm showCard={showNewChildForm} hideCard={() => setShowNewChildForm(false)} />

      <ScreenActionsMenu>
        {/* ADD CHILD */}
        <div
          className="action-item"
          onClick={() => {
            setShowNewChildForm(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper add-child">
              <IoPersonAdd className={'Add-child'} />
            </div>
            <p>
              Add a Child
              <span className="subtitle">
                Store information and provide sharing permissions for a child that has not been added to your profile yet
              </span>
            </p>
          </div>
        </div>
        {Manager.isValid(children) && (
          <>
            {/* CUSTOM INFO */}
            <div
              className="action-item"
              onClick={() => {
                setShowInfoCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <FaWandMagicSparkles className={'magic'} />
                </div>
                <p>
                  Add your Own Info<span className="subtitle">Include personalized details about your child</span>
                </p>
              </div>
            </div>

            {/* PROFILE PIC */}

            <div className="action-item" onClick={() => setState({...state, showScreenActions: false})}>
              <div className="content">
                <input
                  ref={imgRef}
                  type="file"
                  id="upload-image-input"
                  data-id={activeChild?.id}
                  placeholder=""
                  accept="image/*"
                  onChange={() => UploadProfilePic(false, activeChild?.id)}
                />
                <div className="svg-wrapper">
                  <PiCameraRotateFill className={'profile-pic'} />
                </div>
                <p>
                  Manage Profile Picture
                  <span className="subtitle">
                    Add a profile picture of {StringManager.getFirstNameOnly(activeChild?.general?.name)}. Or replace it if a picture has already been
                    uploaded
                  </span>
                </p>
              </div>
            </div>

            {/* EDIT/ADD CHECKLIST */}
            <div
              className="action-item"
              onClick={() => {
                setShowNewChecklistCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <PiListChecksFill className={'checklist'} />
                </div>
                <p>
                  Manage Checklists <span className="subtitle">Add or edit checklists for transferring to or from a co-parent&#39;s home</span>
                </p>
              </div>
            </div>

            {/*  UNLINK CHILD */}
            <div
              className="action-item"
              onClick={async () => {
                await DeleteChild()
                setState({...state, showScreenActions: false})
              }}>
              <div className="content">
                <div className="svg-wrapper add-child">
                  <IoPersonRemove className={'remove-child'} />
                </div>
                <p>
                  Unlink {activeChild?.general?.name} from Your Profile
                  <span className="subtitle">
                    Remove sharing permissions for {activeChild?.general?.name} along with the information stored about them
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container child-info form`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title beside-action-button">Children</p>

          {/* ADD NEW BUTTON - DESKTOP */}
          {!DomManager.isMobile() && <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'Add-new-button'} />}
        </div>

        <p className="screen-intro-text">
          You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
          moment.
        </p>

        <Spacer height={10} />

        {/* CHILDREN WRAPPER */}
        <div id="child-wrapper">
          {Manager.isValid(children) &&
            children?.map((child) => {
              return (
                <div key={child?.id}>
                  {/* PROFILE PIC */}
                  {Manager.isValid(child?.general?.profilePic) && (
                    <div onClick={() => setActiveChild(child)} className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                      <div
                        className="child-image"
                        style={{backgroundImage: `url(${child?.general?.profilePic})`, transition: 'all .7s linear'}}></div>
                      {/* CHILD NAME */}
                      <span className="child-name">{StringManager.getFirstNameOnly(child?.general?.name)}</span>
                    </div>
                  )}

                  {/* NO IMAGE */}
                  {!Manager.isValid(child?.general?.profilePic, true) && (
                    <div onClick={() => setActiveChild(child)} className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                      <div className="child-image no-image">
                        <span>No Image</span>
                      </div>
                      {/* CHILD NAME */}
                      <span className="child-name">{StringManager.getFirstNameOnly(child?.general?.name)}</span>
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {/* INFO */}
        <div id="child-info">
          {Manager.isValid(activeChild) && Manager.isValid(currentUser) && (
            <>
              <General activeChild={activeChild} />
              <Medical activeChild={activeChild} />
              <Schooling activeChild={activeChild} />
              <Behavior activeChild={activeChild} />
              <Checklist activeChild={activeChild} fromOrTo={'from'} />
              <Checklist activeChild={activeChild} fromOrTo={'to'} />
            </>
          )}
        </div>
      </div>
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>More</p>
        </div>
      </NavBar>
      {!Manager.isValid(children) && (
        <NoDataFallbackText
          text={'Currently, no children have been added. To share events with your children or to store their information, please Add them here.'}
        />
      )}
    </>
  )
}