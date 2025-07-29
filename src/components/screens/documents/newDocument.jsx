// Path: src\components\screens\documents\newDocument.jsx
import {getStorage, ref, uploadString} from "firebase/storage"
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import Form from "../../../components/shared/form"
import CreationForms from "../../../constants/creationForms"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import ActivityCategory from "../../../constants/updateCategory"
import globalState from "../../../context"
import Storage from "../../../database/storage"
import useChildren from "../../../hooks/useChildren"
import useCoParents from "../../../hooks/useCoParents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useDocuments from "../../../hooks/useDocuments"
import useUsers from "../../../hooks/useUsers"
import AlertManager from "../../../managers/alertManager"
import DatasetManager from "../../../managers/datasetManager"
import DocumentConversionManager from "../../../managers/documentConversionManager.js"
import DocumentsManager from "../../../managers/documentsManager"
import DropdownManager from "../../../managers/dropdownManager"
import ImageManager from "../../../managers/imageManager"
import LogManager from "../../../managers/logManager"
import Manager from "../../../managers/manager.js"
import ObjectManager from "../../../managers/objectManager"
import StringManager from "../../../managers/stringManager"
import UpdateManager from "../../../managers/updateManager"
import Doc from "../../../models/new/doc"
import FormDivider from "../../shared/formDivider"
import InputField from "../../shared/inputField"
import SelectDropdown from "../../shared/selectDropdown"
import Spacer from "../../shared/spacer"
import UploadButton from "../../shared/uploadButton"

export default function NewDocument() {
    const {state, setState} = useContext(globalState)
    const {theme, creationFormToShow} = state

    // FORM STATE
    const [docType, setDocType] = useState()
    const [docName, setDocName] = useState("")
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

    const ResetForm = (successMessage = "") => {
        Manager.ResetForm("upload-doc-wrapper")
        setDocType(null)
        setDoc(null)
        setState({
            ...state,
            isLoading: false,
            creationFormToShow: "",
            bannerMessage: successMessage,
            currentScreen: ScreenNames.docsList,
        })
    }

    const Upload = async () => {
        try {
            setState({...state, isLoading: true})
            if (doc === null || doc === undefined) {
                AlertManager.throwError("Please choose a file to upload")
                setState({...state, isLoading: false})
                return false
            }

            let docNameToUse = ""

            if (!Manager.IsValid(docName, true)) {
                docNameToUse = docName
            } else {
                let formattedDocName = StringManager.FormatTitle(docName?.replaceAll(" ", ""), true)
                docNameToUse = `${StringManager.FormatTitle(formattedDocName)}`
            }

            //#region VALIDATION
            if (
                !Manager.Validate({
                    value: docType,
                    title: "No Document Type Selected",
                    errorMessage: "Please choose a type for this document",
                })
            ) {
                setState({...state, isLoading: false})
                return false
            }

            // Check for existing document
            const existingDocument = documents.find((doc) => doc?.documentName === docName && doc?.ownerKey === currentUser.key)
            if (Manager.IsValid(existingDocument)) {
                AlertManager.throwError("Document has already been uploaded")
                setState({...state, isLoading: false})
                return false
            }
            //#endregion VALIDATION

            let imageUrl = ""
            let documentUrl = ""
            let docText = ""

            //#region UPLOAD IMAGE TO FIREBASE STORAGE
            if (docType === "image") {
                try {
                    const compressedDoc = await ImageManager.compressImage(doc)
                    let firebaseStorageFileName = StringManager.FormatTitle(doc?.name || `Document_${moment().format("MM_DD_YYYY")}`, true)

                    // Upload to Firebase Storage
                    imageUrl = await Storage.UploadByPath(`${Storage.directories.documents}/${currentUser.key}`, doc, firebaseStorageFileName)
                } catch (error) {
                    console.log(error)
                    AlertManager.throwError("Unable to process image. Please try again after awhile.")
                    setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
                    return false
                }
            }
            //#endregion UPLOAD IMAGE TO FIREBASE STORAGE

            //#region UPLOAD DOCUMENT TO FIREBASE STORAGE
            if (docType === "document") {
                documentUrl = await Storage.UploadByPath(`${Storage.directories.documents}/${currentUser.key}`, doc, docNameToUse)
                const docToHTMLResponse = await fetch(documentUrl)
                const blob = await docToHTMLResponse.blob()
                if (!Manager.IsValid(blob)) return false
                docText = await DocumentConversionManager.GetTextFromDocx(blob)
            }

            //#endregion UPLOAD DOCUMENT TO FIREBASE STORAGE

            //#region ADD TO DB / SEND NOTIFICATION
            const shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)

            // Add to user documents object
            const newDocument = new Doc()
            newDocument.url = docType?.toLowerCase() === "image" ? imageUrl : documentUrl
            newDocument.shareWith = DatasetManager.GetValidArray(shareWith, true)
            newDocument.type = docType
            newDocument.documentName = StringManager.FormatTitle(docName, true)
            newDocument.owner = {
                name: currentUser?.name,
                key: currentUser?.key,
            }

            console.log(newDocument)

            const cleanedDoc = ObjectManager.CleanObject(newDocument)

            // Add to Firebase Realtime Database
            await DocumentsManager.AddToDocumentsTable(currentUser, documents, cleanedDoc)

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
            //#endregion ADD TO DB / SEND NOTIFICATION

            // await Storage.deleteFile(`${Storage.directories.documents}/${currentUser?.key}/${StringManager.FormatTitle(docNameToUse)}`)

            ResetForm("Document Uploaded!")
        } catch (error) {
            console.log(error)
            AlertManager.throwError("Unable to upload document. Please try again after awhile.")
            setState({...state, isLoading: false})
            return false
        }
    }

    const UploadRawDocumentText = async (txt, fileName) => {
        const storage = getStorage()
        const storageRef = ref(storage, `${Storage.directories.documents}/${currentUser?.key}/${fileName}`)

        // Upload the string
        uploadString(storageRef, txt, "raw")
            .then(() => {
                console.log("Uploaded a raw string!")
            })
            .catch((error) => {
                console.error("Error uploading string:", error)
                LogManager.Log(
                    `Error: ${error} | Code File: newDocument | Function: StoreTextInFirebase | File: ${fileName} | User: ${currentUser?.key}`
                )
            })
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
            hasSubmitButton={doc !== null && doc !== undefined}
            submitText={"Upload"}
            showCard={creationFormToShow === CreationForms.documents}
            title={"Upload Document"}
            onClose={() => ResetForm()}>
            <div className="upload-doc-wrapper">
                {/* PAGE CONTAINER */}
                <div id="upload-documents-container" className={`${theme}`}>
                    <FormDivider text={"Optional"} />

                    <Spacer height={5} />

                    {/* SHARE WITH */}
                    <SelectDropdown
                        options={defaultShareWithOptions}
                        selectMultiple={true}
                        placeholder={"Select Contacts to Share With"}
                        onSelect={setSelectedShareWithOptions}
                    />

                    <Spacer height={5} />

                    <InputField placeholder={"Document Name"} inputType={InputTypes.text} onChange={(e) => setDocName(e.target.value)} />

                    <FormDivider text={"Required"} />

                    {/* DOCUMENT TYPE */}
                    <SelectDropdown
                        options={[
                            {label: "Document", value: "document"},
                            {label: "Image", value: "image"},
                        ]}
                        placeholder={"Select Document Type"}
                        onSelect={(e) => setDocType(e.value)}
                    />

                    <Spacer height={5} />

                    {/* UPLOAD BUTTONS */}
                    {Manager.IsValid(docType) && (
                        <UploadButton
                            containerClass={`${theme} new-document-card`}
                            buttonText={`Select ${StringManager.UppercaseFirstLetterOfAllWords(docType)}`}
                            uploadType={docType}
                            callback={(input) => {
                                const {selectedFile, fileName, size} = input
                                setDocName(fileName)
                                setDoc(selectedFile)
                            }}
                        />
                    )}
                </div>
            </div>
        </Form>
    )
}