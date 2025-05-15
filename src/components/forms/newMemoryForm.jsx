// Path: src\components\forms\newMemoryForm.jsx
import MyConfetti from '/src/components/shared/myConfetti'
import UploadInputs from '/src/components/shared/uploadInputs'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import FirebaseStorage from '/src/database/firebaseStorage'
import AlertManager from '/src/managers/alertManager'
import AppManager from '/src/managers/appManager'
import ImageManager from '/src/managers/imageManager'
import Manager from '/src/managers/manager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import UpdateManager from '/src/managers/updateManager'
import ActivityCategory from '/src/models/activityCategory'
import Memory from '/src/models/memory.js'
import ModelNames from '/src/models/modelNames'
import moment from 'moment'
import React, {useContext, useState} from 'react'
import {LuImagePlus} from 'react-icons/lu'
import creationForms from '../../constants/creationForms'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useMemories from '../../hooks/useMemories'
import DatasetManager from '../../managers/datasetManager'
import DomManager from '../../managers/domManager'
import InputWrapper from '../shared/inputWrapper'
import Modal from '../shared/modal'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import Spacer from '../shared/spacer'

export default function NewMemoryForm() {
  const {state, setState} = useContext(globalState)
  const {authUser, refreshKey, theme, creationFormToShow} = state
  const [images, setImages] = useState([])
  const {currentUser} = useCurrentUser()
  const {memories} = useMemories()
  const [newMemory, setNewMemory] = useState(new Memory())
  const [shareWith, setShareWith] = useState([])

  const ResetForm = async () => {
    Manager.ResetForm('new-memory-wrapper')
    setState({...state, isLoading: false, refreshKey: Manager.GetUid(), creationFormToShow: ''})
  }

  const HandleShareWithSelection = (e) => {
    const updated = DomManager.HandleShareWithSelection(e, currentUser, newMemory.shareWith)
    setShareWith(updated)
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

    if (validAccounts > 0 && !Manager.IsValid(shareWith)) {
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
              const cleanMemory = ObjectManager.GetModelValidatedObject(newMemory, ModelNames.memory)

              cleanMemory.url = url
              cleanMemory.memoryName = Manager.GenerateHash(imageName)
              cleanMemory.ownerKey = currentUser?.key
              cleanMemory.id = Manager.GetUid()
              cleanMemory.shareWith = shareWith
              // Add to Database
              await DB.Add(`${DB.tables.memories}/${currentUser?.key}`, memories, cleanMemory)
            }

            // Send Notification
            await UpdateManager.sendToShareWith(
              newMemory.shareWith,
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
              onChange={(e) => setNewMemory((prevMemory) => ({...prevMemory, title: e.target.value}))}
            />

            {/* DATE */}
            <InputWrapper
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