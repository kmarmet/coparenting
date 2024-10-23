import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Manager from '@manager'
import globalState from '../../context'
import { Accordion } from 'rsuite'
import ImageTheater from '../shared/imageTheater'
import Memory from '../../models/memory'
import SecurityManager from '../../managers/securityManager'
import NewMemoryForm from '../forms/newMemoryForm'
import moment from 'moment'
import ModelNames from '../../models/modelNames'
import LightGallery from 'lightgallery/react'
import imagesLoaded from 'imagesloaded'
import Masonry from 'masonry-layout'
import 'lightgallery/css/lightgallery.css'
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
  contains,
  displayAlert,
  capitalizeFirstWord,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import { saveImage } from '../../managers/imageManager'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [memories, setMemories] = useState([])
  const [showImageTheater, setShowImageTheater] = useState(false)
  const [imgArray, setImgArray] = useState([])
  const [defaultTheaterIndex, setDefaultTheaterIndex] = useState(0)
  const [showFyiAccordion, setShowFyiAccordion] = useState(false)
  const [showNewMemoryCard, setShowNewMemoryCard] = useState(false)
  const dbRef = ref(getDatabase())
  const inputFile = useRef(null)

  const getSecuredMemories = async () => {
    setState({ ...state, isLoading: true })
    let all = await SecurityManager.getMemories(currentUser)
    if (Manager.isValid(all, true)) {
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
            addImageAnimation()
          }, 200)
        } else {
          setMemories([])
        }
      }
      setState({ ...state, isLoading: true })
    } else {
      setMemories([])
      setState({ ...state, isLoading: true })
    }
  }

  const deleteMemory = async (path, toDelete) => {
    const imageName = FirebaseStorage.getImageNameFromUrl(path)

    // Delete from Firebase Realtime DB
    await DB.deleteMemory(DB.tables.memories, toDelete).then(async () => {
      // Delete from Firebase Storage
      await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser.id, imageName)
    })
  }

  const addImageAnimation = async () => {
    document.querySelectorAll('.img-container').forEach((memoryImage, i) => {
      setTimeout(() => {
        memoryImage.classList.add('active')
      }, 200 * i)
    })
  }

  const saveMemoryImage = (e) => {
    const thisIconParent = e.target.parentNode
    if (Manager.isValid(thisIconParent)) {
      const memoryImage = thisIconParent.closest('.below-image').previousSibling
      if (Manager.isValid(memoryImage)) {
        const src = memoryImage.getAttribute('data-src')
        if (Manager.isValid(src)) {
          saveImage(null, src)
        }
      }
    }
  }

  useEffect(() => {
    onValue(child(dbRef, DB.tables.memories), async (snapshot) => {
      await getSecuredMemories(currentUser)
      // Navbar Button
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowNewMemoryCard(true)
          },
        },
      })
    })
    Manager.showPageContainer()
  }, [])

  return (
    <>
      {/* IMAGE THEATER */}
      <ImageTheater
        imgArray={imgArray}
        defaultImageIndex={defaultTheaterIndex}
        className={showImageTheater ? 'active' : ''}
        onClose={() => setShowImageTheater(false)}></ImageTheater>

      {/* NEW MEMORY FORM */}
      <NewMemoryForm showCard={showNewMemoryCard} hideCard={(e) => setShowNewMemoryCard(false)} />

      {/* PAGE CONTAINER */}
      <div id="memories-container" className={`${theme} page-container`}>
        <p id="happy-subtitle" className={`${theme} mb-10 text-screen-intro`}>
          Upload photos of memories that are too good NOT to share <span className="material-icons heart">favorite</span>
        </p>

        {memories && memories.length === 0 && <p className="caption center">There are currently no memories</p>}
        {memories && memories.length > 0 && (
          <div className="flex" id="fyi-wrapper">
            <Accordion>
              <span className="material-icons-round yellow" onClick={() => setShowFyiAccordion(!showFyiAccordion)}>
                help
              </span>
              <Accordion.Panel expanded={showFyiAccordion}>
                <p className="blue">All images will be automatically (and permanently) deleted after 30 days from their creation date.</p>
                <p className="blue ml-auto">Feel free to save them to your device at any time.</p>
                <p className="gallery center-text pb-10 w-100">tap image to expand</p>
              </Accordion.Panel>
            </Accordion>
          </div>
        )}
        {/* GALLERY */}
        <LightGallery elementClassNames={'light-gallery'} speed={500} selector={'.memory-image'}>
          <>
            {Manager.isValid(memories, true) &&
              memories.map((imgObj, index) => {
                return (
                  <>
                    <div style={{ backgroundImage: `url(${imgObj.url})` }} key={index} className="memory-image" data-src={imgObj.url}></div>
                    <div className="below-image">
                      {Manager.isValid(imgObj?.shareWith, true) && !imgObj?.shareWith.includes(currentUser.phone) && (
                        <>
                          <div className="top flex">
                            <p className="title">{uppercaseFirstLetterOfAllWords(imgObj.title)}</p>
                            <div className="buttons flex">
                              <span
                                className="material-icons-round download-icon"
                                onClick={(e) => {
                                  saveMemoryImage(e)
                                }}>
                                download
                              </span>
                              <span onClick={() => deleteMemory(imgObj.url, imgObj)} className="material-icons-round delete-icon">
                                remove
                              </span>
                            </div>
                          </div>
                          <div className="text">{capitalizeFirstWord(imgObj.notes)}</div>
                        </>
                      )}
                    </div>
                  </>
                )
              })}
          </>
        </LightGallery>
      </div>
    </>
  )
}
