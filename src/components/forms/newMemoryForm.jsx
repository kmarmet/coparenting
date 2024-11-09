import UploadInputs from '@components/shared/uploadInputs'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import AppManager from '@managers/appManager'
import MyConfetti from '@shared/myConfetti'
import globalState from 'context'
import Manager from 'managers/manager'
import NotificationManager from 'managers/notificationManager'
import React, { useContext, useEffect, useRef, useState } from 'react'
import DateFormats from '../../constants/dateFormats'
import moment from 'moment'
import Memory from '../../models/memory'
import { ImEye } from 'react-icons/im'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'

import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ActivitySet from '../../models/activitySet'
import DB_UserScoped from '@userScoped'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'

function NewMemoryForm({ hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, navbarButton, updateKey, theme } = state
  const [shareWith, setShareWith] = useState([])
  const [memoryNotes, setMemoryNotes] = useState('')
  const [images, setImages] = useState([])
  const [memoryTitle, setMemoryTitle] = useState('')
  const inputFile = useRef(null)
  const [resetKey, setResetKey] = useState(Manager.getUid())

  const resetForm = () => {
    Manager.resetForm('new-memory-wrapper')
    setShareWith([])
    setMemoryNotes('')
    setImages([])
    setMemoryTitle('')
    setState({ ...state, isLoading: false })
    hideCard()
    setResetKey(Manager.getUid())
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const submit = async () => {
    if (images !== undefined && images.length === 0) {
      throwError('Please choose an image')
      return false
    }
    if (!Manager.isValid(shareWith, true)) {
      throwError('Please select who can see this memory')
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      throwError('Files uploaded MUST be images (.png, .jpg, .jpeg, etc.).')
      return false
    }

    setState({ ...state, isLoading: true })

    // Check for existing memory
    const securedMemories = await SecurityManager.getMemories(currentUser)
    let existingMemoriesFound = false
    Manager.convertToArray(images).forEach((img, index) => {
      const existingMemory = securedMemories.filter((x) => x.memoryName === img.name)[0]
      if (existingMemory) {
        existingMemoriesFound = true
      }
    })

    if (existingMemoriesFound) {
      throwError('This memory already exists')
      return false
    }

    MyConfetti.fire()
    hideCard()

    // Upload Image
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.memories}/`, currentUser.id, images)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add memories to 'memories' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.memories, currentUser.id, images).then(async (urls) => {
          // Add to user memories object
          for (const url of urls) {
            const imageName = FirebaseStorage.getImageNameFromUrl(url)

            const newMemory = new Memory()
            newMemory.notes = memoryNotes
            newMemory.id = Manager.getUid()
            newMemory.url = url
            newMemory.memoryName = imageName
            newMemory.title = memoryTitle
            newMemory.shareWith = shareWith
            newMemory.creationDate = moment().format(DateFormats.dateForDb)
            newMemory.ownerPhone = currentUser.phone

            const cleanedObject = Manager.cleanObject(newMemory, ModelNames.memory)

            await DB.add(`${DB.tables.memories}`, cleanedObject)
          }

          // Send Notification
          NotificationManager.sendToShareWith(shareWith, 'Memories Await!', `${formatNameFirstNameOnly(currentUser.name)} has uploaded a new memory!`)
        })
        AppManager.setAppBadge(1)
        resetForm()
      })
  }

  const setActivitySets = async (userPhone) => {
    const existingActivitySet = await DB.getTable(`${DB.tables.activitySets}/${userPhone}`, true)
    let newActivitySet = new ActivitySet()
    let unreadMessageCount = existingActivitySet?.unreadMessageCount || 0
    if (Manager.isValid(existingActivitySet, false, true)) {
      newActivitySet = { ...existingActivitySet }
    }
    newActivitySet.unreadMessageCount = unreadMessageCount === 0 ? 1 : (unreadMessageCount += 1)
    await DB_UserScoped.addActivitySet(`${DB.tables.activitySets}/${userPhone}`, newActivitySet)
  }

  useEffect(() => {
    Manager.showPageContainer()
    setResetKey(Manager.getUid())
  }, [])

  return (
    <div className="new-memory-wrapper">
      <div id="new-memory-form-container" className={`${theme} form`}>
        <div className="form">
          {currentUser && (
            <ShareWithCheckboxes
              icon={<ImEye />}
              shareWith={currentUser.coparents.map((x) => x.phone)}
              onCheck={handleShareWithSelection}
              labelText={'Who is allowed to see it?'}
              containerClass={'share-with-coparents'}
              dataPhone={currentUser?.coparents.map((x) => x.phone)}
              checkboxLabels={currentUser?.coparents.map((x) => x.name)}
            />
          )}
          <InputWrapper
            refreshKey={resetKey}
            inputType={'input'}
            defaultValue="Title"
            labelText={'Title'}
            onChange={(e) => setMemoryTitle(e.target.value)}></InputWrapper>
          <InputWrapper
            refreshKey={resetKey}
            onChange={(e) => setMemoryNotes(e.target.value)}
            inputType={'textarea'}
            defaultValue="Image Description/Notes"
            labelText={'Image Description/Notes'}></InputWrapper>
          <UploadInputs
            onClose={hideCard}
            containerClass={`${theme} new-memory-card`}
            uploadType={'image'}
            actualUploadButtonText={'Upload'}
            getImages={(files) => {
              setImages(files)
            }}
            uploadButtonText={`Choose`}
            upload={submit}
          />
          <div className="buttons">
            <button className="cancel card-button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewMemoryForm
