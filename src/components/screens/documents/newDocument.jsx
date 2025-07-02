// Path: src\components\screens\documents\newDocument.jsx
import {getStorage, ref, uploadString} from 'firebase/storage'
import React, {useContext, useEffect, useState} from 'react'
import Form from '../../../components/shared/form'
import ActivityCategory from '../../../constants/activityCategory'
import CreationForms from '../../../constants/creationForms'
import InputTypes from '../../../constants/inputTypes'
import ModelNames from '../../../constants/modelNames'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import Storage from '../../../database/storage'
import useChildren from '../../../hooks/useChildren'
import useCoParents from '../../../hooks/useCoParents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useDocuments from '../../../hooks/useDocuments'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import DocumentConversionManager from '../../../managers/documentConversionManager.js'
import DocumentsManager from '../../../managers/documentsManager'
import DomManager from '../../../managers/domManager'
import DropdownManager from '../../../managers/dropdownManager'
import ImageManager from '../../../managers/imageManager'
import LogManager from '../../../managers/logManager'
import Manager from '../../../managers/manager.js'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import UpdateManager from '../../../managers/updateManager'
import Doc from '../../../models/new/doc'
import FormDivider from '../../shared/formDivider'
import InputField from '../../shared/inputField'
import SelectDropdown from '../../shared/selectDropdown'
import Spacer from '../../shared/spacer'
import UploadButton from '../../shared/uploadButton'

export default function NewDocument() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [shareWith, setShareWith] = useState([])
  const [docType, setDocType] = useState(null)
  const [docName, setDocName] = useState('')
  const [doc, setDoc] = useState()

  // HOOKS
  const {documents} = useDocuments()
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()
  const {coParents} = useCoParents()
  const {children, childrenDropdownOptions} = useChildren()

  // Dropdown State
  const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
  const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
  const [selectedDocType, setSelectedDocType] = useState([])
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
          imageUrl = await Storage.GetFileUrl(Storage.directories.documents, currentUser?.key, docNameToUse)
        }
        const compressedDoc = await ImageManager.compressImage(doc)
        let firebaseStorageFileName = StringManager.FormatTitle(docNameToUse, true)
        // Upload to Firebase Storage
        imageUrl = await Storage.uploadByPath(`${Storage.directories.documents}/${currentUser?.key}/${firebaseStorageFileName}`, compressedDoc)
        const imageName = Storage.GetImageNameFromUrl(imageUrl)
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
      await Storage.uploadByPath(`${Storage.directories.documents}/${currentUser.key}/${docNameToUse}`, doc)
      let firebaseStorageFileName = StringManager.FormatTitle(docNameToUse, true)
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
    newDocument.name = StringManager.FormatTitle(docNameToUse)

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

    await Storage.deleteFile(`${Storage.directories.documents}/${currentUser?.key}/${StringManager.FormatTitle(docNameToUse)}`)

    ResetForm('Document Uploaded!')
  }

  const UploadDocToFirebaseStorage = async (txt, fileName) => {
    const storage = getStorage()
    const storageRef = ref(storage, `${Storage.directories.documents}/${currentUser?.key}/${fileName}`)

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
  const SetDefaultDropdownOptions = () => {
    setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
    setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
  }

  useEffect(() => {
    if (Manager.IsValid(children) || Manager.IsValid(users)) {
      SetDefaultDropdownOptions()
    }
  }, [children, coParents])
  return (
    <Form
      className="upload-document-card"
      wrapperClass="upload-document-form"
      onSubmit={Upload}
      submitText={'Upload'}
      showCard={creationFormToShow === CreationForms.documents}
      title={'Upload Document'}
      onClose={() => ResetForm()}>
      <div className="upload-doc-wrapper">
        {/* PAGE CONTAINER */}
        <div id="upload-documents-container" className={`${theme}`}>
          <FormDivider text={'Optional'} />

          <Spacer height={3} />

          {/* SHARE WITH */}
          <SelectDropdown
            options={defaultShareWithOptions}
            selectMultiple={true}
            placeholder={'Select Contacts to Share With'}
            onSelect={setSelectedShareWithOptions}
          />

          <Spacer height={3} />

          <InputField placeholder={'Document Name'} inputType={InputTypes.text} onChange={(e) => setDocName(e.target.value)} />

          <FormDivider text={'Required'} />

          {/* DOCUMENT TYPE */}
          <SelectDropdown
            options={[
              {label: 'Document', value: 'document'},
              {label: 'Image', value: 'image'},
            ]}
            placeholder={'Select Document Type'}
            onSelect={setSelectedDocType}
          />

          <Spacer height={3} />

          {/* UPLOAD BUTTONS */}
          <UploadButton
            containerClass={`${theme} new-document-card`}
            actualUploadButtonText={'Upload'}
            uploadButtonText={docType === 'document' ? 'Document' : 'Choose'}
            uploadType={docType}
            getImages={(input) => setDoc(input.target.files[0])}
          />
        </div>
      </div>
    </Form>
  )
}