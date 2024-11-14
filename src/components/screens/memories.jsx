import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Manager from '@manager'
import globalState from '../../context'
import Memory from '../../models/memory'
import SecurityManager from '../../managers/securityManager'
import NewMemoryForm from '../forms/newMemoryForm'
import ModelNames from '../../models/modelNames'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import { HiOutlineSave } from 'react-icons/hi'
import moment from 'moment'
import {
  capitalizeFirstWord,
  contains,
  displayAlert,
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
import { saveImageFromUrl } from '../../managers/imageManager'
import { IoIosCloseCircle } from 'react-icons/io'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [memories, setMemories] = useState([])
  const [imgArray, setImgArray] = useState([])
  const [showNewMemoryCard, setShowNewMemoryCard] = useState(false)
  const dbRef = ref(getDatabase())
  const inputFile = useRef(null)

  const getSecuredMemories = async () => {
    let all = await SecurityManager.getMemories(currentUser)
    console.log(all)
    if (Manager.isValid(all, true)) {
      setState({ ...state, isLoading: true })
      const resolvedImages = async () =>
        await new Promise(async (resolve, reject) => {
          let promises = []
          for (const memory of all) {
            if (Manager.isValid(memory.url)) {
              promises.push(await FirebaseStorage.imageExists(memory.url, memory))
            }
          }
          if (Manager.isValid(promises, true)) {
            Promise.all(promises)
              .then((results) => {
                let toReturn = results.filter((x) => x.successful && x !== undefined).flat() || []
                toReturn = toReturn.map((x) => x.successful)
                resolve(toReturn)
              })
              .catch(() => {
                reject('failed')
              })
          }
        })
      let validImages = await resolvedImages()
      validImages = validImages.filter((x) => x)
      if (currentUser) {
        if (Manager.isValid(validImages, true)) {
          let arr = []
          validImages.forEach((img) => {
            if (img) {
              const imageName = FirebaseStorage.getImageNameFromUrl(img.url)
              const newMemory = new Memory()
              newMemory.id = img.id
              newMemory.notes = img.notes
              newMemory.url = img.url
              newMemory.title = img.title
              newMemory.createdBy = currentUser.phone
              newMemory.memoryName = imageName

              const cleanedObject = Manager.cleanObject(newMemory, ModelNames.memory)
              arr.push(cleanedObject)
            }
          })
          setImgArray(arr)
          setMemories(validImages)
          setTimeout(() => {
            setState({ ...state, isLoading: false })
          }, 600)
          setTimeout(() => {
            addImageAnimation()
          }, 200)
        } else {
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
    if (record.ownerPhone === currentUser.phone) {
      // Delete from Firebase Realtime DB
      await DB.deleteMemory(currentUser.phone, record).then(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser.id, imageName)
      })
    }
    // Memory was shared with current user -> hide it
    else {
      const memoryKey = await DB.getSnapshotKey(`${DB.tables.memories}`, record, 'id')
      const updatedShareWith = record.shareWith.filter((x) => x !== currentUser.phone)
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
        saveImageFromUrl(null, src)
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
        <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'.memory-image'}>
          <>
            {Manager.isValid(memories, true) &&
              memories.map((imgObj, index) => {
                return (
                  <div className="memory">
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
        {imgArray.length > 0 && (
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
