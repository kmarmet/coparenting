// Path: src\components\screens\memories?.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {IoHeart} from 'react-icons/io5'
import {LuMinus, LuPlus} from 'react-icons/lu'
import globalState from '../../context'
import DB from '../../database/DB'
import FirebaseStorage from '../../database/firebaseStorage'
import useCurrentUser from '../../hooks/useCurrentUser'
import useMemories from '../../hooks/useMemories'
import DomManager from '../../managers/domManager'
import ImageManager from '../../managers/imageManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import NavBar from '../navBar'
import Label from '../shared/label'
import NoDataFallbackText from '../shared/noDataFallbackText'
import Slideshow from '../shared/slideshow'
import Spacer from '../shared/spacer'

export default function Memories() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {memories, memoriesAreLoading} = useMemories()
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showSlideshow, setShowSlideshow] = useState(false)
  const [activeImgIndex, setActiveImgIndex] = useState(0)

  const DeleteMemory = async (firebaseImagePath, record) => {
    const imageName = FirebaseStorage.GetImageNameFromUrl(firebaseImagePath)

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
      const memoryKey = DB.GetTableIndexById(memories, record?.id)
      if (Manager.IsValid(memoryKey)) {
        const updatedShareWith = record.shareWith.filter((x) => x !== currentUser?.key)
        await DB.updateByPath(`${DB.tables.memories}/${record?.ownerKey}/${memoryKey}/shareWith`, updatedShareWith)
      }
    }
    setState({...state, successAlertMessage: 'Memory Deleted', refreshKey: Manager.GetUid()})
  }

  const SaveMemoryImage = (imgSrc) => {
    if (Manager.IsValid(imgSrc)) {
      ImageManager.saveImageFromUrl(null, imgSrc)
    }
  }

  const ExecuteAnimations = () => {
    setTimeout(() => {
      DomManager.ToggleAnimation('add', 'memory', DomManager.AnimateClasses.names.fadeInRight, 85)
    }, 300)
  }

  useEffect(() => {
    if (!currentUserIsLoading && !memoriesAreLoading) {
      ExecuteAnimations()
    }
  }, [currentUserIsLoading, memoriesAreLoading, memories])

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="memories-container" className={`${theme} page-container`}>
        <p className="screen-title">Memories</p>
        <Spacer height={2} />
        <p id="happy-subtitle" className={`${theme}`}>
          Share photos of unforgettable memories that deserve to be seen! <IoHeart className={'heart'} />
        </p>
        <Spacer height={10} />
        <Accordion className={`${theme} memories-accordion accordion`} expanded={showDisclaimer}>
          <AccordionSummary>
            <button className="button default grey" onClick={() => setShowDisclaimer(!showDisclaimer)}>
              <Label text={'Memory Expiration'} /> {showDisclaimer ? <LuMinus /> : <LuPlus />}
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

        <Spacer height={10} />

        {/* NO DATA FALLBACK TEXT */}
        {memories && memories?.length === 0 && <NoDataFallbackText text={'At the moment, there are no memories to view'} />}

        {/* SLIDESHOW */}
        <Slideshow show={showSlideshow} hide={() => setShowSlideshow(false)} images={memories} activeIndex={activeImgIndex} />

        {/*/!* GALLERY *!/*/}
        {Manager.IsValid(memories) &&
          memories?.map((imgObj, index) => {
            return (
              <div className={`memory ${DomManager.Animate.FadeInRight(imgObj, '.memory')}`} key={index}>
                {/* IMAGE */}
                <div
                  id="memory-image-wrapper"
                  onClick={() => {
                    setActiveImgIndex(index)
                    setShowSlideshow(true)
                  }}>
                  {Manager.IsValid(imgObj?.title, true) && <p className="memory-title">{StringManager.FormatTitle(imgObj?.title, true)}</p>}
                  <div
                    style={{backgroundImage: `url(${imgObj?.url})`}}
                    className="memory-image"
                    onClick={() => setShowSlideshow(true)}
                    data-src={imgObj?.url}></div>
                </div>
                <Spacer height={3} />
                {/* BELOW IMAGE */}
                <div id="below-image">
                  {/* DELETE BUTTON */}
                  <p onClick={() => DeleteMemory(imgObj?.url, imgObj)} id="delete-button">
                    DELETE
                  </p>
                  {/* DOWNLOAD BUTTON */}
                  <p onClick={(e) => SaveMemoryImage(imgObj?.url)} id="download-text">
                    DOWNLOAD
                  </p>
                </div>
              </div>
            )
          })}
      </div>
      <NavBar navbarClass={'memories'} />
    </>
  )
}