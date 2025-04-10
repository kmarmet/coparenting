// Path: src\components\screens\childInfo\childInfo.jsx
import React, {useContext, useEffect, useRef, useState} from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import FirebaseStorage from '/src/database/firebaseStorage'
import Manager from '/src/managers/manager'
import CustomChildInfo from '../../shared/customChildInfo'
import Behavior from '/src/components/screens/childInfo/behavior'
import General from '/src/components/screens/childInfo/general'
import Medical from '/src/components/screens/childInfo/medical'
import {HiDotsHorizontal} from 'react-icons/hi'
import Schooling from '/src/components/screens/childInfo/schooling'
import {FaCameraRotate, FaWandMagicSparkles} from 'react-icons/fa6'
import {BiImageAdd, BiSolidUserCircle} from 'react-icons/bi'
import {Fade} from 'react-awesome-reveal'
import NewChildForm from '/src/components/screens/childInfo/newChildForm'
import {IoClose, IoPersonAdd, IoPersonAddOutline, IoPersonRemove} from 'react-icons/io5'
import ChildSelector from '/src/components/screens/childInfo/childSelector'
import DB_UserScoped from '/src/database/db_userScoped'
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

export default function ChildInfo() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, activeInfoChild} = state
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const [activeChild, setActiveChild] = useState()

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
      setState({...state, activeInfoChild: updatedChild, isLoading: false})
    })
  }

  const setDefaultActiveChild = async (forceSet) => {
    const children = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children`)
    if (Manager.isValid(children)) {
      if (!Manager.isValid(activeInfoChild)) {
        setTimeout(() => {
          setState({...state, activeInfoChild: children[0]})
        }, 300)
      } else {
        if (forceSet) {
          setState({...state, activeInfoChild: children[0]})
        }
      }
    }
  }

  const deleteChild = async () => {
    AlertManager.confirmAlert(
      `Are you sure you want to unlink ${StringManager.getFirstNameOnly(activeInfoChild?.general?.name)} from your profile?`,
      `I'm Sure`,
      true,
      async () => {
        const childKey = await DB.getSnapshotKey(`${DB.tables.users}/${currentUser?.key}/children`, activeInfoChild, 'id')
        if (Manager.isValid(childKey)) {
          await DB.deleteByPath(`${DB.tables.users}/${currentUser?.key}/children/${childKey}`)
          setDefaultActiveChild(true).then((r) => r)
        }
      }
    )
  }

  useEffect(() => {
    setDefaultActiveChild().then((r) => r)
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
          <AddOrUpdateTransferChecklists
            activeChild={activeInfoChild}
            showCard={showNewChecklistCard}
            hideCard={() => setShowNewChecklistCard(false)}
          />

          {/* VIEW CHECKLISTS */}
          <Checklists showCard={showChecklistsCard} hideCard={() => setShowChecklistsCard(false)} activeChild={activeInfoChild} />
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
              Add Child to Your Profile
              <span className="subtitle">Store information about a child that has not been added to your profile yet</span>
            </p>
          </div>
        </div>

        {/*  UNLINK CHILD */}
        <div
          className="action-item"
          onClick={async () => {
            await deleteChild()
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper add-child">
              <IoPersonRemove className={'remove-child'} />
            </div>
            <p>
              Unlink {activeInfoChild?.general?.name} from Your Profile
              <span className="subtitle">Remove all information about {activeInfoChild?.general?.name}</span>
            </p>
          </div>
        </div>
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

        {/* VIEW ANOTHER CHILD */}
        {currentUser?.children?.length > 1 && (
          <div
            onClick={() => {
              setShowSelectorCard(true)
              setState({...state, showScreenActions: false})
            }}
            className="action-item">
            <div className="content">
              <div className="svg-wrapper">
                <BiSolidUserCircle className={'child'} />
              </div>
              <p>
                View Another Child <p className="subtitle">Visit information details for a different child</p>
              </p>
            </div>
          </div>
        )}

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
              Configure Checklists <p className="subtitle">Add or edit checklists for transferring to or from a co-parent&#39;s home</p>
            </p>
          </div>
        </div>

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

        <p>
          You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
          moment.
        </p>

        <Spacer height={10} />

        {!Manager.isValid(currentUser?.children) && (
          <NoDataFallbackText
            text={'Currently, no children have been added. To share events with your children or to store their information, please add them here.'}
          />
        )}

        {/* IMAGE AND ACTIONS */}
        <div id="child-wrapper">
          {Manager.isValid(currentUser?.children) &&
            currentUser?.children.map((child, index) => {
              return (
                <div key={index}>
                  {/* PROFILE PIC */}
                  {Manager.isValid(child?.general?.profilePic) && (
                    <div onClick={() => setActiveChild(child)} className={activeInfoChild?.id === child?.id ? 'child active' : 'child'}>
                      <div className="child-image" style={{backgroundImage: `url(${child?.general?.profilePic})`}}>
                        <div className="after">
                          <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                          <FaCameraRotate />
                        </div>
                      </div>
                      {/* CHILD NAME */}
                      <span className="child-name">{StringManager.getFirstNameOnly(child?.general?.name)}</span>
                    </div>
                  )}

                  {/* DEFAULT AVATAR */}
                  {!Manager.isValid(child?.general?.profilePic, true) && (
                    <div className="child-image no-image">
                      {child?.general?.name[0]?.toUpperCase()}
                      <div className="after">
                        <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                        <BiImageAdd />
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
          {activeInfoChild && (
            <div className="form">
              <Fade direction={'right'} duration={800} cascade={true} damping={0.2} triggerOnce={true}>
                <General />
                <Medical />
                <Schooling />
                <Behavior />
                {activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'from') && <Checklist fromOrTo={'from'} />}
                {activeInfoChild?.checklists?.find((x) => x?.fromOrTo === 'to') && <Checklist fromOrTo={'to'} />}
              </Fade>
            </div>
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