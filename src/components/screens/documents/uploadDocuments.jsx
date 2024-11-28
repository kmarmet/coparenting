import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import FirebaseStorage from '@firebaseStorage'
import CheckboxGroup from '@shared/checkboxGroup'
import Doc from '../../../models/doc'
import NotificationManager from '@managers/notificationManager'
import { ImEye } from 'react-icons/im'

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

export default function UploadDocuments({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const resetForm = () => {
    Manager.resetForm('upload-doc-wrapper')
    setShareWith([])
    setDocType(null)
    hideCard()
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
    if (!Manager.isValid(shareWith, true) || !Manager.isValid(docType)) {
      AlertManager.throwError('Document Type and Who should see it? are required')
      setState({ ...state, isLoading: false })
      return false
    }
    if (docType === 'document' && Object.entries(files).map((x) => !contains(x[1].name, '.docx'))[0]) {
      AlertManager.throwError('Uploaded file MUST be of type .docx')
      setState({ ...state, isLoading: false })
      return false
    }

    // Check for existing document
    const securedDocuments = await SecurityManager.getDocuments(currentUser)
    const existingDocument = securedDocuments.filter((x) => x.memoryName === image.name)[0]
    if (existingDocument) {
      // error
      AlertManager.throwError('Document has already been uploaded')
      setState({ ...state, isLoading: false })
      return false
    }
    let localImages = []

    if (docType === 'image') {
      for (let img of files) {
        localImages.push(await ImageManager.compressImage(img))
      }
      files = localImages
    }

    // Upload to Firebase Storage
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.documents}/`, currentUser?.id, files)
      .then(() => {})
      .finally(async () => {
        // Add documents to 'documents' property for currentUser
        await FirebaseStorage.getUrlsFromFiles(FirebaseStorage.directories.documents, currentUser?.id, files).then(async (urls) => {
          // Add to user documents object
          for (const url of urls) {
            const newDocument = new Doc()
            newDocument.url = url
            newDocument.uploadedBy = currentUser?.phone
            newDocument.id = Manager.getUid()
            newDocument.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
            newDocument.type = docType
            newDocument.name = FirebaseStorage.getImageNameFromUrl(url)
            const cleanedDoc = ObjectManager.cleanObject(newDocument, ModelNames.doc)
            await DocumentsManager.addDocumentToDocumentsTable(cleanedDoc)
          }

          setState({ ...state, isLoading: false })
          AlertManager.successAlert('Document Uploaded!')
          resetForm()

          // Send Notification
          NotificationManager.sendToShareWith(shareWith, 'New Document', `${currentUser} has uploaded a new document`)
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
    <BottomCard onSubmit={upload} refreshKey={refreshKey} submitText={'Upload'} showCard={showCard} title={'Upload Document'} onClose={resetForm}>
      <div className="upload-doc-wrapper">
        {/* PAGE CONTAINER */}
        <div id="upload-documents-container" className={`${theme} form `}>
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
            <>
              <CheckboxGroup parentLabel={'Document Type'} required={true} checkboxLabels={['Document', 'Image']} onCheck={handleCheckboxSelection} />
              <ShareWithCheckboxes
                icon={<ImEye />}
                shareWith={currentUser?.coparents?.map((x) => x.phone)}
                onCheck={handleShareWithSelection}
                labelText={'Who is allowed to see it?'}
                containerClass={'share-with-coparents'}
                dataPhone={currentUser?.coparents?.map((x) => x.phone)}
              />
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