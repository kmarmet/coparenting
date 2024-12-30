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
import Memory from '../../models/memory.js'
import {
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
import { MobileDatePicker } from '@mui/x-date-pickers-pro'

import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import BottomCard from '../shared/bottomCard'
import ObjectManager from '../../managers/objectManager'
import ImageManager from '../../managers/imageManager'
import AlertManager from '../../managers/alertManager'
import DB_UserScoped from '@userScoped'
import ActivityCategory from '../../models/activityCategory'

export default function NewMemoryForm({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, navbarButton, updateKey, theme } = state
  const [images, setImages] = useState([])
  const [resetKey, setResetKey] = useState(Manager.getUid())
  const [newMemory, setNewMemory] = useState(new Memory())
  const inputFile = useRef(null)

  const resetForm = async () => {
    Manager.resetForm('new-memory-wrapper')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser, isLoading: false })
    setResetKey(Manager.getUid())
    hideCard()
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, newMemory.shareWith)
    setNewMemory((prevMemory) => ({ ...prevMemory, shareWith: updated }))
  }

  const submit = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n share memories with',
        'You have not added any co-parents. Or, it is also possible they have closed their account.'
      )
      return false
    }

    if (validAccounts > 0) {
      if (newMemory.shareWith.length === 0) {
        AlertManager.throwError('Please choose who you would like to share this memory with')
        return false
      }
    }

    if (images !== undefined && images.length === 0) {
      AlertManager.throwError('Please choose an image')
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      AlertManager.throwError('Files uploaded MUST be images (.png, .jpg, .jpeg, etc.).')
      return false
    }

    let localImages = []
    for (let img of images) {
      localImages.push(await ImageManager.compressImage(img))
    }
    setState({ ...state, isLoading: true })

    // Check for existing memory
    const securedMemories = await SecurityManager.getMemories(currentUser)
    let existingMemoriesFound = false
    Manager.convertToArray(localImages).forEach((img, index) => {
      const existingMemory = securedMemories.filter((x) => x.memoryName === img.name)[0]
      if (existingMemory) {
        existingMemoriesFound = true
      }
    })

    if (existingMemoriesFound) {
      AlertManager.throwError('This memory already exists')
      return false
    }

    // Upload Image
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.memories}/`, currentUser?.id, localImages)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add memories to 'memories' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.memories, currentUser?.id, localImages).then(async (urls) => {
          // Add to user memories object
          for (const url of urls) {
            const imageName = FirebaseStorage.getImageNameFromUrl(url)
            const cleanedObject = ObjectManager.cleanObject(newMemory, ModelNames.memory)

            cleanedObject.url = url
            cleanedObject.memoryName = imageName
            cleanedObject.ownerPhone = currentUser?.phone

            // Add to Database
            await DB.add(`${DB.tables.memories}`, cleanedObject)
          }

          // Send Notification
          await NotificationManager.sendToShareWith(
            newMemory.shareWith,
            currentUser,
            `New Memory`,
            `${formatNameFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
            ActivityCategory.memories
          )
        })
        AppManager.setAppBadge(1)
        await resetForm()
        MyConfetti.fire()
      })
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  useEffect(() => {
    Manager.showPageContainer()
    setResetKey(Manager.getUid())
  }, [])

  return (
    <BottomCard
      onSubmit={submit}
      wrapperClass="new-memory"
      refreshKey={resetKey}
      submitText={'Add Memory'}
      title={'New Memory'}
      onClose={resetForm}
      showCard={showCard}>
      <div className="new-memory-wrapper">
        <div id="new-memory-form-container" className={`${theme} form`}>
          <div className="form">
            {/* SHARE WITH */}
            {currentUser && (
              <ShareWithCheckboxes
                onCheck={handleShareWithSelection}
                containerClass={'share-with-coparents'}
                dataPhone={currentUser?.coparents?.map((x) => x.phone)}
                checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
              />
            )}

            {/* TITLE */}
            <InputWrapper
              refreshKey={resetKey}
              inputType={'input'}
              labelText={'Title'}
              onChange={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, title: e.target.value }))}></InputWrapper>

            {/* DATE */}
            <InputWrapper labelText={'Memory Capture Date'} inputType={'date'}>
              <MobileDatePicker
                onOpen={addThemeToDatePickers}
                value={moment()}
                className={`${theme} m-0 w-100 mui-input`}
                onAccept={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, memoryCaptureDate: moment(e).format(DateFormats.dateForDb) }))}
              />
            </InputWrapper>

            {/* NOTES */}
            <InputWrapper
              refreshKey={resetKey}
              onChange={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, notes: e.target.value }))}
              inputType={'textarea'}
              defaultValue="Image Description/Notes"
              labelText={'Image Description/Notes'}></InputWrapper>

            {/* UPLOAD BUTTON */}
            <UploadInputs
              onClose={hideCard}
              containerClass={`${theme} new-memory-card`}
              uploadType={'image'}
              actualUploadButtonText={'Upload'}
              getImages={(files) => {
                setImages(files)
              }}
              uploadButtonText={`Choose`}
              upload={() => {}}
            />
          </div>
        </div>
      </div>
    </BottomCard>
  )
}