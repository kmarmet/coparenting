import React, { useContext, useEffect, useRef, useState } from 'react'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import ImageManager from '@managers/imageManager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Manager from '@manager'
import AddNewButton from '@shared/addNewButton'
import ScreenNames from 'constants/screenNames'
import globalState from '../../context'
import { Accordion, DatePicker } from 'rsuite'
import ImageTheater from '../shared/imageTheater'
import Memory from '../../models/memory'
import manager from '@manager'
import SecurityManager from '../../managers/securityManager'
import NewMemoryForm from '../forms/newMemoryForm'

export default function Memories() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [memories, setMemories] = useState([])
  const [showImageTheater, setShowImageTheater] = useState(false)
  const [imgArray, setImgArray] = useState([])
  const [defaultTheaterIndex, setDefaultTheaterIndex] = useState(0)
  const inputFile = useRef(null)
  const [showFyiAccordion, setShowFyiAccordion] = useState(false)
  const dbRef = ref(getDatabase())

  const expandImage = (e) => {
    const allImages = Array.from(document.querySelectorAll('.img-container .img-content-container'))
    let defaultImageIndex = 0
    const imageId = e.target.getAttribute('data-id')
    allImages.forEach((img, index) => {
      const _imgId = img.getAttribute('data-id')
      if (_imgId === imageId) {
        defaultImageIndex = index
      }
    })
    setDefaultTheaterIndex(defaultImageIndex)
    setShowImageTheater(true)
  }

  const getSecuredMemories = async () => {
    setState({ ...state, isLoading: true, formToShow: '' })
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
              newMemory.notes = img.notes || ''
              newMemory.url = img.url
              newMemory.title = img.title || ''
              newMemory.createdBy = currentUser.phone
              newMemory.memoryName = imageName
              arr.push(newMemory)
            }
          })
          setImgArray(arr)
          setMemories(validImages)
          setState({ ...state, isLoading: false })
          setTimeout(() => {
            addImageAnimation()
          }, 200)
        } else {
          setMemories([])
          setState({ ...state, isLoading: false })
        }
      }
    } else {
      setMemories([])
      setState({ ...state, isLoading: false })
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

  useEffect(() => {
    onValue(child(dbRef, DB.tables.memories), async (snapshot) => {
      setState({ ...state, formToShow: '' })
      await getSecuredMemories(currentUser)
    })
    Manager.toggleForModalOrNewForm()
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
      <NewMemoryForm />

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
        <div className={`gallery active`}>
          {Manager.isValid(memories, true) &&
            memories.map((imgObj, index) => {
              return (
                <div className="img-container mb-30" id="img-container" key={index}>
                  <div
                    data-id={imgObj.id}
                    className="mb-10 img-content-container"
                    onClick={(e) => expandImage(e)}
                    style={{ backgroundImage: `url(${imgObj.url})` }}></div>
                  {Manager.isValid(imgObj?.shareWith, true) && !imgObj?.shareWith.includes(currentUser.phone) && (
                    <button onClick={() => deleteMemory(imgObj.url, imgObj)} className="button red default w-30 center">
                      DELETE
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}
