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
import BottomCard from '../../shared/bottomCard'
import {
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  throwError,
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

export default function ChildInfo() {
  // @ts-ignore
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
    // @ts-ignore
    const imgFiles = document.getElementById('upload-input').files
    if (imgFiles.length === 0) {
      throwError('Please choose an image')
      return false
    }

    // Upload -> Set child/general/profilepic
    await FirebaseStorage.upload(FirebaseStorage.directories.profilePics, activeInfoChild.id, img, 'profilepic').then(async (url) => {
      const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', 'profilepic', url)
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

    onValue(child(dbRef, `${DB.tables.users}/${currentUser.phone}/children`), async (snapshot) => {
      const kiddos = snapshot.val()
      if (!activeInfoChild) {
        setActiveInfoChild(kiddos[0])
      } else {
        const newActiveChild = kiddos.filter((x) => x.id === activeInfoChild.id)[0]
        setActiveInfoChild(newActiveChild)
      }
    })
  }

  const updateActiveChild = async (child) => {
    const children = await DB.getTable(`${DB.tables.users}/${currentUser.phone}/children`)
    const thisChild = children.filter((x) => x.id === child.id)[0]
    setActiveInfoChild(thisChild)
  }

  useEffect(() => {
    onTableChange().then((r) => r)

    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowNewChildForm(true)
          },
          color: 'green',
          icon: <IoPersonAddOutline className={'fs-26'} />,
        },
      })
    }, 300)
    Manager.showPageContainer('show')
  }, [])

  return (
    <div>
      {/* CHILD SELECTOR */}
      <BottomCard
        onClose={() => setShowSelectorCard(false)}
        title={'Choose Child'}
        subtitle="Select which child you would like to view & edit"
        showCard={showSelectorCard}
        className={`success`}>
        <ChildSelector
          setActiveChild={async (child) => {
            await updateActiveChild(child)
            setShowSelectorCard(false)
          }}
        />
      </BottomCard>

      {/* CUSTOM INFO FORM */}
      <BottomCard className="custom-child-info-wrapper" onClose={() => setShowInfoCard(false)} title={'Add Custom Info'} showCard={showInfoCard}>
        <CustomChildInfo setActiveChild={(child) => setActiveInfoChild(child)} activeChild={activeInfoChild} onClose={() => setShowInfoCard(false)} />
      </BottomCard>

      {/* NEW CHILD + */}
      <BottomCard className="new-child-wrapper" title={'Add Child'} showCard={showNewChildForm} onClose={() => setShowNewChildForm(false)}>
        <NewChildForm hideCard={() => setShowNewChildForm(false)} />
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="child-info-container" className={`${theme} page-container form`}>
        <p className="screen-title">Child Info</p>
        {/* PROFILE PIC */}
        <div id="children-container">
          <>
            {activeInfoChild && activeInfoChild?.general && (
              <>
                {Manager.isValid(activeInfoChild?.general['profilepic']) && (
                  <div className="profile-pic-container" style={{ backgroundImage: `url(${activeInfoChild?.general['profilepic']})` }}>
                    <input ref={imgRef} type="file" id="upload-input" accept="image/*" onChange={(e) => chooseImage(e)} />
                    <div className="after">
                      <span className="material-icons-outlined">flip_camera_ios</span>
                    </div>
                  </div>
                )}
                {!Manager.isValid(activeInfoChild?.general['profilepic']) && (
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
