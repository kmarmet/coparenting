// Path: src\components\screens\childInfo\newChildForm.jsx
import moment from "moment"
import React, {useContext, useRef, useState} from "react"
import DatetimeFormats from "../../../constants/datetimeFormats"
import HiddenDataLabels from "../../../constants/hiddenDataLabels"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB_UserScoped from "../../../database/db_userScoped"
import Storage from "../../../database/storage"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useUsers from "../../../hooks/useUsers"
import AlertManager from "../../../managers/alertManager"
import CalendarManager from "../../../managers/calendarManager"
import ImageManager from "../../../managers/imageManager"
import Manager from "../../../managers/manager"
import ObjectManager from "../../../managers/objectManager"
import StringManager from "../../../managers/stringManager.js"
import Child from "../../../models/child/child"
import CustomInfoEntry from "../../../models/child/customInfoEntry"
import CalendarEvent from "../../../models/new/calendarEvent"
import AddressInput from "../../shared/addressInput"
import Form from "../../shared/form"
import FormDivider from "../../shared/formDivider"
import InputField from "../../shared/inputField"
import Label from "../../shared/label"
import Spacer from "../../shared/spacer"
import ToggleButton from "../../shared/toggleButton"
import UploadButton from "../../shared/uploadButton"

const NewChildForm = ({hideCard, showCard}) => {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const {currentUser} = useCurrentUser()
    const {users} = useUsers()

    // State
    const [childHasAccount, setChildHasAccount] = useState(false)

    const newChild = useRef({...new Child()})

    const ThrowError = (message) => {
        AlertManager.throwError(message)
        setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
        return false
    }

    const ResetForm = (bannerMessage = "") => {
        Manager.ResetForm("new-child-wrapper")
        hideCard()
        setChildHasAccount(false)
        setState({...state, refreshKey: Manager.GetUid(), bannerMessage: bannerMessage})
    }

    const Submit = async () => {
        //#region VALIDATION

        // Child Name
        if (!Manager.IsValid(newChild.current.name, true)) return ThrowError("Please enter a name")

        // If child has an account -> email is required
        if (childHasAccount && !Manager.IsValid(newChild.current.email)) ThrowError("If the child has an account with us, their email is required")
        //#endregion VALIDATION

        let _profilePic = newChild.current.profilePic
        newChild.current.profilePic = ""

        if (childHasAccount) {
            newChild.current.userKey = Manager.GetUid()
        }

        const details = []

        for (let prop in newChild.current) {
            if (!HiddenDataLabels.includes(prop) && prop.toLowerCase() !== "details") {
                const newEntry = new CustomInfoEntry({
                    label: StringManager.FormatTitle(prop, true),
                    value: newChild.current[prop],
                    dataType: (typeof newChild.current[prop]).replace("string", "text"),
                    category: "general",
                })
                details.push(newEntry)
            }
        }

        newChild.current.details = details

        const existingChildRecord = users.find((x) => x?.email === newChild.current.email)

        // Link to existing account
        if (Manager.IsValid(existingChildRecord) || childHasAccount || !ObjectManager.IsEmpty(existingChildRecord)) {
            newChild.userKey = existingChildRecord.key
            await DB_UserScoped.AddSharedDataUser(currentUser, existingChildRecord.key)
        } else {
            await DB_UserScoped.AddSharedDataUser(currentUser, newChild.userKey)
        }

        // Add profile pic
        if (Manager.IsValid(_profilePic)) {
            _profilePic = await ImageManager.compressImage(newChild.current.profilePic)
            if (Manager.IsValid(_profilePic)) {
                await Storage.upload(Storage.directories.profilePics, `${currentUser?.key}/${newChild.current.id}`, _profilePic, "profilePic").then(
                    async (url) => {
                        if (!Manager.IsValid(url)) {
                            return false
                        }
                        newChild.current.profilePic = url
                    }
                )
            }
        }

        // Get valid objected
        const cleaned = ObjectManager.CleanObject(newChild.current)

        // Add Child's Birthday to Calendar
        if (Manager.IsValid(newChild.current.dateOfBirth, true)) {
            const childBirthdayEvent = new CalendarEvent()
            childBirthdayEvent.title = `${newChild.current.name}'s Birthday`
            childBirthdayEvent.startDate = newChild.current.dateOfBirth
            childBirthdayEvent.ownerKey = currentUser.key
            await CalendarManager.addCalendarEvent(currentUser, childBirthdayEvent)
        }

        // Add child to DB
        await DB_UserScoped.AddChildToParentProfile(currentUser, cleaned)

        ResetForm(`${StringManager.GetFirstNameOnly(StringManager.FormatTitle(name, true))} Added to Your Profile`)
    }

    return (
        <Form
            submitText={`Add ${name?.length > 0 ? name : "Child"}`}
            onSubmit={Submit}
            className="new-child-wrapper"
            wrapperClass="new-child-card"
            title={`Create ${name.length > 0 ? StringManager.GetFirstNameOnly(name) : "Child"} Contact`}
            showCard={showCard}
            onClose={() => ResetForm()}>
            <div id="new-child-container" className={`${theme}`}>
                <div className="new-child-form">
                    <FormDivider text={"Required"} />
                    {/* NAME */}
                    <InputField
                        placeholder={"Name"}
                        inputType={InputTypes.text}
                        required={true}
                        onChange={(e) => (newChild.current.name = StringManager.FormatTitle(e.target.value, true))}
                    />

                    <FormDivider text={"Optional"} />

                    {/* EMAIL */}
                    <InputField
                        placeholder={"Email Address"}
                        required={childHasAccount}
                        inputType={InputTypes.email}
                        onChange={(e) => (newChild.current.email = e.target.value)}
                    />
                    <Spacer height={5} />

                    {/* DATE OF BIRTH */}
                    <InputField
                        dateFormat={"MM/DD/YYYY"}
                        placeholder={"Date of Birth"}
                        dateViews={["year", "month", "day"]}
                        inputType={InputTypes.date}
                        onDateOrTimeSelection={(e) => (newChild.current.dateOfBirth = moment(e).format(DatetimeFormats.monthDayYear))}
                    />

                    <Spacer height={5} />

                    {/* ADDRESS */}
                    <AddressInput placeholder={"Home Address"} onChange={(address) => (newChild.current.address = address)} />
                    <Spacer height={5} />

                    {/* PHONE NUMBER */}
                    <InputField
                        placeholder={"Phone Number"}
                        inputType={InputTypes.phone}
                        required={false}
                        onChange={(e) => (newChild.current.phone = e.target.value)}
                    />

                    <Spacer height={5} />

                    {/* SHOULD LINK CHILD TOGGLE */}
                    <div className="flex">
                        <Label text={"Child Has an Account"} classes={"always-show"} />
                        <ToggleButton onCheck={() => setChildHasAccount(true)} onUncheck={() => setChildHasAccount(false)} />
                    </div>

                    <Spacer height={5} />

                    <Label classes="standalone-label-wrapper always-show" text={"Photo"} />
                    {/* UPLOAD BUTTON */}
                    <UploadButton
                        onClose={hideCard}
                        containerClass={`${theme} new-child-card`}
                        uploadType={"image"}
                        actualUploadButtonText={"Upload"}
                        callback={(files) => {
                            newChild.current.profilePic = files[0]
                        }}
                        uploadButtonText={`Choose`}
                        upload={() => {}}
                    />
                </div>
            </div>
        </Form>
    )
}

export default NewChildForm