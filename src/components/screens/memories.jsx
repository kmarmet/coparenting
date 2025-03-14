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
import { LuImagePlus, LuMinus } from 'react-icons/lu'
import ImageManager from '../../managers/imageManager'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DateFormats from '../../constants/dateFormats'
import DateManager from '../../managers/dateManager'
import DomManager from '../../managers/domManager'
import StringManager from '../../managers/stringManager'
import { IoAddOutline, IoHeart } from 'react-icons/io5'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Spacer from '../shared/spacer'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [memories, setMemories] = useState([])
  const [showNewMemoryCard, setShowNewMemoryCard] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const dbRef = ref(getDatabase())

  const getSecuredMemories = async () => {
    let all = await SecurityManager.getMemories(currentUser)
    if (Manager.isValid(all)) {
      let validImages = []
      for (const memory of all) {
        if (Manager.isValid(memory.url)) {
          const imageStatusCode = await ImageManager.getStatusCode(memory?.url)
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
      if (currentUser) {
        if (Manager.isValid(validImages)) {
          setMemories(validImages)
        } else {
          setMemories([])
        }
      }
    } else {
      setMemories([])
    }
  }

  const deleteMemory = async (path, record, deleteButton) => {
    document.querySelectorAll('.memory-image').forEach((memoryImage) => memoryImage.classList.remove('active'))
    const imageName = FirebaseStorage.getImageNameFromUrl(path)
    const imageToRemove = deleteButton.closest('.memory').querySelector('#memory-image-wrapper')
    const deleteButtonParent = deleteButton.parentNode

    if (Manager.isValid(imageToRemove) && Manager.isValid(deleteButtonParent)) {
      deleteButtonParent.remove()
      imageToRemove.remove()
    }

    // Current user is record owner
    if (record.ownerKey === currentUser?.key) {
      // Delete from Firebase Realtime DB
      await DB.deleteMemory(currentUser?.key, record).then(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser?.key, imageName)
      })
    }
    // Memory was shared with current user -> hide it
    else {
      const memoryKey = await DB.getSnapshotKey(`${DB.tables.memories}/${currentUser?.key}`, record, 'id')
      const updatedShareWith = record.shareWith.filter((x) => x !== currentUser?.key)
      await DB.updateByPath(`${DB.tables.memories}/${memoryKey}/shareWith`, updatedShareWith)
    }
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
        <Fade direction={'up'} duration={1000} className={'memories-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Memories</p>
            {!DomManager.isMobile() && <LuImagePlus onClick={() => setShowNewMemoryCard(true)} id={'add-new-button'} />}
          </div>
          <p id="happy-subtitle" className={`${theme}`}>
            Share photos of unforgettable memories that deserve to be seen! <IoHeart className={'heart'} />
          </p>
          <Spacer height={10} />
          <Accordion expanded={showDisclaimer}>
            <AccordionSummary>
              <p id="disclaimer-header-button" onClick={() => setShowDisclaimer(!showDisclaimer)}>
                Info {showDisclaimer ? <LuMinus /> : <IoAddOutline />}
              </p>
            </AccordionSummary>
            <AccordionDetails>
              <p>
                All images will be automatically and <b>permanently</b> removed 30 days after their creation date. You are welcome to download them at
                any time.
              </p>
            </AccordionDetails>
          </Accordion>

          {/* NO DATA FALLBACK TEXT */}
          {memories && memories.length === 0 && <NoDataFallbackText text={'At the moment, there are no memories available'} />}

          {/* GALLERY */}
          <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'.memory-image'}>
            <Fade direction={'up'} duration={1000} className={'memories-fade-wrapper'} triggerOnce={true}>
              {Manager.isValid(memories) &&
                memories.map((imgObj, index) => {
                  return (
                    <div key={index} className="memory">
                      {/* IMAGE */}
                      <div id="memory-image-wrapper">
                        <div
                          data-sub-html={`<p class="gallery-title">${StringManager.formatTitle(StringManager.formatTitle(imgObj?.title, true))}<span>${imgObj?.notes}</span></p>`}
                          style={{ backgroundImage: `url(${imgObj?.url})` }}
                          className="memory-image"
                          data-src={imgObj?.url}></div>
                      </div>

                      {/* DATE */}
                      {DateManager.dateIsValid(imgObj?.memoryCaptureDate) && (
                        <p className="memory-date">Capture Date: {moment(imgObj?.memoryCaptureDate).format(DateFormats.readableMonthDayYear)}</p>
                      )}

                      {/* BELOW IMAGE */}
                      <div id="below-image">
                        {/* SAVE BUTTON */}
                        <p onClick={(e) => deleteMemory(imgObj?.url, imgObj, e.currentTarget)} id="delete-button">
                          DELETE
                        </p>
                        {/* DOWNLOAD BUTTON */}
                        <p onClick={(e) => saveMemoryImage(e)} id="download-text">
                          DOWNLOAD
                        </p>
                      </div>
                    </div>
                  )
                })}
            </Fade>
          </LightGallery>
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