import PushAlertApi from '@api/pushAlert'
import UploadInputs from '@components/shared/uploadInputs'
import DB from '@db'
import FirebaseStorage from '@firebaseStorage'
import AppManager from '@managers/appManager'
import CheckboxGroup from '@shared/checkboxGroup'
import MyConfetti from '@shared/myConfetti'
import ScreenNames from 'constants/screenNames'
import globalState from 'context'
import Manager from 'managers/manager'
import NotificationManager from 'managers/notificationManager'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import DateFormats from '../../constants/dateFormats'
import moment from 'moment'
import Memory from '../../models/memory'
import BottomCard from '../shared/bottomCard'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import Swal from 'sweetalert2'

function NewMemoryForm({ showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, navbarButton, updateKey, theme } = state
  const [shareWith, setShareWith] = useState([])
  const [memoryNotes, setMemoryNotes] = useState('')
  const [images, setImages] = useState([])
  const [memoryTitle, setMemoryTitle] = useState('')
  const inputFile = useRef(null)

  const resetForm = () => {
    Manager.resetForm('new-memory-wrapper')
    setShareWith([])
    setMemoryNotes('')
    setImages([])
    setMemoryTitle('')
    setState({ ...state, isLoading: false })
    MyConfetti.fire()
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const submit = async () => {
    if (images !== undefined && images.length === 0) {
      displayAlert('error', 'Please choose an image')
      return false
    }
    if (!Manager.isValid(shareWith, true)) {
      displayAlert('error', 'Please select who can see this memory')
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      displayAlert('error', 'Files uploaded MUST be images (.png, .jpg, .jpeg, etc.).')
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
      displayAlert('error', 'This memory already exists')
      return false
    }

    hideCard()

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
            newMemory.createdBy = currentUser.phone

            const cleanedObject = Manager.cleanObject(newMemory, ModelNames.memory)

            await DB.add('memories', cleanedObject)
          }

          // Send Notification
          for (const coparentPhone of shareWith) {
            const subId = await NotificationManager.getUserSubId(coparentPhone)
            PushAlertApi.sendMessage(`Memories Await!`, `${formatNameFirstNameOnly(currentUser.name)} has uploaded a new memory!`, subId)
          }
        })
        AppManager.setAppBadge(1)
        resetForm()
      })
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <div className="new-memory-wrapper">
      <BottomCard title={'New Memory'} onClose={hideCard} showCard={showCard}>
        <div id="new-memory-form-container" className={`${theme} form`}>
          <div className="form">
            {currentUser && (
              <div className="share-with-container mb-20">
                <label>
                  <span className="material-icons-round">visibility</span>Who should see it?<span className="asterisk">*</span>
                </label>
                <CheckboxGroup
                  dataPhone={currentUser?.coparents.map((x) => x.phone)}
                  labels={currentUser?.coparents.map((x) => x.name)}
                  onCheck={handleShareWithSelection}
                />
              </div>
            )}
            <label>Title</label>
            <DebounceInput
              minLength={2}
              className={'mb-20'}
              debounceTimeout={500}
              onChange={(e) => {
                const inputValue = e.target.value
                setMemoryTitle(inputValue)
              }}
            />
            <label>Image Description/Notes</label>
            <textarea className="mb-15" onChange={(e) => setMemoryNotes(e.target.value)}></textarea>
            <UploadInputs
              containerClass={theme}
              uploadType={'image'}
              actualUploadButtonText={'Upload Memory'}
              getImages={(files) => {
                setImages(files)
              }}
              uploadButtonText="Choose Image"
              upload={submit}
            />
          </div>
        </div>
      </BottomCard>
    </div>
  )
}

export default NewMemoryForm
