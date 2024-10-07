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
import DocManager from '@managers/docManager'
import PushAlertApi from '@api/pushAlert'
import NotificationManager from '@managers/notificationManager'
import DocumentsManager from '../../../managers/documentsManager'

export default function UploadDocuments() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)

  const upload = async () => {
    setState({ ...state, isLoading: true })
    const files = document.querySelector('#upload-input').files
    if (files.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose a file to upload' })
      return false
    }
    if (!Manager.isValid(shareWith, true) || !Manager.isValid(docType)) {
      setState({ ...state, showAlert: true, alertMessage: 'Document type and Who should see it? are required' })
      return false
    }

    if (Object.entries(files).map((x) => !x[1].name.contains('.docx'))[0]) {
      setState({ ...state, showAlert: true, alertMessage: 'Uploaded file MUST be of type .docx' })
      return false
    }

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
            newDocument.name = FirebaseStorage.getImageNameFromUrl(url).replace('.png', '').replace('.jpg', '').replace('.jpeg', '')
            await DocumentsManager.addDocumentToDocumentsTable(newDocument).finally(() => {
              setState({ ...state, currentScreen: ScreenNames.documents })
            })
          }

          setState({ ...state, isLoading: false, currentScreen: ScreenNames.docsList })

          // Send Notification
          NotificationManager.sendToShareWith(shareWith, 'New Document', `${currentUser} has uploaded a new document`)
        })
      })
  }

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
    Manager.toggleForModalOrNewForm('show')
    setState({ ...state, previousScreen: ScreenNames.docsList, showBackButton: true, showMenuButton: false })
  }, [])

  return (
    <>
      <p className="screen-title ">Upload Documents</p>

      <div id="upload-documents-container" className={`${currentUser?.settings?.theme} page-container`}>
        <p className={`${currentUser?.settings?.theme} text-screen-intro`}>
          Upload documents (.doc or .docx) , or images of documents you would like to save or share with a coparent.
        </p>
        <p className={`${currentUser?.settings?.theme} text-screen-intro`}>
          The uploaded document <span className="accent">MUST</span> be of type <b>.docx</b>. If the document you are uploading is a different type is
          not .docx (.doc, .pdf, .txt, .etc) please click the link below to convert it to .docx for free.
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
        <div className="flex mb-15" id="upload-inputs">
          <div id="upload-inputs">
            <label htmlFor="upload-input" className="w-50 button default  custom-file-upload">
              Choose File
            </label>
            <input id="upload-input" type="file" multiple />
            <button className="button w-50 green default" onClick={upload}>
              Upload <span className="material-icons-round">file_upload</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
