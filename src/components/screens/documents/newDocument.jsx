// Path: src\components\screens\documents\newDocument.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import UploadInputs from '/src/components/shared/uploadInputs'
import FirebaseStorage from '/src/database/firebaseStorage'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import DocumentConversionManager from '/src/managers/documentConversionManager.js'
import DocumentsManager from '/src/managers/documentsManager'
import ImageManager from '/src/managers/imageManager'
import Manager from '/src/managers/manager.js'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import UpdateManager from '/src/managers/updateManager'
import ActivityCategory from '/src/models/activityCategory'
import Doc from '/src/models/doc'
import ModelNames from '/src/models/modelNames'
import {getStorage, ref, uploadString} from 'firebase/storage'
import React, {useContext, useState} from 'react'
import CreationForms from '../../../constants/creationForms'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useDocuments from '../../../hooks/useDocuments'
import DomManager from '../../../managers/domManager'
import LogManager from '../../../managers/logManager'
import Spacer from '../../shared/spacer'

export default function NewDocument() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [docName, setDocName] = useState('')
  const [doc, setDoc] = useState()
  const {currentUser} = useCurrentUser()
  const {documents} = useDocuments()

  const ResetForm = (successMessage = '') => {
    Manager.ResetForm('upload-doc-wrapper')
    setShareWith([])
    setDocType(null)
    setDoc(null)
    setState({
      ...state,
      refreshKey: Manager.GetUid(),
      isLoading: false,
      creationFormToShow: '',
      successAlertMessage: successMessage,
      currentScreen: ScreenNames.docsList,
    })
  }

  const Upload = async () => {
    if (!doc) {
      AlertManager.throwError('Please choose a file to upload')
      return false
    }
    const fileExtension = StringManager.GetFileExtension(doc?.name).toString()
    let docNameToUse = `${docName}.${fileExtension}`

    if (!Manager.IsValid(docName, true)) {
      docNameToUse = doc?.name
    }

    //#region VALIDATION
    if (!Manager.IsValid(docType)) {
      AlertManager.throwError('Please choose a document type')
      return false
    }

    // if (docType === 'document' && Object.entries(files).map((x) => !Manager.Contains(x[1].name, '.docx'))[0]) {
    //   AlertManager.throwError('Uploaded file MUST be of type .docx')
    //   setState({ ...state, isLoading: false })
    //   return false
    // }

    // Check for existing document
    const existingDocument = documents.find((doc) => doc?.name === docName && doc?.ownerKey === currentUser.key)
    if (Manager.IsValid(existingDocument)) {
      AlertManager.throwError('Document has already been uploaded')
      return false
    }
    //#endregion VALIDATION

    setState({...state, isLoading: true, loadingText: 'Making the magic happen!'})
    let html = ''
    let imageUrl = ''
    let docText = ''

    //#region IMAGE CONVERSION
    if (docType === 'image') {
      try {
        if (!Manager.IsValid(imageUrl, true)) {
          imageUrl = await FirebaseStorage.GetFileUrl(FirebaseStorage.directories.documents, currentUser?.key, docNameToUse)
        }
        const compressedDoc = await ImageManager.compressImage(doc)
        let firebaseStorageFileName = StringManager.formatFileName(docNameToUse)
        // Upload to Firebase Storage
        imageUrl = await FirebaseStorage.uploadByPath(
          `${FirebaseStorage.directories.documents}/${currentUser?.key}/${firebaseStorageFileName}`,
          compressedDoc
        )
        const imageName = FirebaseStorage.GetImageNameFromUrl(imageUrl)
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
        const test = await StringManager.typoCorrection(html).then()
        // html = await StringManager.typoCorrection(html).then()
      } catch (error) {
        console.log(error)
        AlertManager.throwError('Unable to process image. Please try again after awhile.')
        setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
        return false
      }
    }
    //#endregion IMAGE CONVERSION

    //#region DOCUMENT CONVERSION
    if (docType === 'document') {
      await FirebaseStorage.uploadByPath(`${FirebaseStorage.directories.documents}/${currentUser.key}/${docNameToUse}`, doc)
      let firebaseStorageFileName = StringManager.formatFileName(docNameToUse)
      docText = await DocumentConversionManager.DocToHtml(docNameToUse, currentUser?.key)
      await UploadDocToFirebaseStorage(docText, firebaseStorageFileName)
    }

    //#endregion DOCUMENT CONVERSION

    //#region ADD TO DB / SEND NOTIFICATION

    // Add to user documents object

    const newDocument = new Doc()
    newDocument.url = imageUrl
    newDocument.docText = docText
    newDocument.ownerKey = currentUser?.key
    newDocument.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
    newDocument.type = docType
    newDocument.name = StringManager.formatFileName(docNameToUse)

    if (Manager.IsValid(newDocument.docText, true)) {
      const cleanedDoc = ObjectManager.GetModelValidatedObject(newDocument, ModelNames.doc)
      console.log(cleanedDoc)
      await DocumentsManager.AddToDocumentsTable(currentUser, documents, newDocument)

      // Send Notification
      if (Manager.IsValid(shareWith)) {
        await UpdateManager.SendToShareWith(
          shareWith,
          currentUser,
          `New Document`,
          `${StringManager.GetFirstNameOnly(currentUser?.name)} has uploaded a new document`,
          ActivityCategory.documents
        )
      }
    }
    //#endregion ADD TO DB / SEND NOTIFICATION

    await FirebaseStorage.deleteFile(`${FirebaseStorage.directories.documents}/${currentUser?.key}/${StringManager.formatFileName(docNameToUse)}`)

    ResetForm('Document Uploaded!')
  }

  const UploadDocToFirebaseStorage = async (txt, fileName) => {
    const storage = getStorage()
    const storageRef = ref(storage, `${FirebaseStorage.directories.documents}/${currentUser?.key}/${fileName}`)

    // Upload the string
    uploadString(storageRef, txt, 'raw')
      .then(() => {
        console.log('Uploaded a raw string!')
      })
      .catch((error) => {
        console.error('Error uploading string:', error)
        LogManager.Log(`Error: ${error} | Code File: newDocument | Function: StoreTextInFirebase | File: ${fileName} | User: ${currentUser?.key}`)
      })
  }

  const HandleShareWithSelection = (e) => {
    const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const HandleCheckboxSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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
      onSubmit={Upload}
      submitText={'Upload'}
      showCard={creationFormToShow === CreationForms.documents}
      title={'Upload Document'}
      onClose={ResetForm}>
      <div className="upload-doc-wrapper">
        <Spacer height={5} />
        {/* PAGE CONTAINER */}
        <div id="upload-documents-container" className={`${theme}`}>
          {/* FORM */}
          <div className="form">
            <InputWrapper labelText={'Document Name'} inputType={InputTypes.text} onChange={(e) => setDocName(e.target.value)} />
            <CheckboxGroup
              parentLabel={'Document Type'}
              required={true}
              checkboxArray={DomManager.BuildCheckboxGroup({currentUser, customLabelArray: ['Document', 'Image']})}
              onCheck={HandleCheckboxSelection}
            />
            <ShareWithCheckboxes required={false} onCheck={HandleShareWithSelection} containerClass={'share-with-coparents'} />
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