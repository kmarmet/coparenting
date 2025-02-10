import React, { useContext, useEffect, useRef, useState } from 'react'
import globalState from '../../context'
import Spacer from '/src/components/shared/spacer.jsx'
import UploadInputs from '/src/components/shared/uploadInputs'
import DB from '/src/database/DB'
import FirebaseStorage from '/src/database/firebaseStorage'
import AppManager from '/src/managers/appManager'
import MyConfetti from '/src/components/shared/myConfetti'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import DateFormats from '/src/constants/dateFormats'
import moment from 'moment'
import Memory from '/src/models/memory.js'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import SecurityManager from '/src/managers/securityManager'
import ModelNames from '/src/models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import BottomCard from '../shared/bottomCard'
import ObjectManager from '/src/managers/objectManager'
import ImageManager from '/src/managers/imageManager'
import AlertManager from '/src/managers/alertManager'
import DB_UserScoped from '/src/database/db_userScoped'
import ActivityCategory from '/src/models/activityCategory'
import StringManager from '/src/managers/stringManager'

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

    MyConfetti.fire()
    hideCard()

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
            await DB.add(`${DB.tables.memories}/${currentUser.phone}`, cleanedObject)
          }

          // Send Notification
          await NotificationManager.sendToShareWith(
            newMemory.shareWith,
            currentUser,
            `New Memory`,
            `${StringManager.formatNameFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
            ActivityCategory.memories
          )
        })
        AppManager.setAppBadge(1)
        await resetForm()
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
          <Spacer height={5} />
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
              labelText={'Image Description/Notes'}></InputWrapper>
            <Spacer height={40} />
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