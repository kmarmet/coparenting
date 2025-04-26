// Path: src\components\screens\documents\newDocument.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager.js'
import FirebaseStorage from '/src/database/firebaseStorage'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import Doc from '/src/models/doc'
import NotificationManager from '/src/managers/notificationManager'
import UploadInputs from '/src/components/shared/uploadInputs'
import SecurityManager from '/src/managers/securityManager'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import Modal from '/src/components/shared/modal'
import DatasetManager from '/src/managers/datasetManager'
import AlertManager from '/src/managers/alertManager'
import ImageManager from '/src/managers/imageManager'
import ModelNames from '/src/models/modelNames'
import ObjectManager from '/src/managers/objectManager'
import DocumentsManager from '/src/managers/documentsManager'
import ActivityCategory from '/src/models/activityCategory'
import InputWrapper from '/src/components/shared/inputWrapper'
import DB from '/src/database/DB'
import StringManager from '/src/managers/stringManager'
import DocumentConversionManager from '/src/managers/documentConversionManager.js'
import {getStorage, ref, uploadString} from 'firebase/storage'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'
import CreationForms from '../../../constants/creationForms'
import useCurrentUser from '../../../hooks/useCurrentUser'

export default function NewDocument() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [docName, setDocName] = useState('')
  const [doc, setDoc] = useState()
  const {currentUser} = useCurrentUser()

  const ResetForm = (successMessage = '') => {
    Manager.ResetForm('upload-doc-wrapper')
    setShareWith([])
    setDocType(null)
    setDoc(null)
    setState({...state, refreshKey: Manager.getUid(), isLoading: false, creationFormToShow: '', successAlertMessage: successMessage})
  }

  const upload = async () => {
    if (!doc) {
      AlertManager.throwError('Please choose a file to upload')
      return false
    }
    const fileExtension = StringManager.getFileExtension(doc?.name).toString()
    let docNameToUse = `${docName}.${fileExtension}`
    if (!Manager.isValid(docName, true)) {
      docNameToUse = doc.name
    }

    //#region VALIDATION
    if (!Manager.isValid(docType)) {
      AlertManager.throwError('Please choose a document type')
      return false
    }

    // if (docType === 'document' && Object.entries(files).map((x) => !Manager.contains(x[1].name, '.docx'))[0]) {
    //   AlertManager.throwError('Uploaded file MUST be of type .docx')
    //   setState({ ...state, isLoading: false })
    //   return false
    // }

    // Check for existing document
    const securedDocuments = await SecurityManager.getDocuments(currentUser)
    const existingDocument = await DB.find(securedDocuments, null, false, (doc) => {
      if (doc.name === docName && doc.ownerKey === currentUser.key) {
        return true
      }
    })
    let html = ''
    let imageUrl = ''
    if (existingDocument) {
      // error
      AlertManager.throwError('Document has already been uploaded')
      return false
    }
    //#endregion VALIDATION

    setState({...state, isLoading: true, loadingText: 'Making the magic happen! Your patience is appreciated!'})

    //#region IMAGE CONVERSION
    if (docType === 'image') {
      const compressedDoc = await ImageManager.compressImage(doc)
      let firebaseStorageFileName = StringManager.formatFileName(docNameToUse)
      // Upload to Firebase Storage
      imageUrl = await FirebaseStorage.uploadByPath(
        `${FirebaseStorage.directories.documents}/${currentUser?.key}/${firebaseStorageFileName}`,
        compressedDoc
      )
      const imageName = FirebaseStorage.getImageNameFromUrl(imageUrl)
      const ocrObject = await DocumentConversionManager.imageToHtml(imageUrl, imageName)
      html = ocrObject?.ParsedResults[0]?.ParsedText
      html = html
        .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
        .replaceAll('\n', '')
        .replaceAll('\r', '')
        .replaceAll(' p.x.', 'pm ')
        .replaceAll(' p..', 'pm ')
        .replaceAll(' p.wn', 'pm ')
        .replaceAll(' p.m.', 'pm ')
        .replaceAll(' a.x.', 'am ')
        .replaceAll(' a..', 'am ')
        .replaceAll(' a.wn', 'am ')
        .replaceAll(' a.m.', 'am ')
        .replaceAll(' .', '. ')
        .replaceAll('Triday', 'Friday')
      html = await StringManager.typoCorrection(html)
    }
    //#endregion IMAGE CONVERSION

    //#region DOCUMENT CONVERSION
    if (docType === 'document') {
      if (fileExtension === 'pdf') {
        await FirebaseStorage.uploadByPath(`${FirebaseStorage.directories.documents}/${currentUser.key}/${docNameToUse}`, doc)
        const docHtml = await DocumentConversionManager.pdfToHtml(docNameToUse, currentUser?.key)
        let firebaseStorageFileName = StringManager.formatFileName(docNameToUse)
        await storeTextInFirebase(docHtml, firebaseStorageFileName)
      } else {
        // Image
        await FirebaseStorage.uploadByPath(`${FirebaseStorage.directories.documents}/${currentUser.key}/${docNameToUse}`, doc)
        const docHtml = await DocumentConversionManager.docToHtml(docNameToUse, currentUser?.key)
        let firebaseStorageFileName = StringManager.formatFileName(docNameToUse)
        await storeTextInFirebase(docHtml, firebaseStorageFileName)
      }
    }
    //#endregion DOCUMENT CONVERSION

    //#region ADD TO DB / SEND NOTIFICATION
    // Add to user documents object
    let fileUrl = imageUrl
    if (!Manager.isValid(fileUrl, true)) {
      fileUrl = await FirebaseStorage.getFileUrl(FirebaseStorage.directories.documents, currentUser?.key, docNameToUse)
    }
    const newDocument = new Doc()
    newDocument.url = fileUrl
    newDocument.docText = html
    newDocument.ownerKey = currentUser?.key
    newDocument.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
    newDocument.type = docType
    newDocument.name = StringManager.formatFileName(docNameToUse)
    const cleanedDoc = ObjectManager.cleanObject(newDocument, ModelNames.doc)
    await DocumentsManager.addToDocumentsTable(currentUser, cleanedDoc)

    // Send Notification
    if (Manager.isValid(shareWith)) {
      await NotificationManager.sendToShareWith(
        shareWith,
        currentUser,
        `New Document`,
        `${StringManager.getFirstNameOnly(currentUser.name)} has uploaded a new document`,
        ActivityCategory.documents
      )
    }
    //#endregion ADD TO DB / SEND NOTIFICATION

    ResetForm('Document Uploaded!')
  }

  const storeTextInFirebase = async (txt, fileName) => {
    const storage = getStorage()
    const storageRef = ref(storage, `${FirebaseStorage.directories.documents}/${currentUser?.key}/${fileName}`)

    // Upload the string
    uploadString(storageRef, txt, 'raw')
      .then(() => {
        console.log('Uploaded a raw string!')
      })
      .catch((error) => {
        console.error('Error uploading string:', error)
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
      () => {},
      false
    )
  }

  return (
    <Modal
      className="upload-document-card"
      wrapperClass="upload-document-modal"
      onSubmit={upload}
      submitText={'Upload'}
      showCard={creationFormToShow === CreationForms.documents}
      title={'Upload Document'}
      onClose={ResetForm}>
      <div className="upload-doc-wrapper">
        <Spacer height={10} />
        {/* PAGE CONTAINER */}
        <div id="upload-documents-container" className={`${theme}`}>
          {/* FORM */}
          <div className="form">
            <InputWrapper labelText={'Document Name'} inputType={InputTypes.text} onChange={(e) => setDocName(e.target.value)} />
            <CheckboxGroup
              parentLabel={'Document Type'}
              required={true}
              checkboxArray={Manager.buildCheckboxGroup({currentUser, customLabelArray: ['Document', 'Image']})}
              onCheck={handleCheckboxSelection}
            />
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          </div>
          {/* UPLOAD BUTTONS */}
          <UploadInputs
            containerClass={`${theme} new-document-card`}
            actualUploadButtonText={'Upload'}
            uploadButtonText={docType === 'document' ? 'Document' : 'Choose'}
            uploadType={docType}
            getImages={(input) => setDoc(input.target.files[0])}
          />
        </div>
      </div>
    </Modal>
  )
}