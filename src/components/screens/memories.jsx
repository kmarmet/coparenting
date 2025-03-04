// Path: src\components\screens\memories.jsx
import React, { useContext, useEffect, useState } from 'react'
import DB from '../../database/DB'
import FirebaseStorage from '../../database/firebaseStorage'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Manager from '../../managers/manager'
import globalState from '../../context'
import SecurityManager from '../../managers/securityManager'
import NewMemoryForm from '../forms/newMemoryForm'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import moment from 'moment'
import { Fade } from 'react-awesome-reveal'
import { LuImagePlus } from 'react-icons/lu'
import ImageManager from '../../managers/imageManager'
import { IoIosCloseCircle } from 'react-icons/io'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'
import DomManager from '../../managers/domManager'
import StringManager from '../../managers/stringManager'
import { IoHeart } from 'react-icons/io5'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [memories, setMemories] = useState([])
  const [showNewMemoryCard, setShowNewMemoryCard] = useState(false)
  const dbRef = ref(getDatabase())

  const getSecuredMemories = async () => {
    let all = await SecurityManager.getMemories(currentUser)
    if (Manager.isValid(all)) {
      // setState({ ...state, isLoading: true })
      let validImages = []
      for (const memory of all) {
        if (Manager.isValid(memory.url)) {
          const imageStatusCode = await ImageManager.getStatusCode(memory?.url)
          console.log(imageStatusCode)
          if (imageStatusCode === 404) {
            // Delete memory if no longer in Firebase Storage
            await DB.deleteMemory(currentUser?.key, memory)
          }
          if (imageStatusCode === 200) {
            validImages.push(memory)
          }
        }
      }
      validImages = validImages.filter((x) => x)
      console.log(validImages)
      if (currentUser) {
        if (Manager.isValid(validImages)) {
          console.log(validImages)
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
    if (record.ownerKey === currentUser?.key) {
      // Delete from Firebase Realtime DB
      await DB.deleteMemory(currentUser?.key, record).then(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser?.id, imageName)
      })
    }
    // Memory was shared with current user -> hide it
    else {
      const memoryKey = await DB.getSnapshotKey(`${DB.tables.memories}/${currentUser?.key}`, record, 'id')
      const updatedShareWith = record.shareWith.filter((x) => x !== currentUser?.key)
      await DB.updateByPath(`${DB.tables.memories}/${memoryKey}/shareWith`, updatedShareWith)
    }
  }

  const addImageAnimation = async () => {
    document.querySelectorAll('.memory-image').forEach((memoryImage, i) => {
      setTimeout(() => {
        setTimeout(() => {
          const parent = memoryImage.parentNode
          const loadingGif = parent.querySelector('.loading-memory-gif')
          if (loadingGif) {
            loadingGif.remove()
          }
          memoryImage.classList.add('active')
        }, 200 * i)
      }, 500)
    })
  }

  const saveMemoryImage = (e) => {
    const memoryImage = e.target.parentNode.previousSibling
    if (Manager.isValid(memoryImage)) {
      const src = memoryImage.querySelector('.memory-image').getAttribute('data-src')
      if (Manager.isValid(src)) {
        ImageManager.saveImageFromUrl(null, src)
      }
    }
  }

  const onTableChange = async () => {
    onValue(child(dbRef, `${DB.tables.memories}/${currentUser?.key}`), async () => {
      await getSecuredMemories(currentUser)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      {/* NEW MEMORY FORM */}
      <NewMemoryForm hideCard={() => setShowNewMemoryCard(false)} showCard={showNewMemoryCard} />

      {/* PAGE CONTAINER */}
      <div id="memories-container" className={`${theme} page-container`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Memories</p>
            {!DomManager.isMobile() && <LuImagePlus onClick={() => setShowNewMemoryCard(true)} id={'add-new-button'} />}
          </div>
          <p id="happy-subtitle" className={`${theme} mb-10`}>
            Share photos of unforgettable memories that deserve to be seen! <IoHeart className={'heart'} />
          </p>
          {/* NO DATA FALLBACK TEXT */}
          {memories && memories.length === 0 && <NoDataFallbackText text={'At the moment, there are no memories available'} />}
          {/* GALLERY */}
          <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'.memory-image'}>
            <>
              {Manager.isValid(memories) &&
                memories.map((imgObj, index) => {
                  return (
                    <div key={index} className="memory">
                      {/* TITLE AND DATE */}
                      {imgObj?.title.length > 0 && (
                        <div id="title-and-date">
                          {/* TITLE */}
                          <p className="title">{StringManager.uppercaseFirstLetterOfAllWords(imgObj.title)}</p>

                          {/* DATE */}
                          {DateManager.dateIsValid(imgObj.memoryCaptureDate) && (
                            <p id="date">{moment(imgObj.memoryCaptureDate).format(DateFormats.readableMonthAndDay)}</p>
                          )}
                        </div>
                      )}

                      {/* IMAGE */}
                      <div id="memory-image-wrapper">
                        {/* eslint-disable-next-line no-undef*/}
                        <img src={require('../../img/loading.gif')} className="loading-memory-gif" alt="" />
                        <div style={{ backgroundImage: `url(${imgObj?.url})` }} className="memory-image" data-src={imgObj?.url}>
                          {/* DELETE ICON */}
                          <IoIosCloseCircle className={'delete-icon'} onClick={() => deleteMemory(imgObj.url, imgObj)} />
                        </div>
                      </div>

                      {/* NOTES */}
                      <div id="below-image" className="flex">
                        <p className="text">{StringManager.capitalizeFirstWord(imgObj?.notes)}</p>

                        {/* SAVE ICON */}
                        <p onClick={(e) => saveMemoryImage(e)} id="download-text">
                          DOWNLOAD
                        </p>
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
        </Fade>
      </div>
      {!showNewMemoryCard && (
        <NavBar navbarClass={'child-info'}>
          <LuImagePlus onClick={() => setShowNewMemoryCard(true)} id={'add-new-button'} />
        </NavBar>
      )}
    </>
  )
}