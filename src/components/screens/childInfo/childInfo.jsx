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

export default function ChildInfo() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)
  const [activeInfoChild, setActiveInfoChild] = useState(null)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [showNewChecklistCard, setShowNewChecklistCard] = useState(false)
  const [hasChildren, setHasChildren] = useState(false)
  const [showChecklistsCard, setShowChecklistsCard] = useState(false)
  const uploadProfilePic = async () => {
    // setState({ ...state, isLoading: true })
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
      setActiveInfoChild(updatedChild)
    })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children`), async (snapshot) => {
      const kiddos = Manager.convertToArray(snapshot.val())
      if (Manager.isValid(kiddos)) {
        setHasChildren(true)
      } else {
        setHasChildren(false)
      }
      const checklistBottomCard = document.querySelector('.child-info-checklists')
      if (checklistBottomCard && !checklistBottomCard.classList.contains('animate__fadeInUp')) {
        if (Manager.isValid(kiddos)) {
          if (!activeInfoChild) {
            setActiveInfoChild(kiddos[0])
          } else {
            const newActiveChild = kiddos.filter((x) => x.id === activeInfoChild.id)[0]
            setActiveInfoChild(newActiveChild)
          }
        }
      }
    })
  }

  const updateActiveChild = async (child) => {
    const children = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/children`)
    const thisChild = children.filter((x) => x.id === child.id)[0]
    setActiveInfoChild(thisChild)
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      {/* CHILD SELECTOR */}
      <ChildSelector
        activeInfoChild={activeInfoChild}
        showCard={showSelectorCard}
        hideCard={() => setShowSelectorCard(false)}
        setActiveChild={async (child) => {
          await updateActiveChild(child)
          setShowSelectorCard(false)
        }}
      />
      {/* CUSTOM INFO FORM */}
      <CustomChildInfo
        showCard={showInfoCard}
        setActiveChild={(child) => setActiveInfoChild(child)}
        activeChild={activeInfoChild}
        hideCard={() => setShowInfoCard(false)}
      />
      {/* NEW CHILD + */}
      <NewChildForm showCard={showNewChildForm} hideCard={() => setShowNewChildForm(false)} />

      <NewTransferChecklist activeChild={activeInfoChild} showCard={showNewChecklistCard} hideCard={() => setShowNewChecklistCard(false)} />

      <Checklists showCard={showChecklistsCard} hideCard={() => setShowChecklistsCard(false)} activeChild={activeInfoChild} />

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Child Info </p>
            {!DomManager.isMobile() && <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'add-new-button'} />}
          </div>
          <p>
            You can store and access all relevant information about your child, particularly essential details that you may need to retrieve at any
            moment.
          </p>
          <Spacer height={10} />

          {!hasChildren && (
            <NoDataFallbackText
              text={
                'No children have been added yet. In order to share events with your children, or store information about them - you will need to add them here.'
              }
            />
          )}

          {/* PROFILE PIC */}
          <div id="image-and-actions-wrapper">
            <div className="left">
              {Manager.isValid(activeInfoChild?.general['profilePic']) && (
                <div className="profile-pic-container" style={{ backgroundImage: `url(${activeInfoChild?.general['profilePic']})` }}>
                  <div className="after">
                    <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                    <FaCameraRotate />
                  </div>
                </div>
              )}
              {!Manager.isValid(activeInfoChild?.general['profilePic'], true) && (
                <div className="profile-pic-container no-image">
                  <div className="after">
                    <input ref={imgRef} type="file" id="upload-image-input" accept="image/*" onChange={uploadProfilePic} />
                    <BiImageAdd />
                  </div>
                </div>
              )}
              <span className="child-name">{StringManager.getFirstNameOnly(activeInfoChild?.general?.name)}</span>
            </div>

            <div className="right">
              {/* BUTTONS */}
              {Manager.isValid(currentUser?.children) && (
                <div key={refreshKey}>
                  <div className="buttons">
                    <button
                      className="button default"
                      onClick={() => {
                        setShowInfoCard(true)
                      }}>
                      Add Your Own Info
                    </button>
                    {currentUser?.children?.length > 1 && (
                      <button
                        onClick={() => {
                          setShowSelectorCard(true)
                        }}
                        className="button default">
                        View Another Child
                      </button>
                    )}
                    <button className="default button" onClick={() => setShowNewChecklistCard(true)}>
                      Create Transfer Checklist
                    </button>
                    {Manager.isValid(activeInfoChild?.checklists) && (
                      <button
                        className="default button"
                        onClick={() => {
                          setShowChecklistsCard(true)
                        }}>
                        View Transfer Checklists
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INFO */}

          <div id="child-info">
            {activeInfoChild && (
              <div className="form">
                <General activeChild={activeInfoChild} setActiveChild={(child) => setActiveInfoChild(child)} />
                <Medical activeChild={activeInfoChild} setActiveChild={(child) => setActiveInfoChild(child)} />
                <Schooling activeChild={activeInfoChild} setActiveChild={(child) => setActiveInfoChild(child)} />
                <Behavior activeChild={activeInfoChild} setActiveChild={(child) => setActiveInfoChild(child)} />
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