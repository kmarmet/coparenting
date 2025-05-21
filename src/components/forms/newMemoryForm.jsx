// Path: src\components\forms\newMemoryForm.jsx
import UploadInputs from '/src/components/shared/uploadInputs'
import AlertManager from '/src/managers/alertManager'
import ImageManager from '/src/managers/imageManager'
import Manager from '/src/managers/manager'
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
import {LuImagePlus} from 'react-icons/lu'
import creationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import DB from '../../database/DB'
import FirebaseStorage from '../../database/firebaseStorage'
import useCurrentUser from '../../hooks/useCurrentUser'
import useMemories from '../../hooks/useMemories'
import AppManager from '../../managers/appManager'
import DatasetManager from '../../managers/datasetManager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import ActivityCategory from '../../models/activityCategory'
import Memory from '../../models/memory'
import ModelNames from '../../models/modelNames'
import InputWrapper from '../shared/inputWrapper'
import Modal from '../shared/modal'
import MyConfetti from '../shared/myConfetti'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import Spacer from '../shared/spacer'

export function NewMemoryForm() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [images, setImages] = useState([])
  const {currentUser} = useCurrentUser()
  const {memories} = useMemories()
  const newMemory = useRef(new Memory())

  const ResetForm = async () => {
    // Manager.ResetForm('new-memory-wrapper')
    setState({...state, isLoading: false, refreshKey: Manager.GetUid(), creationFormToShow: ''})
  }

  const HandleShareWithSelection = (e) => {
    const key = e.currentTarget.dataset['key']
    newMemory.current.shareWith = DatasetManager.ToggleInArray(newMemory.current.shareWith, key)
  }

  const Upload = async () => {
    const validAccounts = currentUser?.sharedDataUsers?.length
    if (validAccounts === 0) {
      AlertManager.throwError(
        `No ${currentUser?.accountType === 'parent' ? 'co-parents or children' : 'parents'} to \n share memories with`,
        `You have not connected any ${currentUser?.accountType === 'parent' ? 'co-parents or children' : 'parents'} to your profile. It is also possible they have closed their profile.`
      )
      return false
    }

    if (validAccounts > 0 && !Manager.IsValid(newMemory.current.shareWith)) {
      AlertManager.throwError('Please choose who you would like to share this memory with')
      return false
    }

    if (images !== undefined && images.length === 0) {
      AlertManager.throwError('Please choose an image')
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      AlertManager.throwError('Files uploaded MUST be images (.png, .jpg, .jpeg, etc.)')
      return false
    }

    let imagesToUpload = []
    if (Manager.IsValid(images)) {
      for (let img of images) {
        imagesToUpload.push(await ImageManager.compressImage(img))
      }
    } else {
      return false
    }

    // Check for existing memory
    const validImgArray = DatasetManager.GetValidArray(imagesToUpload)
    let shouldProceed = true

    for (let img of validImgArray) {
      const existingMemory = memories.find((x) => Manager.DecodeHash(x.memoryName) === Manager.GenerateHash(img.name))
      if (Manager.IsValid(existingMemory)) {
        AlertManager.throwError('This memory already exists')
        shouldProceed = false
        return false
      }
    }

    if (!shouldProceed) {
      return false
    }

    setState({...state, isLoading: true})

    const clean = ObjectManager.GetModelValidatedObject(newMemory.current, ModelNames.memory)

    // Upload Image
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.memories}/`, currentUser?.key, imagesToUpload)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add memories to 'memories' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.memories, currentUser?.key, imagesToUpload)
          .then(async (urls) => {
            // Add to user memories object
            for (const url of urls) {
              const imageName = FirebaseStorage.GetImageNameFromUrl(url)

              clean.url = url
              clean.memoryName = Manager.GenerateHash(imageName)
              clean.ownerKey = currentUser?.key
              clean.id = Manager.GetUid()
              // Add to Database
              await DB.Add(`${DB.tables.memories}/${currentUser?.key}`, memories, clean)
            }

            // Send Notification
            await UpdateManager.SendToShareWith(
              clean.shareWith,
              currentUser,
              `New Memory`,
              `${StringManager.GetFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
              ActivityCategory.memories
            )
          })
          .catch((error) => {
            console.error(error)
          })
          .finally(async () => {
            MyConfetti.fire()
            await ResetForm()
          })
        AppManager.setAppBadge(1)
      })
  }

  return (
    <Modal
      onSubmit={Upload}
      wrapperClass="new-memory"
      submitText={'Add Memory'}
      submitIcon={<LuImagePlus />}
      title={'Share Memory'}
      onClose={ResetForm}
      showCard={creationFormToShow === creationForms.memories}>
      <div className="new-memory-wrapper">
        <div id="new-memory-form-container" className={`${theme} form`}>
          <Spacer height={5} />
          <div className="form">
            {/* SHARE WITH */}
            <ShareWithCheckboxes onCheck={HandleShareWithSelection} containerClass={'share-with-coparents'} />

            {/* TITLE */}
            <InputWrapper
              inputType={InputTypes.text}
              labelText={'Title'}
              onChange={(e) => {
                newMemory.current.title = e.target.value
              }}
            />

            {/* DATE */}
            <InputWrapper
              uidClass="memory-capture-date-uid"
              labelText={'Capture Date'}
              inputType={InputTypes.date}
              onDateOrTimeSelection={(e) => {
                newMemory.current.memoryCaptureDate = moment(e).format(DatetimeFormats.dateForDb)
              }}
            />

            {/* NOTES */}
            <InputWrapper onChange={(e) => (newMemory.current.notes = e.target.value)} inputType={InputTypes.textarea} labelText={'Notes'} />

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