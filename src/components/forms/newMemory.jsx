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
import AlertManager from "../../managers/alertManager"
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

      // App State
      const [images, setImages] = useState([])

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
            setState({...state, isLoading: false, currentScreen: ScreenNames.memories, creationFormToShow: ""})
      }

      const Upload = async () => {
            setState({...state, isLoading: true, creationFormToShow: null})
            const shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)

            //#region Validation
            const validAccounts = currentUser?.sharedDataUsers?.length

            if (!Manager.IsValid(validAccounts)) {
                  AlertManager.throwError(
                        `No ${currentUser?.accountType === "parent" ? "co-parents or children" : "parents"} to \n share memories with`,
                        `You have not added any ${currentUser?.accountType === "parent" ? "co-parent or child" : "parent"} contacts to your profile. It is also possible they have closed their profile.`
                  )
                  setState({...state, isLoading: false})
                  return false
            }

            if (Manager.IsValid(validAccounts) && !Manager.IsValid(shareWith)) {
                  AlertManager.throwError("Please choose who you would like to share this memory with")
                  setState({...state, isLoading: false})
                  return false
            }

            Manager.ValidateFormProperty(images, "image", false, "Please choose an image")
            // if (!Manager.IsValid(images)) {
            //     AlertManager.throwError('Please choose an image')
            //     setState({...state, isLoading: false})
            //     return false
            // }

            const notAnImage = Object.entries(images).some((x) => {
                  return x[1].name.includes(".doc")
            })

            if (notAnImage) {
                  AlertManager.throwError("Files uploaded MUST be images (.png, .jpg, .jpeg, etc.)")
                  setState({...state, isLoading: false})
                  return false
            }

            //#endregion Validation

            let compressedImages = []

            // Compress images
            for (let img of images) {
                  compressedImages.push(await ImageManager.compressImage(img))
            }

            // Check for existing memory
            const validImgArray = DatasetManager.GetValidArray(compressedImages)

            for (let img of validImgArray) {
                  if (Manager.IsValid(img?.title, true)) {
                        const existingMemory = memories.find((x) => x?.id === img?.id)
                        if (Manager.IsValid(existingMemory)) {
                              AlertManager.throwError("This memory already exists")
                              setState({...state, isLoading: false})
                              return false
                        }
                  }
            }

            const clean = ObjectManager.CleanObject(formRef.current)

            // Upload Image
            await Storage.uploadMultiple(`${Storage.directories.memories}/`, currentUser?.key, compressedImages)
                  .then(() => {})
                  .finally(async () => {
                        // Add memories to 'memories' property for currentUser
                        await Storage.getUrlsFromFiles(Storage.directories.memories, currentUser?.key, compressedImages)
                              .then(async (urls) => {
                                    // Add to user memories object
                                    for (const url of urls) {
                                          const imageName = Storage.GetImageNameFromUrl(url)
                                          clean.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
                                          clean.url = url
                                          clean.title = StringManager.FormatTitle(formRef?.current?.title ?? imageName, true)
                                          clean.owner = {
                                                key: currentUser?.key,
                                                name: currentUser?.name,
                                          }

                                          // Add to Database
                                          await DB.Add(`${DB.tables.memories}/${currentUser?.key}`, memories, clean)
                                    }

                                    // Send Notification
                                    await UpdateManager.SendToShareWith(
                                          clean.shareWith,
                                          currentUser,
                                          `New Memory`,
                                          `${StringManager.GetFirstNameOnly(currentUser?.name)} has uploaded a new memory!`,
                                          ActivityCategory.memories
                                    )
                              })
                              .catch((error) => {
                                    setState({...state, isLoading: false})
                              })
                              .finally(async () => {
                                    await AppManager.SetAppBadge(1)
                                    ResetForm()
                                    MyConfetti.fire()
                              })
                  })
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
                        <InputField
                              onChange={(e) => (formRef.current.notes = e.target.value)}
                              inputType={InputTypes.textarea}
                              placeholder={"Notes"}
                        />
                        <div id="new-memory-form-container" className={`${theme}`}>
                              <Spacer height={5} />
                              {/* UPLOAD BUTTON */}
                              <UploadButton
                                    containerClass={`${theme} new-memory-card`}
                                    uploadType={"image"}
                                    actualUploadButtonText={"Upload"}
                                    getImages={(input) => {
                                          setImages(input.target.files)
                                    }}
                                    uploadButtonText={`Choose`}
                                    upload={() => {}}
                              />
                        </div>
                  </div>
            </Form>
      )
}