// Path: src\components\screens\childInfo\childInfo.jsx
import React, {useContext, useEffect, useRef, useState} from 'react'
import globalState from '../../../context'
import FirebaseStorage from '/src/database/firebaseStorage'
import Manager from '/src/managers/manager'
import CustomChildInfo from '../../shared/customChildInfo'
import Behavior from '/src/components/screens/childInfo/behavior'
import General from '/src/components/screens/childInfo/general'
import Medical from '/src/components/screens/childInfo/medical'
import {HiDotsHorizontal} from 'react-icons/hi'
import Schooling from '/src/components/screens/childInfo/schooling'
import {FaCameraRotate, FaWandMagicSparkles} from 'react-icons/fa6'
import {Fade} from 'react-awesome-reveal'
import NewChildForm from '/src/components/screens/childInfo/newChildForm'
import {IoClose, IoPersonAdd, IoPersonAddOutline, IoPersonRemove} from 'react-icons/io5'
import NavBar from '/src/components/navBar'
import AlertManager from '/src/managers/alertManager'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DomManager from '/src/managers/domManager'
import StringManager from '/src/managers/stringManager'
import AddOrUpdateTransferChecklists from './addOrUpdateTransferChecklists'
import Checklists from './checklists'
import Spacer from '../../shared/spacer'
import {PiListChecksFill} from 'react-icons/pi'
import Checklist from './checklist'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DB_UserScoped from '../../../database/db_userScoped'
import ObjectManager from '../../../managers/objectManager'

export default function ChildInfo() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const [activeChild, setActiveChild] = useState(children?.[0])
  const imgRef = useRef()

  const UploadProfilePic = async (fromButton = false, childId = activeChild?.id) => {
    const uploadIcon = document.querySelector(`[data-id="${childId}" ]`)
    const uploadButton = document.querySelector('#upload-image-input.from-button')
    let imgFiles = uploadIcon?.files

    if (fromButton) {
      imgFiles = uploadButton?.files
    }
    if (imgFiles.length === 0) {
      AlertManager.throwError('Please choose an image')
      return false
    }
    // Upload -> Set child/general/profilePic
    const uploadedImageUrl = await FirebaseStorage.upload(
      FirebaseStorage.directories.profilePics,
      `${currentUser?.key}/${activeChild?.id}`,
      imgFiles[0],
      'profilePic'
    )

    console.log(activeChild?.general?.name)

    // Update Child profilePic
    await DB_UserScoped.updateUserChild(currentUser, activeChild, 'general', 'profilePic', uploadedImageUrl)
  }

  const DeleteChild = async () => {
    AlertManager.confirmAlert(
      `Are you sure you want to unlink ${StringManager.getFirstNameOnly(activeChild?.general?.name)} from your profile?`,
      `I'm Sure`,
      true,
      async () => {
        await DB_UserScoped.deleteChild(currentUser, activeChild)
      }
    )
  }

  // Set active child on page load
  useEffect(() => {
    if (children?.length > 0 && (!activeChild || ObjectManager.isEmpty(activeChild))) {
      setActiveChild(children?.[0])
    }
  }, [children])

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
        {/*<Fade direction={'right'} className={'fade-wrapper'} duration={800} damping={0.2} triggerOnce={false} cascade={true}>*/}
        {/* ADD CHILD */}
        <div
          className="action-item"
          onClick={() => {
            setShowNewChildForm(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper add-child">
              <IoPersonAdd className={'add-child'} />
            </div>
            <p>
              Enable Sharing & Info Storage
              <span className="subtitle">
                Store information and provide sharing permissions <b>for a child that has not been added to your profile</b> yet
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
                  Configure Checklists <span className="subtitle">Add or edit checklists for transferring to or from a co-parent&#39;s home</span>
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
        {/*</Fade>*/}

        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container child-info form`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title beside-action-button">Child Info</p>

          {/* ADD NEW BUTTON - DESKTOP */}
          {!DomManager.isMobile() && <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'add-new-button'} />}
        </div>

        <p className="screen-intro-text">
          You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
          moment.
        </p>

        <Spacer height={10} />

        {!Manager.isValid(children) && (
          <NoDataFallbackText
            text={'Currently, no children have been added. To share events with your children or to store their information, please add them here.'}
          />
        )}

        {/* CHILDREN WRAPPER */}
        <div id="child-wrapper">
          {Manager.isValid(children) &&
            children?.map((child, index) => {
              return (
                <div key={index}>
                  {/* PROFILE PIC */}
                  {Manager.isValid(child?.general?.profilePic) && (
                    <div onClick={() => setActiveChild(child)} className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                      <div className="child-image" style={{backgroundImage: `url(${child?.general?.profilePic})`}}>
                        <div className="after">
                          <input
                            ref={imgRef}
                            type="file"
                            id="upload-image-input"
                            placeholder=""
                            data-id={child.id}
                            accept="image/*"
                            onChange={() => UploadProfilePic(false, child.id)}
                          />
                          <FaCameraRotate />
                        </div>
                      </div>
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
          {activeChild && !activeChild?.general?.profilePic && (
            <button className="button default green upload-profile-pic-button">
              Upload Profile Pic
              <input
                ref={imgRef}
                type="file"
                id="upload-image-input"
                className="from-button"
                accept="image/*"
                onChange={() => UploadProfilePic(true)}
              />
            </button>
          )}
          <p id="child-name-primary">{activeChild?.general?.name}</p>
          {activeChild && (
            <Fade direction={'right'} duration={800} cascade={true} damping={0.2} triggerOnce={true}>
              <General activeChild={activeChild} />
              <Medical activeChild={activeChild} />
              <Schooling activeChild={activeChild} />
              <Behavior activeChild={activeChild} />
              {activeChild?.checklists?.find((x) => x?.fromOrTo === 'from') && <Checklist activeChild={activeChild} fromOrTo={'from'} />}
              {activeChild?.checklists?.find((x) => x?.fromOrTo === 'to') && <Checklist activeChild={activeChild} fromOrTo={'to'} />}
            </Fade>
          )}
        </div>
      </div>
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>Actions</p>
        </div>
      </NavBar>
    </>
  )
}