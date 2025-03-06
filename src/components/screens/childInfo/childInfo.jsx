// Path: src\components\screens\childInfo\childInfo.jsx
import { child, getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useRef, useState } from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import FirebaseStorage from '/src/database/firebaseStorage'
import Manager from '/src/managers/manager'
import CustomChildInfo from '../../shared/customChildInfo'
import Behavior from '/src/components/screens/childInfo/behavior'
import General from '/src/components/screens/childInfo/general'
import Medical from '/src/components/screens/childInfo/medical'
import Schooling from '/src/components/screens/childInfo/schooling'
import { FaCameraRotate } from 'react-icons/fa6'
import { BiImageAdd } from 'react-icons/bi'
import { TbChecklist } from 'react-icons/tb'
import { Fade } from 'react-awesome-reveal'
import NewChildForm from '/src/components/screens/childInfo/newChildForm'
import ChildSelector from '/src/components/screens/childInfo/childSelector'
import DB_UserScoped from '/src/database/db_userScoped'
import { IoPersonAddOutline } from 'react-icons/io5'
import NavBar from '/src/components/navBar'
import AlertManager from '/src/managers/alertManager'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DomManager from '/src/managers/domManager'
import StringManager from '/src/managers/stringManager'
import NewTransferChecklist from './newTransferChecklist'
import Checklists from './checklists'
import Spacer from '../../shared/spacer'
import Actions from '../../shared/actions'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { BiFace } from 'react-icons/bi'

export default function ChildInfo() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [activeChildChecklists, setActiveChildChecklists] = useState(false)

  const uploadProfilePic = async () => {
    const imgFiles = document.getElementById('upload-image-input').files

    if (imgFiles.length === 0) {
      AlertManager.throwError('Please choose an image')
      return false
    }

    // Upload -> Set child/general/profilePic
    await FirebaseStorage.upload(
      FirebaseStorage.directories.profilePics,
      `${currentUser?.key}/${activeInfoChild?.id}`,
      imgFiles[0],
      'profilePic'
    ).then(async (url) => {
      const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', 'profilePic', url)
      setState({ ...state, isLoading: false })
      setState({ ...state, activeInfoChild: updatedChild })
    })
  }

  const checkForChecklists = async () => {
    const children = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children`)
    if (children) {
      setTimeout(() => {
        setState({ ...state, activeInfoChild: children[0] })
      }, 300)
      if (children[0]) {
        const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, children[0], 'id')
        if (childKey) {
          const checklists = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children/${childKey}/checklists`)
          setActiveChildChecklists(checklists)
        }
      }
    }
  }

  useEffect(() => {
    checkForChecklists().then((r) => r)
  }, [])

  return (
    <>
      {/* CHILD SELECTOR */}
      {Manager.isValid(activeInfoChild) && <ChildSelector showCard={showSelectorCard} hideCard={() => setShowSelectorCard(false)} />}
      {Manager.isValid(activeInfoChild) && (
        <>
          {/* CUSTOM INFO FORM */}
          <CustomChildInfo showCard={showInfoCard} activeChild={activeInfoChild} hideCard={() => setShowInfoCard(false)} />
          {/* NEW CHECKLIST */}
          <NewTransferChecklist activeChild={activeInfoChild} showCard={showNewChecklistCard} hideCard={() => setShowNewChecklistCard(false)} />
          {/* VIEW CHECKLISTS */}
          <Checklists showCard={showChecklistsCard} hideCard={() => setShowChecklistsCard(false)} activeChild={activeInfoChild} />
        </>
      )}

      {/* NEW CHILD  */}
      <NewChildForm showCard={showNewChildForm} hideCard={() => setShowNewChildForm(false)} />

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Child Info</p>

            {/* ADD NEW BUTTON - DESKTOP */}
            {!DomManager.isMobile() && <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'add-new-button'} />}
            {/* ACTIONS BUTTON */}
            {showActions ? (
              <IoClose id={'actions-button'} onClick={() => setShowActions(false)} />
            ) : (
              <HiOutlineDotsVertical id={'actions-button'} onClick={() => setShowActions(true)} />
            )}
          </div>

          <p>
            You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
            moment.
          </p>

          {/* ACTIONS */}
          {Manager.isValid(currentUser?.children) && (
            <Actions show={showActions}>
              <div className="action-items">
                <div
                  className="action-item"
                  onClick={() => {
                    setShowInfoCard(true)
                    setShowActions(false)
                  }}>
                  <div className="svg-wrapper">
                    <FaWandMagicSparkles />
                  </div>
                  <span>Add Your Own Info</span>
                </div>
                {currentUser?.children?.length > 1 && (
                  <div
                    onClick={() => {
                      setShowSelectorCard(true)
                      setShowActions(false)
                    }}
                    className="action-item">
                    <div className="svg-wrapper">
                      <BiFace className={'child'} />
                    </div>
                    <span>View Another Child</span>
                  </div>
                )}
                {activeChildChecklists.length < 2 && (
                  <div
                    className="action-item"
                    onClick={() => {
                      setShowActions(false)
                      setShowNewChecklistCard(true)
                    }}>
                    <div className="svg-wrapper">
                      <TbChecklist className={'checklist'} />
                    </div>
                    <span>Create Transfer Checklist</span>
                  </div>
                )}
                {Manager.isValid(activeChildChecklists) && (
                  <button
                    className="action-item"
                    onClick={() => {
                      setShowChecklistsCard(true)
                      setShowActions(false)
                    }}>
                    <div className="svg-wrapper">
                      <TbChecklist className={'checklist'} />
                    </div>
                    <span>View Transfer Checklists</span>
                  </button>
                )}
              </div>
            </Actions>
          )}
          <Spacer height={10} />

          {!Manager.isValid(currentUser?.children) && (
            <NoDataFallbackText
              text={'Currently, no children have been added. To share events with your children or to store their information, please add them here.'}
            />
          )}

          {/* PROFILE PIC */}
          <div id="image-and-actions-wrapper">
            {Manager.isValid(activeInfoChild?.general?.profilePic) && (
              <div className="profile-pic-container" style={{ backgroundImage: `url(${activeInfoChild?.general?.profilePic})` }}>
                <div className="after">
                  <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                  <FaCameraRotate />
                </div>
              </div>
            )}
            {!Manager.isValid(activeInfoChild?.general?.profilePic, true) && (
              <div className="profile-pic-container no-image">
                <div className="after">
                  <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                  <BiImageAdd />
                </div>
              </div>
            )}
            <span className="child-name">{StringManager.getFirstNameOnly(activeInfoChild?.general?.name)}</span>
          </div>

          {/* INFO */}

          <div id="child-info">
            {activeInfoChild && (
              <div className="form">
                <General />
                <Medical />
                <Schooling />
                <Behavior />
              </div>
            )}
          </div>
        </Fade>
      </div>
      {!showNewChildForm && !showSelectorCard && !showInfoCard && (
        <NavBar navbarClass={'child-info'}>
          <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}