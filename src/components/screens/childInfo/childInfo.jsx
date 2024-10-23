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
  displayAlert,
  uniqueArray,
} from '../../../globalFunctions'
import NewChildForm from './newChildForm'
import ChildSelector from './childSelector'
import DateFormats from '../../../constants/dateFormats'
import DB_UserScoped from '@userScoped'

export default function ChildInfo() {
  // @ts-ignore
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton, activeInfoChild } = state
  const [showCard, setShowCard] = useState(false)
  const imgRef = useRef()
  const [showInfoCard, setShowInfoCard] = useState(false)
  const [showSelectorCard, setShowSelectorCard] = useState(false)

  const uploadProfilePic = async (img) => {
    setState({ ...state, isLoading: true })
    // @ts-ignore
    const imgFiles = document.getElementById('upload-input').files
    if (imgFiles.length === 0) {
      displayAlert('error', 'Please choose an image')
      return false
    }

    // Upload -> Set child/general/profilePic
    await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, activeInfoChild.id, img, 'profilePic').then(async (url) => {
      const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', 'profilePic', url)
      setState({ ...state, isLoading: false, activeInfoChild: updatedChild })
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
        activeInfoChild: currentUser.children[0],
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowCard(true)
          },
        },
      })
    }, 300)
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <div>
      {/* CHILD SELECTOR */}
      <ChildSelector hideCard={() => setShowSelectorCard(false)} showCard={showSelectorCard} />

      {/* CUSTOM INFO FORM */}
      <CustomChildInfo activeChild={activeInfoChild} showCard={showInfoCard} hideCard={async () => setShowInfoCard(false)} />

      {/* NEW CHILD + */}
      <NewChildForm showCard={showCard} hideCard={() => setShowCard(false)} />

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        {/* PROFILE PIC */}
        <div id="children-container" className="mb-10">
          <>
            {Manager.isValid(activeInfoChild?.general['profilepic']) && (
              <div className="profile-pic-container" style={{ backgroundImage: `url(${activeInfoChild.general['profilepic']})` }}>
                <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                <div className="after">
                  <span className="material-icons-outlined">flip_camera_ios</span>
                </div>
              </div>
            )}
            {!Manager.isValid(activeInfoChild?.general['profilepic']) && (
              <div className="profile-pic-container" style={{ backgroundImage: `url(${require('../../../img/upload-image-placeholder.jpg')})` }}>
                <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                <div className="after">
                  <span className="material-icons-outlined">flip_camera_ios</span>
                </div>
              </div>
            )}

            <span className="child-name">{formatNameFirstNameOnly(activeInfoChild?.general?.name)}</span>
          </>
        </div>

        {/* INFO */}
        <>
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
    </div>
  )
}
