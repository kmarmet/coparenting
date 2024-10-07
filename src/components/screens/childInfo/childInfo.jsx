import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
import React, { useContext, useEffect, useRef, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import Manager from '@manager'
import AddNewButton from '@shared/addNewButton'
import CustomChildInfo from '@screens/childInfo/customChildInfo'
import Behavior from '../childInfo/behavior'
import General from '../childInfo/general'
import Medical from '../childInfo/medical'
import Schooling from '../childInfo/schooling'
import DB_UserScoped from '@userScoped'
import PopupCard from 'components/shared/popupCard'

export default function ChildInfo() {
  // @ts-ignore
  const { state, setState } = useContext(globalState)
  const { currentUser, selectedChild } = state
  const [showCard, setShowCard] = useState(false)
  const imgRef = useRef()

  const uploadProfilePic = async (img) => {
    setState({ ...state, isLoading: true })
    // @ts-ignore
    const imgFiles = document.getElementById('upload-input').files
    if (imgFiles.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose an image', isLoading: false })
      return false
    }

    // Upload -> Set child/general/profilePic
    await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, selectedChild.id, img, 'profilePic').then(async (url) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `${DB.tables.users}/${currentUser.phone}/children`)).then(async (children) => {
        const key = await DB.getNestedSnapshotKey(`${DB.tables.users}/${currentUser.phone}/children`, selectedChild, 'id')
        set(child(dbRef, `${DB.tables.users}/${currentUser.phone}/children/${key}/general/profilePic`), url)
        setState({ ...state, isLoading: false })
      })
    })
  }

  const chooseImage = async (e) => {
    // @ts-ignore
    const img = document.querySelector('#upload-input').files[0]
    uploadProfilePic(img)
  }

  useEffect(() => {
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Child Info</p>
      <CustomChildInfo selectedChild={selectedChild} showCard={showCard} hasDropdown={true} onClose={() => setShowCard(false)} />

      {/* NEW CHILD + */}
      <AddNewButton onClick={() => setState({ ...state, currentScreen: ScreenNames.newChild, showMenuButton: false })} />

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className="page-container">
        {/* PROFILE PICS */}
        <div id="children-container" className="mb-10">
          <>
            {Manager.isValid(selectedChild?.general?.profilePic) && (
              <div className="profile-pic-container" style={{ backgroundImage: `url(${selectedChild.general?.profilePic})` }}>
                <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                <div className="after">
                  <span className="material-icons-outlined">flip_camera_ios</span>
                </div>
              </div>
            )}
            {!Manager.isValid(selectedChild?.general.profilePic) && (
              <div className="profile-pic-container no-image">
                <p>Upload Image</p>
              </div>
            )}

            <span className="child-name">{selectedChild?.general?.name.formatNameFirstNameOnly()}</span>
          </>
        </div>

        {/* INFO */}
        <>
          <div id="child-info">
            {selectedChild && (
              <div className="form">
                <General />
                <Medical />
                <Schooling />
                <Behavior />
              </div>
            )}
          </div>
          <button className="button default center green white-text mt-20 w-60" onClick={() => setShowCard(true)}>
            Add Your Own Info <span className="material-icons">auto_fix_high</span>
          </button>
          <button onClick={() => setState({ ...state, currentScreen: ScreenNames.childSelector })} className="button default mt-10 center w-60">
            Different Child
          </button>
        </>
      </div>
    </>
  )
}
