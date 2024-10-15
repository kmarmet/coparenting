import React, { useState, useEffect, useContext, startTransition } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import FirebaseStorage from '@firebaseStorage'
import Modal from '@shared/modal'
import DB from '@db'
import SmsManager from '@managers/smsManager'
import CheckboxGroup from '@shared/checkboxGroup'
import Doc from '../../../models/doc'
import PushAlertApi from '@api/pushAlert'
import NotificationManager from '@managers/notificationManager'
import DocumentsManager from '../../../managers/documentsManager'

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
  uniqueArray,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import UploadInputs from '../../shared/uploadInputs'
import DateFormats from '../../../constants/dateFormats'
import SecurityManager from '../../../managers/securityManager'

export default function UploadDocuments() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [image, setImage] = useState('')
  const resetForm = async () => {
    Manager.resetForm()
    setShareWith([])
    setDocType(null)
    setState({ ...state, formToShow: '' })
  }

  const upload = async () => {
    setState({ ...state, isLoading: true })
    const files = document.querySelector('#upload-input').files

    // Validation
    if (files.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose a file to upload', alertType: 'error' })
      return false
    }
    if (!Manager.isValid(shareWith, true) || !Manager.isValid(docType)) {
      setState({ ...state, showAlert: true, alertMessage: 'Document Type and Who should see it? are required', alertType: 'error' })
      return false
    }
    if (docType === 'document' && Object.entries(files).map((x) => !x[1].name.contains('.docx'))[0]) {
      setState({ ...state, showAlert: true, alertMessage: 'Uploaded file MUST be of type .docx', alertType: 'error' })
      return false
    }

    // Check for existing document
    const securedDocuments = await SecurityManager.getDocuments(currentUser)
    const existingDocument = securedDocuments.filter((x) => x.memoryName === image.name)[0]
    if (existingDocument) {
      // error
      console.log('existing')
      setState({ ...state, isLoading: false })
      return false
    }

    // Upload to Firebase Storage
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.documents}/`, currentUser.id, files)
      .then(() => {
        const checkedCheckbox = document.querySelector('.share-with-container .box.active')
        if (checkedCheckbox) {
          checkedCheckbox.classList.remove('active')
        }
      })
      .finally(async () => {
        // Add documents to 'documents' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.documents, currentUser.id, files).then(async (urls) => {
          // Add to user documents object
          for (const url of urls) {
            const newDocument = new Doc()
            newDocument.url = url
            newDocument.uploadedBy = currentUser.phone
            newDocument.id = Manager.getUid()
            newDocument.shareWith = Manager.getUniqueArray(shareWith).flat()
            newDocument.type = docType
            newDocument.name = FirebaseStorage.getImageNameFromUrl(url)
            await DocumentsManager.addDocumentToDocumentsTable(newDocument).finally(() => {
              setState({ ...state, currentScreen: ScreenNames.documents })
            })
          }

          setState({ ...state, isLoading: false, formToShow: '' })

          // Send Notification
          NotificationManager.sendToShareWith(shareWith, 'New Document', `${currentUser} has uploaded a new document`)
        })
      })
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, theme, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handleCheckboxSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setDocType(e.toLowerCase())
      },
      (e) => {},
      false
    )
  }

  useEffect(() => {
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      {/* PAGE CONTAINER */}
      <BottomCard showCard={formToShow === ScreenNames.uploadDocuments} title={'Add Document'} onClose={() => setState({ ...state, formToShow: '' })}>
        <div id="upload-documents-container" className={`${theme} form`}>
          <p className={`${theme} text-screen-intro`}>If uploading a document</p>
          <p className={`${theme} text-screen-intro`}>
            Upload documents (.doc or .docx) , or images of documents you would like to save or share with a coparent.
          </p>
          <p className={`${theme} text-screen-intro`}>
            The uploaded document. If the document you are uploading is a different type is not .docx (.doc, .pdf, .txt, .etc) please click the link
            below to convert it to .docx for free.
          </p>
          <p>
            <span className="accent pr-5">
              <b>MUST</b>
            </span>
            be of type <b className="pl-5">.docx</b>
          </p>
          <a href="https://convertio.co/" target="_blank" className="mb-10">
            Convert to .docx
          </a>

          {/* FORM */}
          <div className="form">
            {currentUser && (
              <div className="share-with-container">
                <label>
                  <span className="material-icons-round">description</span> Document type <span className="asterisk">*</span>
                </label>
                <CheckboxGroup labels={['Document', 'Image']} onCheck={handleCheckboxSelection} />
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
          </div>

          {/* UPLOAD BUTTONS */}
          <UploadInputs
            containerClass={theme}
            actualUploadButtonText={'Upload'}
            uploadButtonText={docType === 'document' ? 'Choose Document' : 'Choose Image'}
            uploadType={docType}
            upload={upload}
          />

          <div className="buttons gap">
            <button className="button card-button red" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </BottomCard>
    </>
  )
}
