// Path: src\components\forms\newMemoryForm.jsx
import moment from "moment"
import React, {useContext, useEffect, useRef, useState} from "react"
import creationForms from "../../constants/creationForms"
import DatetimeFormats from "../../constants/datetimeFormats"
import InputTypes from "../../constants/inputTypes"
import ScreenNames from "../../constants/screenNames"
import ActivityCategory from "../../constants/updateCategory"
import globalState from "../../context"
import DB from "../../database/DB"
import Storage from "../../database/storage"
import useChildren from "../../hooks/useChildren"
import useCoParents from "../../hooks/useCoParents"
import useCurrentUser from "../../hooks/useCurrentUser"
import useMemories from "../../hooks/useMemories"
import useUsers from "../../hooks/useUsers"
import AppManager from "../../managers/appManager"
import DatasetManager from "../../managers/datasetManager"
import DropdownManager from "../../managers/dropdownManager"
import ImageManager from "../../managers/imageManager"
import Manager from "../../managers/manager"
import ObjectManager from "../../managers/objectManager"
import StringManager from "../../managers/stringManager"
import UpdateManager from "../../managers/updateManager"
import Memory from "../../models/new/memory"
import Form from "../shared/form"
import FormDivider from "../shared/formDivider"
import InputField from "../shared/inputField"
import MyConfetti from "../shared/myConfetti"
import SelectDropdown from "../shared/selectDropdown"
import Spacer from "../shared/spacer"
import UploadButton from "../shared/uploadButton"

export default function NewMemory() {
    const {state, setState} = useContext(globalState)
    const {theme, creationFormToShow} = state

    // Component State
    const [images, setImages] = useState([])
    const [isUploading, setIsUploading] = useState(false)

    // Hooks
    const {currentUser} = useCurrentUser()
    const {memories} = useMemories()
    const {users} = useUsers()
    const {children} = useChildren()
    const {coParents} = useCoParents()

    // Dropdown State
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState(DropdownManager.GetSelected.ShareWithFromKeys([], users))
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])

    // Form Ref
    const formRef = useRef({...new Memory()})

    const ResetForm = () => {
        Manager.ResetForm("new-memory-wrapper")
        setIsUploading(false)
        setState({...state, isLoading: false, currentScreen: ScreenNames.memories, creationFormToShow: ""})
    }

    const ThrowError = (title, message = "") => {
        setIsUploading(false)
        setState({...state, isLoading: false, bannerTitle: title, bannerMessage: message, bannerType: "error"})
        return false
    }

    const Upload = async () => {
        setIsUploading(true)

        // setLoading(true)
        const shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
        const validAccounts = currentUser?.sharedDataUserKeys?.length

        //#region VALIDATION
        // ✅ Validation helper

        // ✅ Validation Checks

        if (validAccounts === 0)
            ThrowError(
                `No ${currentUser?.accountType === "parent" ? "co-parents or children" : "parents"} to \n share memories with`,
                `You have not added any ${currentUser?.accountType === "parent" ? "co-parent or child" : "parent"} contacts to your profile. It is also possible they have closed their profile.`
            )

        // Shared With
        if (!Manager.IsValid(shareWith)) return ThrowError("Unable to Share", "Please choose who you would like to share this memory with")

        // Images
        if (!Manager.IsValid(images)) return ThrowError("Unable to Upload", "Please choose at least one image")

        // Not an image
        const notAnImage = Object.values(images).some((file) => file?.name?.includes(".doc"))
        if (notAnImage) return ThrowError("Files uploaded MUST be images (.png, .jpg, .jpeg, etc.)")
        //#endregion VALIDATION

        // ✅ Compress Images
        const compressedImages = await Promise.all(images.map((img) => ImageManager.compressImage(img)))
        const validImgArray = DatasetManager.GetValidArray(compressedImages)

        // ✅ Check for existing memories
        const duplicate = validImgArray.some((img) => {
            if (Manager.IsValid(img?.title, true)) {
                return memories.some((m) => m?.id === img?.id)
            }
            return false
        })

        if (duplicate) return fail("This memory already exists")

        const clean = ObjectManager.CleanObject(formRef.current)

        try {
            // ✅ Upload & Get URLs
            await Storage.uploadMultiple(`${Storage.directories.memories}/`, currentUser?.key, compressedImages)
            const urls = await Storage.getUrlsFromFiles(Storage.directories.memories, currentUser?.key, compressedImages)

            // ✅ Save memories in DB
            for (const url of urls) {
                const imageName = Storage.GetImageNameFromUrl(url)

                console.log(imageName)
                const memoryData = {
                    ...clean,
                    shareWith: DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions),
                    url,
                    title: StringManager.FormatTitle(formRef?.current?.title ?? imageName, true),
                    owner: {
                        key: currentUser?.key,
                        name: currentUser?.name,
                    },
                }

                await DB.Add(`${DB.tables.memories}/${currentUser?.key}`, memories, memoryData)
            }

            // ✅ Send Notifications
            await UpdateManager.SendToShareWith(
                clean.shareWith,
                currentUser,
                `New Memory`,
                `${StringManager.GetFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
                ActivityCategory.memories
            )

            // ✅ Post-process UI
            await AppManager.SetAppBadge(1)
            ResetForm()
            setTimeout(() => {
                MyConfetti.fire()
            }, 500)
        } catch (error) {
            console.error("Upload error:", error)
            setIsUploading(false)
        }
    }

    const SetDropdownOptions = () => {
        setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
    }

    useEffect(() => {
        if (Manager.IsValid(children) && Manager.IsValid(coParents) && Manager.IsValid(users)) {
            SetDropdownOptions()
        }
    }, [children, coParents, users])

    return (
        <Form
            onSubmit={Upload}
            wrapperClass="new-memory"
            submitText={"Upload"}
            showLoadingSpinner={isUploading}
            title={"Share Memory"}
            onClose={() => ResetForm()}
            showCard={creationFormToShow === creationForms.memories}>
            <div className="new-memory-wrapper">
                <FormDivider text={"Required"} />
                {/* SHARE WITH */}
                <SelectDropdown
                    required={true}
                    options={defaultShareWithOptions}
                    selectMultiple={true}
                    value={selectedShareWithOptions}
                    placeholder={"Select Contacts to Share With"}
                    onSelect={setSelectedShareWithOptions}
                />

                <FormDivider text={"Optional"} />

                {/* TITLE */}
                <InputField
                    inputType={InputTypes.text}
                    placeholder={"Title"}
                    onChange={(e) => {
                        formRef.current.title = e.target.value
                    }}
                />
                <Spacer height={5} />
                {/* DATE */}
                <InputField
                    uidClass="memory-capture-date-uid"
                    placeholder={"Capture Date"}
                    inputType={InputTypes.date}
                    onDateOrTimeSelection={(e) => {
                        formRef.current.captureDate = moment(e).format(DatetimeFormats.dateForDb)
                    }}
                />
                <Spacer height={5} />
                {/* NOTES */}
                <InputField onChange={(e) => (formRef.current.notes = e.target.value)} inputType={InputTypes.textarea} placeholder={"Notes"} />
                <div id="new-memory-form-container" className={`${theme}`}>
                    <Spacer height={5} />
                    {/* UPLOAD BUTTON */}
                    <UploadButton
                        containerClass={`${theme} new-memory-card`}
                        uploadType={"image"}
                        actualUploadButtonText={"Upload"}
                        callback={(fileObj) => setImages([fileObj?.selectedFile])}
                        uploadButtonText={`Choose`}
                    />
                </div>
            </div>
        </Form>
    )
}