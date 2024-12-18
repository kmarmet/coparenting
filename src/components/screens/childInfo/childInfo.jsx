import { child, getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useRef, useState } from 'react'
import globalState from '../../../context'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import Manager from '@manager'
import CustomChildInfo from '../../shared/customChildInfo'
import Behavior from '../childInfo/behavior'
import General from '../childInfo/general'
import Medical from '../childInfo/medical'
import Schooling from '../childInfo/schooling'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import {
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import NewChildForm from './newChildForm'
import ChildSelector from './childSelector'
import { BiImageAdd } from 'react-icons/bi'
import DB_UserScoped from '@userScoped'
import { IoPersonAddOutline } from 'react-icons/io5'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'
import NoDataFallbackText from '../../shared/noDataFallbackText'

export default function ChildInfo() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [showCard, setShowCard] = useState(false)
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)
  const [activeInfoChild, setActiveInfoChild] = useState(null)
  const [showNewChildForm, setShowNewChildForm] = useState(false)

  const uploadProfilePic = async (img) => {
    setState({ ...state, isLoading: true })
    const imgFiles = document.getElementById('upload-input').files
    if (imgFiles.length === 0) {
      AlertManager.throwError('Please choose an image')
      return false
    }

    // Upload -> Set child/general/profilePic
    await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, activeInfoChild.id, img, 'profilePic').then(async (url) => {
      const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', 'profilePic', url)
      setState({ ...state, isLoading: false })
      setActiveInfoChild(updatedChild)
    })
  }

  const chooseImage = async (e) => {
    const img = document.querySelector('#upload-input').files[0]
    await uploadProfilePic(img)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, `${DB.tables.users}/${currentUser?.phone}/children`), async (snapshot) => {
      const kiddos = Manager.convertToArray(snapshot.val())
      if (Manager.isValid(kiddos, true)) {
        if (!activeInfoChild) {
          setActiveInfoChild(kiddos[0])
        } else {
          const newActiveChild = kiddos.filter((x) => x.id === activeInfoChild.id)[0]
          setActiveInfoChild(newActiveChild)
        }
      }
    })
  }

  const updateActiveChild = async (child) => {
    const children = await DB.getTable(`${DB.tables.users}/${currentUser?.phone}/children`)
    const thisChild = children.filter((x) => x.id === child.id)[0]
    setActiveInfoChild(thisChild)
  }

  useEffect(() => {
    onTableChange().then((r) => r)

    Manager.showPageContainer('show')
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

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        <p className="screen-title">Child Info</p>

        {!Manager.isValid(currentUser?.children?.[0]) && currentUser?.children?.length <= 0 && (
          <NoDataFallbackText
            text={'No children have been added yet. In order to share events (and other details) with a child, you will need to add them here.'}
          />
        )}

        {/* PROFILE PIC */}
        <div id="children-container">
          <>
            {activeInfoChild && activeInfoChild?.general && (
              <>
                {Manager.isValid(activeInfoChild?.general['profilePic']) && (
                  <div className="profile-pic-container" style={{ backgroundImage: `url(${activeInfoChild?.general['profilePic']})` }}>
                    <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                    <div className="after">
                      <span className="material-icons-outlined">flip_camera_ios</span>
                    </div>
                  </div>
                )}
                {!Manager.isValid(activeInfoChild?.general['profilePic']) && (
                  <div className="profile-pic-container no-image">
                    <div className="after">
                      <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                      <BiImageAdd />
                    </div>
                  </div>
                )}
              </>
            )}

            <span className="child-name">{formatNameFirstNameOnly(activeInfoChild?.general?.name)}</span>
          </>
        </div>

        {/* INFO */}
        <>
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
          {Manager.isValid(currentUser?.children, true) && (
            <>
              <button
                className="button default center green white-text mt-20"
                onClick={() => {
                  setShowInfoCard(true)
                }}>
                Add Your Own Info <FaWandMagicSparkles />
              </button>
              {currentUser.children.length > 0 && (
                <button onClick={() => setShowSelectorCard(true)} className="button default mt-10 center">
                  Different Child
                </button>
              )}
            </>
          )}
        </>
      </div>
      {!showNewChildForm && !showSelectorCard && !showInfoCard && (
        <NavBar navbarClass={'child-info'}>
          <IoPersonAddOutline onClick={() => setShowNewChildForm(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}