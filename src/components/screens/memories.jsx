// Path: src\components\screens\memories.jsx
import React, {useContext, useEffect, useState} from 'react'
import DB from '../../database/DB'
import FirebaseStorage from '../../database/firebaseStorage'
import {child, getDatabase, onValue, ref} from 'firebase/database'
import Manager from '../../managers/manager'
import globalState from '../../context'
import SecurityManager from '../../managers/securityManager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import moment from 'moment'
import {Fade} from 'react-awesome-reveal'
import {LuImagePlus, LuMinus, LuPlus} from 'react-icons/lu'
import ImageManager from '../../managers/imageManager'
import NoDataFallbackText from '../shared/noDataFallbackText'
import NavBar from '../navBar'
import DatetimeFormats from '../../constants/datetimeFormats'
import DateManager from '../../managers/dateManager'
import DomManager from '../../managers/domManager'
import StringManager from '../../managers/stringManager'
import {IoHeart} from 'react-icons/io5'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Spacer from '../shared/spacer'
import Label from '../shared/label'

export default function Memories() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
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
          validImages.push(memory)
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

  const deleteMemory = async (firebaseImagePath, record) => {
    const imageName = FirebaseStorage.getImageNameFromUrl(firebaseImagePath)

    // Current user is record owner
    if (record?.ownerKey === currentUser?.key) {
      // Delete from Firebase Realtime DB
      await DB.deleteMemory(currentUser?.key, record).then(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser?.key, imageName)
      })
    }
    // Memory was shared with current user -> hide it
    else {
      const memoryKey = await DB.getSnapshotKey(`${DB.tables.memories}/${record?.ownerKey}`, record, 'id')
      if (Manager.isValid(memoryKey)) {
        const updatedShareWith = record.shareWith.filter((x) => x !== currentUser?.key)
        await DB.updateByPath(`${DB.tables.memories}/${record?.ownerKey}/${memoryKey}/shareWith`, updatedShareWith)
      }
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
      {/* PAGE CONTAINER */}
      <div id="memories-container" className={`${theme} page-container`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Memories</p>
          {!DomManager.isMobile() && <LuImagePlus onClick={() => setShowNewMemoryCard(true)} id={'add-new-button'} />}
        </div>
        <p id="happy-subtitle" className={`${theme}`}>
          Share photos of unforgettable memories that deserve to be seen! <IoHeart className={'heart'} />
        </p>
        <Spacer height={10} />
        <Accordion className={'memories-accordion'} expanded={showDisclaimer}>
          <AccordionSummary>
            <button className="button default grey" onClick={() => setShowDisclaimer(!showDisclaimer)}>
              <div id="circle" className="circle"></div>
              <Label text={'Memory Retention'} /> {showDisclaimer ? <LuMinus /> : <LuPlus />}
            </button>
          </AccordionSummary>
          <Spacer height={5} />
          <AccordionDetails>
            <p>
              All images will be automatically and <b>permanently</b> removed 30 days after the date they were uploaded. You are welcome to download
              them at any time.
            </p>
          </AccordionDetails>
        </Accordion>

        {/* NO DATA FALLBACK TEXT */}
        {memories && memories.length === 0 && <NoDataFallbackText text={'At the moment, there are no memories available'} />}

        {/* GALLERY */}
        {Manager.isValid(memories) && (
          <LightGallery elementClassNames={`light-gallery ${theme}`} selector={'.memory-image'}>
            <Fade direction={'left'} duration={800} className={'memories-fade-wrapper'} triggerOnce={true} cascade={true} damping={0.2}>
              {Manager.isValid(memories) &&
                memories.map((imgObj, index) => {
                  return (
                    <div className="memory" key={index}>
                      {/* IMAGE */}
                      <div id="memory-image-wrapper">
                        {Manager.isValid(imgObj?.title) && <p className="memory-title">{StringManager.formatTitle(imgObj?.title, true)}</p>}
                        <div
                          data-sub-html={`${
                            Manager.isValid(imgObj?.notes, true)
                              ? `<p class="gallery-title">
                                  ${StringManager.formatTitle(StringManager.formatTitle(imgObj?.title, true))}
                                <span>${imgObj?.notes}</span>
                              </p>`
                              : ''
                          }`}
                          style={{backgroundImage: `url(${imgObj?.url})`}}
                          className="memory-image"
                          data-src={imgObj?.url}></div>
                      </div>

                      {/* DATE */}
                      {DateManager.dateIsValid(imgObj?.memoryCaptureDate) && (
                        <p className="memory-date">Capture Date: {moment(imgObj?.memoryCaptureDate).format(DatetimeFormats.readableMonthDayYear)}</p>
                      )}

                      {/* BELOW IMAGE */}
                      <div id="below-image">
                        {/* SAVE BUTTON */}
                        <p onClick={() => deleteMemory(imgObj?.url, imgObj)} id="delete-button">
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
        )}
      </div>
      <NavBar navbarClass={'memories'} />
    </>
  )
}