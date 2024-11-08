import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import FirebaseStorage from '@firebaseStorage'
import CheckboxGroup from '@shared/checkboxGroup'
import Doc from '../../../models/doc'
import NotificationManager from '@managers/notificationManager'
import DocumentsManager from '../../../managers/documentsManager'

import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import UploadInputs from '../../shared/uploadInputs'
import SecurityManager from '../../../managers/securityManager'

export default function UploadDocuments({ hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [image, setImage] = useState('')

  const resetForm = async () => {
    Manager.resetForm('upload-doc-wrapper')
    setShareWith([])
    setDocType(null)
    hideCard()
  }

  const upload = async () => {
    setState({ ...state, isLoading: true })
    const files = document.querySelector('#upload-input').files

    // Validation
    if (files.length === 0) {
      throwError('Please choose a file to upload')
      setState({ ...state, isLoading: false })
      return false
    }
    if (!Manager.isValid(shareWith, true) || !Manager.isValid(docType)) {
      throwError('Document Type and Who should see it? are required')
      setState({ ...state, isLoading: false })
      return false
    }
    if (docType === 'document' && Object.entries(files).map((x) => !contains(x[1].name, '.docx'))[0]) {
      throwError('Uploaded file MUST be of type .docx')
      setState({ ...state, isLoading: false })
      return false
    }

    // Check for existing document
    const securedDocuments = await SecurityManager.getDocuments(currentUser)
    const existingDocument = securedDocuments.filter((x) => x.memoryName === image.name)[0]
    if (existingDocument) {
      // error
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

          setState({ ...state, isLoading: false })

          // for (let coparentPhone of shareWith) {
          //   await setActivitySets(coparentPhone)
          // }

          // Send Notification
          NotificationManager.sendToShareWith(shareWith, 'New Document', `${currentUser} has uploaded a new document`)
        })
      })
    await resetForm()
  }

  // const setActivitySets = async (userPhone) => {
  //   const existingActivitySet = await DB.getTable(`${DB.tables.activitySets}/${userPhone}`, true)
  //   let newActivitySet = new ActivitySet()
  //   let unreadMessageCount = existingActivitySet?.unreadMessageCount || 0
  //   if (Manager.isValid(existingActivitySet, false, true)) {
  //     newActivitySet = { ...existingActivitySet }
  //   }
  //   newActivitySet.unreadMessageCount = unreadMessageCount === 0 ? 1 : (unreadMessageCount += 1)
  //   await DB_UserScoped.addActivitySet(`${DB.tables.activitySets}/${userPhone}`, newActivitySet)
  // }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
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
    Manager.showPageContainer('show')
  }, [])

  return (
    <div className="upload-doc-wrapper">
      {/* PAGE CONTAINER */}
      <div id="upload-documents-container" className={`${theme} form`}>
        <p className={`${theme} text-screen-intro`}>
          Upload documents (.doc or .docx) , or images of documents you would like to save or share with a co-parent.
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
              <CheckboxGroup checkboxLabels={['Document', 'Image']} onCheck={handleCheckboxSelection} />
              <label>
                <span className="material-icons-round">visibility</span>Who should see it?<span className="asterisk">*</span>
              </label>
              <CheckboxGroup
                dataPhone={currentUser?.coparents.map((x) => x.phone)}
                checkboxLabels={currentUser?.coparents.map((x) => x.name)}
                onCheck={handleShareWithSelection}
              />
            </div>
          )}
        </div>

        {/* UPLOAD BUTTONS */}
        <UploadInputs
          onClose={hideCard}
          containerClass={theme}
          actualUploadButtonText={'Upload'}
          uploadButtonText={docType === 'document' ? 'Document' : 'Image'}
          uploadType={docType}
          upload={upload}
        />
      </div>
    </div>
  )
}
