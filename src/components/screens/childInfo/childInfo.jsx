import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
import React, { useContext, useEffect, useRef, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import Manager from '@manager'
import CustomChildInfo from '../../shared/customChildInfo'
import Behavior from '../childInfo/behavior'
import General from '../childInfo/general'
import Medical from '../childInfo/medical'
import Schooling from '../childInfo/schooling'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  uniqueArray,
} from '../../../globalFunctions'
import NewChildForm from './newChildForm'
import ChildSelector from './childSelector'
import DateFormats from '../../../constants/dateFormats'

export default function ChildInfo() {
  // @ts-ignore
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [showCard, setShowCard] = useState(false)
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)
  const [activeChild, setActiveChild] = useState(null)

  const uploadProfilePic = async (img) => {
    setState({ ...state, isLoading: true })
    // @ts-ignore
    const imgFiles = document.getElementById('upload-input').files
    if (imgFiles.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose an image', isLoading: false, alertType: 'error' })
      return false
    }

    // Upload -> Set child/general/profilePic
    await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, activeChild.id, img, 'profilePic').then(async (url) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `${DB.tables.users}/${currentUser.phone}/children`)).then(async (children) => {
        const key = await DB.getNestedSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, activeChild, 'id')
        set(child(dbRef, `${DB.tables.users}/${currentUser.phone}/children/${key}/general/profilePic`), url)
        setState({ ...state, isLoading: false })
      })
    })
  }

  const chooseImage = async (e) => {
    const img = document.querySelector('#upload-input').files[0]
    await uploadProfilePic(img)
  }

  useEffect(() => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowCard(true)
          },
        },
      })
    }, 300)
    Manager.toggleForModalOrNewForm('show')
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `users/${currentUser.phone}/children`), async (snapshot) => {
      const children = snapshot.val()

      if (!activeChild) {
        setActiveChild(children[0])
      } else {
        setActiveChild(activeChild)
      }
    })
  }, [])

  return (
    <>
      {/* CHILD SELECTOR */}
      <ChildSelector setActiveChild={setActiveChild} showCard={showSelectorCard} setShowCard={() => setShowSelectorCard(false)} />

      {/* CUSTOM INFO FORM */}
      <CustomChildInfo
        activeChild={activeChild}
        showCard={showInfoCard}
        hasDropdown={true}
        hideCard={() => setShowInfoCard(false)}
        onClose={() => setShowInfoCard(false)}
      />

      {/* NEW CHILD + */}
      <NewChildForm showCard={showCard} setShowCard={() => setShowCard(!showCard)} />

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        {/* PROFILE PIC */}
        <div id="children-container" className="mb-10">
          <>
            {Manager.isValid(activeChild?.general?.profilePic) && (
              <div className="profile-pic-container" style={{ backgroundImage: `url(${activeChild.general?.profilePic})` }}>
                <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                <div className="after">
                  <span className="material-icons-outlined">flip_camera_ios</span>
                </div>
              </div>
            )}
            {!Manager.isValid(activeChild?.general.profilePic) && (
              <div className="profile-pic-container no-image">
                <p>Upload Image</p>
              </div>
            )}

            <span className="child-name">{formatNameFirstNameOnly(activeChild?.general?.name)}</span>
          </>
        </div>

        {/* INFO */}
        <>
          <div id="child-info">
            {activeChild && (
              <div className="form">
                <General activeChild={activeChild} />
                <Medical activeChild={activeChild} />
                <Schooling activeChild={activeChild} />
                <Behavior activeChild={activeChild} />
              </div>
            )}
          </div>
          <button
            className="button default center green white-text mt-20 w-60"
            onClick={() => {
              setShowInfoCard(true)
            }}>
            Add Your Own Info <span className="material-icons">auto_fix_high</span>
          </button>
          <button onClick={() => setShowSelectorCard(true)} className="button default mt-10 center w-60">
            Different Child
          </button>
        </>
      </div>
    </>
  )
}
