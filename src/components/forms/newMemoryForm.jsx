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
import CalendarManager from '../../managers/calendarManager'
import DateFormats from '../../constants/dateFormats'
import moment from 'moment'
import Memory from '../../models/memory'

function NewMemoryForm() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [shareWith, setShareWith] = useState([])
  const [memoryNotes, setMemoryNotes] = useState('')
  const [images, setImages] = useState([])
  const [memoryTitle, setMemoryTitle] = useState('')
  const inputFile = useRef(null)

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const submit = async () => {
    setState({ ...state, isLoading: true })
    if (images.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose an image', isLoading: false })
      return false
    }

    if (shareWith.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please select who can see this memory', isLoading: false })
      return false
    }

    const notAnImage = Object.entries(images).some((x) => {
      return x[1].name.includes('.doc')
    })

    if (notAnImage) {
      setState({ ...state, isLoading: false, showAlert: true, alertMessage: 'Files uploaded MUST be images (.png, .jpg, .jpeg, etc.).' })
      return false
    }
    console.log(images)
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
            const newMemory = new Memory()
            newMemory.notes = memoryNotes
            newMemory.id = Manager.getUid()
            newMemory.url = url
            newMemory.title = memoryTitle
            newMemory.shareWith = shareWith
            newMemory.creationDate = moment().format(DateFormats.dateForDb)
            newMemory.createdBy = currentUser.phone
            await DB.addToUserMemories(currentUser, 'memories', newMemory).finally(() => {
              setState({ ...state, isLoading: false, currentScreen: ScreenNames.memories })
            })
          }

          // Send Notification
          for (const coparentPhone of shareWith) {
            const subId = await NotificationManager.getUserSubId(coparentPhone)
            PushAlertApi.sendMessage(`Memories Await!`, `${currentUser.name.formatNameFirstNameOnly()} has uploaded a new memory!`, subId)
          }
        })
        MyConfetti.fire()
        AppManager.setAppBadge(1)
      })
  }

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
    setState({ ...state, previousScreen: ScreenNames.memories, showMenuButton: false, showBackButton: true })
    console.log('blah')
  }, [])

  return (
    <>
      <p className="screen-title ">New Memory</p>
      <div id="new-memory-form-container" className={`${currentUser?.settings?.theme} page-container form`}>
        <div className="form">
          {currentUser && (
            <div className="share-with-container mb-20">
              <label>
                <span className="material-icons-round">visibility</span>Who should see it?<span className="asterisk">*</span>
              </label>
              <CheckboxGroup
                dataPhone={currentUser.coparents.map((x) => x.phone)}
                labels={currentUser.coparents.map((x) => x.name)}
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
            actualUploadButtonText={'Upload Memory'}
            getImages={(files) => setImages(files)}
            uploadButtonText="Choose Image"
            upload={submit}
          />
        </div>
      </div>
    </>
  )
}

export default NewMemoryForm
