// Path: src\components\forms\newMemoryForm.jsx
import UploadButton from '../shared/uploadButton'
import AlertManager from '../../managers/alertManager'
import ImageManager from '../../managers/imageManager'
import Manager from '../../managers/manager'
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
import ActivityCategory from '../../constants/activityCategory'
import creationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import ModelNames from '../../constants/modelNames'
import globalState from '../../context'
import DB from '../../database/DB'
import Storage from '../../database/storage'
import useCurrentUser from '../../hooks/useCurrentUser'
import useMemories from '../../hooks/useMemories'
import AppManager from '../../managers/appManager'
import DatasetManager from '../../managers/datasetManager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import Memory from '../../models/new/memory'
import Form from '../shared/form'
import InputField from '../shared/inputField'
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

  const HandleShareWithSelection = (e) => (newMemory.current.shareWith = e.map((x) => x.value))

  const Upload = async () => {
    setState({...state, isLoading: true})

    //#region Validation
    const validAccounts = currentUser?.sharedDataUsers?.length
    if (validAccounts === 0) {
      AlertManager.throwError(
        `No ${currentUser?.accountType === 'parent' ? 'co-parents or children' : 'parents'} to \n share memories with`,
        `You have not connected any ${currentUser?.accountType === 'parent' ? 'co-parents or children' : 'parents'} to your profile. It is also possible they have closed their profile.`
      )
      setState({...state, isLoading: false})
      return false
    }

    if (validAccounts > 0 && !Manager.IsValid(newMemory.current.shareWith)) {
      AlertManager.throwError('Please choose who you would like to share this memory with')
      setState({...state, isLoading: false})
      return false
    }

    if (images !== undefined && images.length === 0) {
      AlertManager.throwError('Please choose an image')
      setState({...state, isLoading: false})
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      AlertManager.throwError('Files uploaded MUST be images (.png, .jpg, .jpeg, etc.)')
      setState({...state, isLoading: false})
      return false
    }

    //#endregion Validation

    let imagesToUpload = []
    if (Manager.IsValid(images)) {
      for (let img of images) {
        imagesToUpload.push(await ImageManager.compressImage(img))
      }
    } else {
      setState({...state, isLoading: false})
      return false
    }

    // Check for existing memory
    const validImgArray = DatasetManager.GetValidArray(imagesToUpload)
    let shouldProceed = true

    for (let img of validImgArray) {
      const existingMemory = memories.find((x) => Manager.DecodeHash(x.name) === Manager.GenerateHash(img.name))
      if (Manager.IsValid(existingMemory)) {
        AlertManager.throwError('This memory already exists')
        shouldProceed = false
        setState({...state, isLoading: false})
        return false
      }
    }

    if (!shouldProceed) {
      setState({...state, isLoading: false})
      return false
    }

    const clean = ObjectManager.GetModelValidatedObject(newMemory.current, ModelNames.memory)

    // Upload Image
    await Storage.uploadMultiple(`${Storage.directories.memories}/`, currentUser?.key, imagesToUpload)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add memories to 'memories' property for currentUser
        await Storage.getUrlsFromFiles(Storage.directories.memories, currentUser?.key, imagesToUpload)
          .then(async (urls) => {
            // Add to user memories object
            for (const url of urls) {
              const imageName = Storage.GetImageNameFromUrl(url)

              clean.url = url
              clean.name = Manager.GenerateHash(imageName)
              clean.ownerKey = currentUser?.key
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
        AppManager.SetAppBadge(1)
        setState({...state, isLoading: false})
      })
  }

  return (
    <Form
      onSubmit={Upload}
      wrapperClass="new-memory"
      submitText={'Upload'}
      title={'Share Memory'}
      onClose={ResetForm}
      showCard={creationFormToShow === creationForms.memories}>
      <div className="new-memory-wrapper">
        {/* TITLE */}
        <InputField
          inputType={InputTypes.text}
          placeholder={'Title'}
          onChange={(e) => {
            newMemory.current.title = e.target.value
          }}
        />

        {/* DATE */}
        <InputField
          uidClass="memory-capture-date-uid"
          labelText={'Capture Date'}
          inputType={InputTypes.date}
          onDateOrTimeSelection={(e) => {
            newMemory.current.captureDate = moment(e).format(DatetimeFormats.dateForDb)
          }}
        />

        {/* NOTES */}
        <InputField onChange={(e) => (newMemory.current.notes = e.target.value)} inputType={InputTypes.textarea} placeholder={'Notes'} />
        <div id="new-memory-form-container" className={`${theme}`}>
          <Spacer height={8} />

          {/* SHARE WITH */}
          <ShareWithCheckboxes onCheck={HandleShareWithSelection} />

          <Spacer height={8} />
          {/* UPLOAD BUTTON */}
          <UploadButton
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
    </Form>
  )
}