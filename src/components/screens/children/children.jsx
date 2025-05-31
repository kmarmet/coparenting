// Path: src\components\screens\childInfo\childInfo.jsx
import NavBar from '../../navBar'
import Behavior from '../../screens/children/behavior'
import General from '../../screens/children/general'
import Medical from '../../screens/children/medical'
import NewChildForm from '../../screens/children/newChildForm'
import Schooling from '../../screens/children/schooling'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import FirebaseStorage from '../../../database/firebaseStorage'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import {PiCameraRotateFill, PiListChecksFill} from 'react-icons/pi'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useActiveChild from '../../../hooks/useActiveChild'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import CustomChildInfo from '../../shared/customChildInfo'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import AddOrUpdateTransferChecklists from './addOrUpdateTransferChecklists'
import Checklist from './checklist'
import Checklists from './checklists'
import DB from '../../../database/DB'

export default function Children() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const [activeChildId, setActiveChildId] = useState(currentUser?.children?.[0]?.id)
  const {activeChild} = useActiveChild(activeChildId)
  const imgRef = useRef()

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
    const uploadedImageUrl = await FirebaseStorage.upload(
      FirebaseStorage.directories.profilePics,
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
    <>
      {Manager.IsValid(activeChild) && (
        <>
          {/* CUSTOM INFO FORM */}
          <CustomChildInfo showCard={showInfoCard} activeChild={activeChild} hideCard={() => setShowInfoCard(false)} />

          {/* NEW CHECKLIST */}
          <AddOrUpdateTransferChecklists
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
      <ScreenActionsMenu title="Manage Children">
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
        {Manager.IsValid(children) && (
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
                  onChange={() => UploadProfilePic(false)}
                />
                <div className="svg-wrapper">
                  <PiCameraRotateFill className={'profile-pic'} />
                </div>
                <p>
                  Manage Profile Picture
                  <span className="subtitle">
                    Add a profile picture of {StringManager.GetFirstNameOnly(activeChild?.general?.name)}. Or replace it if a picture has already been
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
          <div style={DomManager.AnimateDelayStyle(1)} className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, '.fade-up-wrapper')}`}>
            {/* CHILDREN WRAPPER */}
            <div id="child-wrapper">
              {Manager.IsValid(children) &&
                children?.map((child) => {
                  return (
                    <div key={child?.id}>
                      {/* PROFILE PIC */}
                      {Manager.IsValid(child?.profilePic) && (
                        <div onClick={() => setActiveChildId(child?.id)} className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                          <div className="child-image" style={{backgroundImage: `url(${child?.profilePic})`, transition: 'all .3s linear'}}></div>
                          {/* CHILD NAME */}
                          <span className="child-name">{StringManager.GetFirstNameOnly(child?.general?.name)}</span>
                        </div>
                      )}

                      {/* NO IMAGE */}
                      {!Manager.IsValid(child?.profilePic, true) && (
                        <div onClick={() => setActiveChildId(child?.id)} className={activeChild?.id === child?.id ? 'child active' : 'child'}>
                          <div className="child-image no-image">
                            <span>No Image</span>
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
        <NoDataFallbackText
          text={'Currently, no children have been added. To share events with your children or to store their information, please Add them here.'}
        />
      )}
    </>
  )
}