import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import FirebaseStorage from '@firebaseStorage'
import CheckboxGroup from '@shared/checkboxGroup'
import Doc from '../../../models/doc'
import NotificationManager from '@managers/notificationManager.js'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import UploadInputs from '../../shared/uploadInputs'
import SecurityManager from '../../../managers/securityManager'
import ShareWithCheckboxes from '../../shared/shareWithCheckboxes'
import BottomCard from '../../shared/bottomCard'
import DatasetManager from '../../../managers/datasetManager'
import AlertManager from '../../../managers/alertManager'
import ImageManager from '../../../managers/imageManager'
import ModelNames from '../../../models/modelNames'
import ObjectManager from '../../../managers/objectManager'
import DocumentsManager from '../../../managers/documentsManager'
import { HiOutlineDocumentArrowUp } from 'react-icons/hi2'
import ActivityCategory from '../../../models/activityCategory'
import DB_UserScoped from '@userScoped'
import InputWrapper from '../../shared/inputWrapper'
import DB from '@db'

export default function UploadDocuments({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [docName, setDocName] = useState('')
  const resetForm = () => {
    hideCard()
    Manager.resetForm('upload-doc-wrapper')
    setShareWith([])
    setDocType(null)
    setRefreshKey(Manager.getUid())
  }

  const upload = async () => {
    setState({ ...state, isLoading: true })
    let files = document.querySelector('#upload-input').files
    const image = files[0]

    // Validation
    if (files.length === 0) {
      AlertManager.throwError('Please choose a file to upload')
      setState({ ...state, isLoading: false })
      return false
    }
    if (!Manager.isValid(docType)) {
      AlertManager.throwError('Please choose a Document Type')
      setState({ ...state, isLoading: false })
      return false
    }
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    if (validAccounts > 0 && currentUser?.coparents?.length > 0) {
      if (shareWith.length === 0) {
        AlertManager.throwError('Please choose who you would like to share this schedule with')
        return false
      }
    }
    if (docType === 'document' && Object.entries(files).map((x) => !contains(x[1].name, '.docx'))[0]) {
      AlertManager.throwError('Uploaded file MUST be of type .docx')
      setState({ ...state, isLoading: false })
      return false
    }

    // Check for existing document
    const securedDocuments = await SecurityManager.getDocuments(currentUser)
    // const existingDocument = securedDocuments.filter((x) => x.memoryName === image.name)[0]
    const existingDocument = await DB.find(securedDocuments, null, false, (doc) => {
      if (doc.name === docName && doc.ownerPhone === currentUser.phone) {
        return true
      }
    })

    if (existingDocument) {
      // error
      AlertManager.throwError('Document has already been uploaded')
      setState({ ...state, isLoading: false })
      return false
    }

    let localImages = []

    if (docType === 'image') {
      if (!Manager.isValid(files)) {
        for (let img of files) {
          localImages.push(await ImageManager.compressImage(img))
        }
      }
      files = localImages
    }

    // Upload to Firebase Storage
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.documents}/`, currentUser?.id, files)
      .then(() => {})
      .finally(async () => {
        // Add documents to 'documents' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.documents, currentUser?.id, files).then(async (urls) => {
          resetForm()
          // Add to user documents object
          for (const url of urls) {
            const newDocument = new Doc()
            newDocument.url = url
            newDocument.ownerPhone = currentUser?.phone
            newDocument.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
            newDocument.type = docType
            newDocument.name = docName
            const cleanedDoc = ObjectManager.cleanObject(newDocument, ModelNames.doc)
            await DocumentsManager.addDocumentToDocumentsTable(cleanedDoc)
          }

          AlertManager.successAlert('Document Uploaded!')

          // Send Notification
          await NotificationManager.sendToShareWith(
            shareWith,
            currentUser,
            `New Document`,
            `${formatNameFirstNameOnly(currentUser.name)} has uploaded a new document`,
            ActivityCategory.documents
          )
        })
      })
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
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
    <BottomCard
      className="upload-document-card"
      wrapperClass="upload-document-bottom-card"
      onSubmit={upload}
      refreshKey={refreshKey}
      submitText={'Upload'}
      showCard={showCard}
      submitIcon={<HiOutlineDocumentArrowUp />}
      title={'Upload Document'}
      onClose={resetForm}>
      <div className="upload-doc-wrapper">
        {/* PAGE CONTAINER */}
        <div id="upload-documents-container" className={`${theme} form `}>
          <p className={`${theme} text-screen-intro`}>
            If the you are uploading a document, the file name <b>MUST</b> be <b>.docx</b> (not .doc, .pdf, .txt, .etc). If the file name does not end
            with .docx, please click the link below to convert it to .docx for free.
          </p>
          <a href="https://convertio.co/" target="_blank" className="mb-10">
            Convert to .docx
          </a>

          {/* FORM */}
          <div className="form">
            <>
              <InputWrapper labelText={'Document Name'} onChange={(e) => setDocName(e.target.value)} />
              <CheckboxGroup parentLabel={'Document Type'} required={true} checkboxLabels={['Document', 'Image']} onCheck={handleCheckboxSelection} />
              <ShareWithCheckboxes onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
            </>
          </div>
          {/* UPLOAD BUTTONS */}
          <UploadInputs
            onClose={hideCard}
            containerClass={`${theme} new-document-card`}
            actualUploadButtonText={'Upload'}
            uploadButtonText={docType === 'document' ? 'Document' : 'Choose'}
            uploadType={docType}
            upload={() => {}}
          />
        </div>
      </div>
    </BottomCard>
  )
}