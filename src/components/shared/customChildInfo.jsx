// Path: src\components\shared\customChildInfo.jsx
import moment from "moment"
import React, {useContext, useEffect, useRef, useState} from "react"
import DatetimeFormats from "../../constants/datetimeFormats"
import InputTypes from "../../constants/inputTypes"
import globalState from "../../context"
import DB_UserScoped from "../../database/db_userScoped"
import useChildren from "../../hooks/useChildren"
import useCoParents from "../../hooks/useCoParents"
import useCurrentUser from "../../hooks/useCurrentUser"
import useUsers from "../../hooks/useUsers"
import AlertManager from "../../managers/alertManager"
import DropdownManager from "../../managers/dropdownManager"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import UpdateManager from "../../managers/updateManager"
import AddressInput from "./addressInput"
import Form from "./form"
import FormDivider from "./formDivider"
import InputField from "./inputField"
import SelectDropdown from "./selectDropdown"
import Spacer from "./spacer"

const defaultInfoTypes = [
    {label: "Text", value: "text"},
    {label: "Phone", value: "phone"},
    {label: "Location", value: "location"},
    {label: "Email", value: "email"},
]

const defaultSections = [
    {label: "General", value: "general"},
    {label: "Medical", value: "medical"},
    {label: "Schooling", value: "schooling"},
    {label: "Behavior", value: "behavior"},
]

export default function CustomChildInfo({hideCard, showCard, activeChild}) {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // STATE
    const [infoSection, setInfoSection] = useState("general")
    const [view, setView] = useState({label: "Details", value: "Details"})

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {users} = useUsers()
    const {children} = useChildren()
    const {coParents} = useCoParents()

    // DROPDOWN STATE
    const [selectedInfoType, setSelectedInfoType] = useState([{label: "Text", value: "text"}])
    const [defaultInfoTypeOptions, setDefaultInfoTypeOptions] = useState(defaultInfoTypes)
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
    const [selectedCategory, setSelectedCategory] = useState([])

    // Form Ref
    const formRef = useRef({title: "", value: "text", shareWith: []})

    const ThrowError = (title, message = "") => {
        AlertManager.throwError(title, message)
        return false
    }

    const Add = async () => {
        if (!Manager.IsValid(formRef.current.value)) return ThrowError("Please enter a value")
        if (!Manager.IsValid(formRef.current.value) && selectedInfoType?.value === "phone")
            return ThrowError("Invalid Phone Number", "Please enter a valid phone number")

        const shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)

        await DB_UserScoped.AddUserChildProp(
            currentUser,
            activeChild,
            selectedCategory,
            StringManager.toCamelCase(formRef.current.title),
            formRef.current.value,
            shareWith
        )

        if (Manager.IsValid(shareWith)) {
            await UpdateManager.SendToShareWith(
                shareWith,
                currentUser,
                `${StringManager.UppercaseFirstLetterOfAllWords(selectedCategory)} Info Updated for ${activeChild?.general?.name}`,
                `${formRef.current.title} - ${formRef.current.value}`,
                selectedCategory
            )
        }

        ResetForm(`${StringManager.UppercaseFirstLetterOfAllWords(selectedCategory)} Info Added`)
    }

    const ResetForm = (successMessage = "") => {
        Manager.ResetForm("custom-child-info-wrapper")
        setInfoSection("")
        hideCard()
        setState({...state, refreshKey: Manager.GetUid(), bannerMessage: successMessage})
    }

    const SetDefaultDropdownOptions = () => {
        setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith([], coParents))
        setView({label: "Single Day", value: "Single Day"})
    }

    useEffect(() => {
        if (Manager.IsValid(children) || Manager.IsValid(users)) {
            SetDefaultDropdownOptions()
        }
    }, [children, coParents])

    useEffect(() => {
        if (showCard) {
            setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        }
    }, [showCard])

    useEffect(() => {
        console.log(selectedInfoType)
    }, [selectedInfoType])

    return (
        <Form
            onSubmit={Add}
            submitText={"Done"}
            className="custom-child-info-wrapper"
            wrapperClass="custom-child-info-card"
            onClose={() => ResetForm()}
            title={"Add Your Own Info"}
            showCard={showCard}>
            {/* INFO TYPE */}
            <FormDivider text={"Required"} />

            {/* SECTION */}
            <SelectDropdown
                onSelect={(section) => {
                    setSelectedCategory(section?.value)
                }}
                placeholder={"Select Category"}
                options={defaultSections}
            />

            <Spacer height={5} />

            {/* INFO TYPE */}
            <SelectDropdown
                options={defaultInfoTypeOptions}
                placeholder={"Select Information Type"}
                onSelect={(value) => setSelectedInfoType(value?.value)}
            />

            <Spacer height={5} />

            {/* INPUTS */}
            {selectedInfoType?.toString() === "text" && (
                <>
                    {/* TEXT */}
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Title/Label"}
                        required={true}
                        onChange={(e) => (formRef.current.title = e.target.value)}
                    />
                    <Spacer height={5} />
                    {/* VALUE */}
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Value"}
                        required={true}
                        onChange={(e) => (formRef.current.value = e.target.value)}
                    />
                </>
            )}

            {selectedInfoType?.toString() === "email" && (
                <>
                    {/* EMAIL */}
                    <Spacer height={5} />
                    {/* VALUE */}
                    <InputField
                        inputType={InputTypes.email}
                        placeholder={"Email Address"}
                        required={true}
                        onChange={(e) => (formRef.current.value = e.target.value)}
                    />
                </>
            )}

            <Spacer height={5} />

            {/* PHONE */}
            {selectedInfoType?.toString() === "phone" && (
                <>
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Title/Label"}
                        required={true}
                        onChange={(e) => (formRef.current.title = e.target.value)}
                    />
                    <Spacer height={5} />
                    <InputField
                        inputType={InputTypes.phone}
                        placeholder={"Phone Number"}
                        required={true}
                        onChange={(e) => (formRef.current.value = StringManager.FormatPhone(e.target.value))}
                    />
                </>
            )}

            {/* DATE */}
            {selectedInfoType?.toString() === "date" && (
                <div className="w-100">
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Title/Label"}
                        required={true}
                        onChange={(e) => (formRef.current.title = e.target.value)}
                    />
                    <Spacer height={5} />
                    <InputField
                        placeholder={"Date"}
                        required={true}
                        uidClass="child-info-custom-date"
                        inputType={InputTypes.date}
                        onDateOrTimeSelection={(e) => (formRef.current.value = moment(e).format(DatetimeFormats.dateForDb))}
                    />
                </div>
            )}

            {/* LOCATION */}
            {selectedInfoType?.toString() === "location" && (
                <>
                    <InputField
                        inputType={InputTypes.text}
                        placeholder={"Title/Label"}
                        required={true}
                        onChange={(e) => (formRef.current.title = e.target.value)}
                    />
                    <Spacer height={5} />
                    <AddressInput
                        placeholder={"Address"}
                        required={true}
                        onChange={(address) => {
                            formRef.current.value = address
                        }}
                    />
                </>
            )}

            <FormDivider text={"Optional"} />

            {/* SHARE WITH */}
            <SelectDropdown
                options={defaultShareWithOptions}
                selectMultiple={true}
                value={selectedShareWithOptions}
                placeholder={"Select Contacts to Share With"}
                onSelect={setSelectedShareWithOptions}
            />
        </Form>
    )
}