// Path: src\components\forms\newMemoryForm.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import UploadInputs from '/src/components/shared/uploadInputs'
import DB from '/src/database/DB'
import FirebaseStorage from '/src/database/firebaseStorage'
import AppManager from '/src/managers/appManager'
import MyConfetti from '/src/components/shared/myConfetti'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import DatetimeFormats from '/src/constants/datetimeFormats'
import moment from 'moment'
import Memory from '/src/models/memory.js'
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
import {LuImagePlus} from 'react-icons/lu'
import creationForms from '../../constants/creationForms'
import DomManager from '../../managers/domManager'
import InputTypes from '../../constants/inputTypes'
import Spacer from '../shared/spacer'

export default function NewMemoryForm() {
  const {state, setState} = useContext(globalState)
  const {currentUser, authUser, refreshKey, theme, creationFormToShow} = state
  const [images, setImages] = useState([])
  const [newMemory, setNewMemory] = useState(new Memory())

  const resetForm = async () => {
    Manager.resetForm('new-memory-wrapper')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({...state, currentUser: updatedCurrentUser, isLoading: false, refreshKey: Manager.getUid(), creationFormToShow: ''})
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, newMemory.shareWith)
    setNewMemory((prevMemory) => ({...prevMemory, shareWith: updated}))
  }

  const submit = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n share memories with',
        'You have not connected any co-parents to your profile. It is also possible they have closed their profile.'
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
      AlertManager.throwError(
        'Files uploaded MUST be images (.png, .jpg, .jpeg, etc.)',
        `If you would like to share a document, please ${DomManager.tapOrClick()} the Create navbar item and select 'Document Upload'`
      )
      return false
    }

    let localImages = []
    if (Manager.isValid(images)) {
      for (let img of images) {
        localImages.push(await ImageManager.compressImage(img))
      }
    } else {
      return false
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

    setState({...state, isLoading: true})

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
              cleanedObject.id = Manager.getUid()

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
          .finally(async () => {
            MyConfetti.fire()
            await resetForm()
          })
        AppManager.setAppBadge(1)
      })
  }

  return (
    <Modal
      onSubmit={submit}
      wrapperClass="new-memory"
      submitText={'Add Memory'}
      submitIcon={<LuImagePlus />}
      title={'Share Memory'}
      onClose={resetForm}
      showCard={creationFormToShow === creationForms.memories}>
      <div className="new-memory-wrapper">
        <div id="new-memory-form-container" className={`${theme} form`}>
          <Spacer height={5} />
          <div className="form">
            {/* SHARE WITH */}
            {currentUser && <ShareWithCheckboxes onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />}

            {/* TITLE */}
            <InputWrapper
              inputType={InputTypes.text}
              labelText={'Title'}
              onChange={(e) => setNewMemory((prevMemory) => ({...prevMemory, title: e.target.value}))}
            />

            {/* DATE */}
            <InputWrapper
              defaultValue={moment()}
              uidClass="memory-capture-date-uid"
              labelText={'Capture Date'}
              inputType={InputTypes.date}
              onDateOrTimeSelection={(e) =>
                setNewMemory((prevMemory) => ({...prevMemory, memoryCaptureDate: moment(e).format(DatetimeFormats.dateForDb)}))
              }
            />

            {/* NOTES */}
            <InputWrapper
              onChange={(e) => setNewMemory((prevMemory) => ({...prevMemory, notes: e.target.value}))}
              inputType={InputTypes.textarea}
              labelText={'Notes'}
            />
            {/* UPLOAD BUTTON */}
            <UploadInputs
              containerClass={`${theme} new-memory-card`}
              uploadType={'image'}
              actualUploadButtonText={'Upload'}
              getImages={(input) => {
                setImages(input.target.files)
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