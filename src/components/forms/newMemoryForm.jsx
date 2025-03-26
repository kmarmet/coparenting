// Path: src\components\forms\newMemoryForm.jsx
import React, { useContext, useEffect, useState } from 'react'
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
import Modal from '../shared/modal'
import ObjectManager from '/src/managers/objectManager'
import ImageManager from '/src/managers/imageManager'
import AlertManager from '/src/managers/alertManager'
import ActivityCategory from '/src/models/activityCategory'
import StringManager from '/src/managers/stringManager'
import DB_UserScoped from '../../database/db_userScoped'
import DomManager from '../../managers/domManager'
import { LuImagePlus } from 'react-icons/lu'
import creationForms from '../../constants/creationForms'

export default function NewMemoryForm() {
  const { state, setState } = useContext(globalState)
  const { currentUser, authUser, refreshKey, theme, creationFormToShow } = state
  const [images, setImages] = useState([])
  const [newMemory, setNewMemory] = useState(new Memory())

  const resetForm = async () => {
    Manager.resetForm('new-memory-wrapper')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser, isLoading: false, refreshKey: Manager.getUid(), creationFormToShow: '' })
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, newMemory.shareWith)
    setNewMemory((prevMemory) => ({ ...prevMemory, shareWith: updated }))
  }

  const submit = async () => {
    setState({ ...state, isLoading: true })
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
        setState({ ...state, showAlert: true })
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

    // Check for existing memory
    const securedMemories = await SecurityManager.getMemories(currentUser)
    let existingMemoriesFound = false
    Manager.convertToArray(localImages).forEach((img) => {
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

    // Upload Image
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.memories}/`, currentUser?.key, localImages)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add memories to 'memories' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.memories, currentUser?.key, localImages)
          .then(async (urls) => {
            // Add to user memories object
            for (const url of urls) {
              const imageName = FirebaseStorage.getImageNameFromUrl(url)
              const cleanedObject = ObjectManager.cleanObject(newMemory, ModelNames.memory)

              cleanedObject.url = url
              cleanedObject.memoryName = Manager.generateHash(imageName)
              cleanedObject.ownerKey = currentUser?.key

              // Add to Database
              await DB.add(`${DB.tables.memories}/${currentUser?.key}`, cleanedObject)
            }

            // Send Notification
            await NotificationManager.sendToShareWith(
              newMemory.shareWith,
              currentUser,
              `New Memory`,
              `${StringManager.getFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
              ActivityCategory.memories
            )
          })
          .catch((error) => {
            console.error(error)
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

  return (
    <Modal
      onSubmit={submit}
      wrapperClass="new-memory"
      refreshKey={refreshKey}
      submitText={'Add Memory'}
      submitIcon={<LuImagePlus />}
      title={'Share Memory'}
      onClose={resetForm}
      showCard={creationFormToShow === creationForms.memories}>
      <div className="new-memory-wrapper">
        <div id="new-memory-form-container" className={`${theme} form`}>
          <div className="form">
            {/* SHARE WITH */}
            {currentUser && <ShareWithCheckboxes onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />}

            {/* TITLE */}
            <InputWrapper
              refreshKey={refreshKey}
              inputType={'input'}
              labelText={'Title'}
              onChange={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, title: e.target.value }))}></InputWrapper>

            {/* DATE */}
            {!DomManager.isMobile() && (
              <InputWrapper labelText={'Memory Capture Date'} inputType={'date'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  value={moment()}
                  className={`${theme} m-0 w-100 mui-input`}
                  onAccept={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, memoryCaptureDate: moment(e).format(DateFormats.dateForDb) }))}
                />
              </InputWrapper>
            )}
            {DomManager.isMobile() && (
              <InputWrapper
                inputType={'date'}
                labelText={'Memory Capture Date'}
                useNativeDate={true}
                onChange={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, memoryCaptureDate: moment(e).format(DateFormats.dateForDb) }))}
              />
            )}

            {/* NOTES */}
            <InputWrapper
              refreshKey={refreshKey}
              onChange={(e) => setNewMemory((prevMemory) => ({ ...prevMemory, notes: e.target.value }))}
              inputType={'textarea'}
              labelText={'Image Description/Notes'}></InputWrapper>
            {/* UPLOAD BUTTON */}
            <UploadInputs
              onClose={() => setState({ ...state, creationFormToShow: '', showBottomMenu: false })}
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
    </Modal>
  )
}