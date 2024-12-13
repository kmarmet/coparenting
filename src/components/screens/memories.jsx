import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Manager from '@manager'
import globalState from '../../context'
import SecurityManager from '../../managers/securityManager'
import NewMemoryForm from '../forms/newMemoryForm'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import { HiOutlineSave } from 'react-icons/hi'
import moment from 'moment'
import {
  capitalizeFirstWord,
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
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
} from '../../globalFunctions'
import { LuImagePlus } from 'react-icons/lu'
import ImageManager from '../../managers/imageManager'
import { IoIosCloseCircle } from 'react-icons/io'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [memories, setMemories] = useState([])
  const [showNewMemoryCard, setShowNewMemoryCard] = useState(false)
  const dbRef = ref(getDatabase())
  const inputFile = useRef(null)

  const getSecuredMemories = async () => {
    let all = await SecurityManager.getMemories(currentUser)
    if (Manager.isValid(all, true)) {
      setState({ ...state, isLoading: true })
      let validImages = []
      for (const memory of all) {
        if (Manager.isValid(memory.url)) {
          const imageStatusCode = await ImageManager.getStatusCode(memory.url)
          if (imageStatusCode === 404) {
            // Delete memory if no longer in Firebase Storage
            await DB.deleteMemory(currentUser.phone, memory)
          }
          if (imageStatusCode === 200) {
            validImages.push(memory)
          }
        }
      }
      validImages = validImages.filter((x) => x)
      if (currentUser) {
        if (Manager.isValid(validImages, true)) {
          setMemories(validImages)
          setTimeout(() => {
            setState({ ...state, isLoading: false })
          }, 600)
          setTimeout(() => {
            addImageAnimation()
          }, 200)
        } else {
          setState({ ...state, isLoading: false })
          setMemories([])
        }
      }
    } else {
      setMemories([])
      setState({ ...state, isLoading: false })
    }
  }

  const deleteMemory = async (path, record) => {
    document.querySelectorAll('.memory-image').forEach((memoryImage) => memoryImage.classList.remove('active'))
    setState({ ...state, isLoading: true })
    const imageName = FirebaseStorage.getImageNameFromUrl(path)

    // Current user is record owner
    if (record.ownerPhone === currentUser?.phone) {
      // Delete from Firebase Realtime DB
      await DB.deleteMemory(currentUser?.phone, record).then(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser?.id, imageName)
      })
    }
    // Memory was shared with current user -> hide it
    else {
      const memoryKey = await DB.getSnapshotKey(`${DB.tables.memories}`, record, 'id')
      const updatedShareWith = record.shareWith.filter((x) => x !== currentUser?.phone)
      await DB.updateByPath(`${DB.tables.memories}/${memoryKey}/shareWith`, updatedShareWith)
    }
  }

  const addImageAnimation = async () => {
    document.querySelectorAll('.memory-image').forEach((memoryImage, i) => {
      setTimeout(() => {
        setTimeout(() => {
          memoryImage.classList.add('active')
        }, 200 * i)
      }, 500)
    })
  }

  const saveMemoryImage = (e) => {
    const memoryImage = e.target.parentNode.previousSibling
    if (Manager.isValid(memoryImage)) {
      const src = memoryImage.getAttribute('data-src')
      if (Manager.isValid(src)) {
        ImageManager.saveImageFromUrl(null, src)
      }
    }
  }

  const onTableChange = async () => {
    onValue(child(dbRef, `${DB.tables.memories}`), async (snapshot) => {
      await getSecuredMemories(currentUser)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  }, [])

  return (
    <>
      {/* NEW MEMORY FORM */}
      <NewMemoryForm hideCard={(e) => setShowNewMemoryCard(false)} showCard={showNewMemoryCard} />

      {/* PAGE CONTAINER */}
      <div id="memories-container" className={`${theme} page-container`}>
        <p className="screen-title">Memories</p>
        <p id="happy-subtitle" className={`${theme} mb-10`}>
          Upload photos of memories that are too good NOT to share <span className="material-icons heart">favorite</span>
        </p>

        {memories && memories.length === 0 && <NoDataFallbackText text={'There are currently no memories'} />}
        {/* GALLERY */}
        <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'.memory-image'}>
          <>
            {Manager.isValid(memories, true) &&
              memories.map((imgObj, index) => {
                return (
                  <div key={index} className="memory">
                    {/* TITLE AND DATE */}
                    {imgObj?.title.length > 0 && (
                      <div id="title-and-date">
                        {/* TITLE */}
                        <p className="title">{uppercaseFirstLetterOfAllWords(imgObj.title)}</p>

                        {/* DATE */}
                        {DateManager.dateIsValid(imgObj.memoryCaptureDate) && (
                          <p id="date">{moment(imgObj.memoryCaptureDate).format(DateFormats.readableMonthAndDay)}</p>
                        )}
                      </div>
                    )}

                    {/* IMAGE */}
                    <div style={{ backgroundImage: `url(${imgObj?.url})` }} className="memory-image" data-src={imgObj?.url}>
                      {/* DELETE ICON */}
                      <IoIosCloseCircle className={'delete-icon'} onClick={() => deleteMemory(imgObj.url, imgObj)} />
                    </div>

                    {/* NOTES */}
                    <div id="below-image" className="flex">
                      <p className="text">{capitalizeFirstWord(imgObj?.notes)}</p>

                      {/* SAVE ICON */}
                      <HiOutlineSave id={'save-icon'} onClick={(e) => saveMemoryImage(e)} />
                    </div>
                  </div>
                )
              })}
          </>
        </LightGallery>
        {memories.length > 0 && (
          <div id="disclaimer">
            <p className="blue">
              All images will be automatically (and permanently) deleted after 30 days from their creation date. Feel free to download them at any
              time.
            </p>
          </div>
        )}
      </div>
      {!showNewMemoryCard && (
        <NavBar navbarClass={'child-info'}>
          <LuImagePlus onClick={() => setShowNewMemoryCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}