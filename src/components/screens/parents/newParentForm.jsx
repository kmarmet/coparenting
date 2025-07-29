// Path: src\components\screens\parents\newParentForm.jsx
import React, {useContext, useState} from "react"
import validator from "validator"
import InputTypes from "../../../constants/inputTypes"
import ModelNames from "../../../constants/modelNames"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB_UserScoped from "../../../database/db_userScoped"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useUsers from "../../../hooks/useUsers"
import AlertManager from "../../../managers/alertManager"
import Manager from "../../../managers/manager"
import ObjectManager from "../../../managers/objectManager"
import StringManager from "../../../managers/stringManager"
import Parent from "../../../models/users/parent"
import AddressInput from "../../shared/addressInput"
import Form from "../../shared/form"
import FormDivider from "../../shared/formDivider"
import InputField from "../../shared/inputField"
import Label from "../../shared/label"
import SelectDropdown from "../../shared/selectDropdown"
import Spacer from "../../shared/spacer"
import ToggleButton from "../../shared/toggleButton"

const NewParentForm = ({showCard, hideCard}) => {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const {users} = useUsers()
    const {currentUser} = useCurrentUser()
    const [parentHasAccount, setParentHasAccount] = useState(false)

    // State
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [email, setEmail] = useState("")
    const [parentType, setParentType] = useState("")

    const ResetForm = (successMessage = "") => {
        Manager.ResetForm("new-parent-wrapper")
        setName("")
        setAddress("")
        setEmail("")
        setParentType("")
        setState({...state, refreshKey: Manager.GetUid(), bannerMessage: successMessage})
        hideCard()
    }

    const ThrowError = (title, message = "") => {
        AlertManager.throwError(title, message)
        setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
        return false
    }

    const Submit = async () => {
        // Email
        if ((!validator?.isEmail(email) || !Manager.IsValid(email)) && parentHasAccount) ThrowError("Please enter a valid email")

        // If parent has an account -> email is required
        if (parentHasAccount && !Manager.IsValid(email)) ThrowError("If the parent has an account with us, their email is required")
        const existingParent = users.find((x) => x?.email === email)

        let newParent = new Parent()
        newParent.email = email
        newParent.id = Manager.GetUid()
        newParent.address = address
        newParent.name = StringManager.UppercaseFirstLetterOfAllWords(name.trim())
        newParent.parentType = parentType
        newParent.userKey = Manager.GetUid()

        // Link parent with an existing user/profile
        if (Manager.IsValid(existingParent) || parentHasAccount) {
            newParent.id = Manager.GetUid()
            newParent.userKey = existingParent?.key
            newParent.phone = existingParent?.phone
            newParent.email = existingParent?.email
            await DB_UserScoped.AddSharedDataUser(currentUser, existingParent.key)
        }
        // Create new parent
        else {
            await DB_UserScoped.AddSharedDataUser(currentUser, newParent.userKey)
        }

        const cleanParent = ObjectManager.GetModelValidatedObject(newParent, ModelNames.parent)
        try {
            await DB_UserScoped.AddParent(currentUser, cleanParent)
        } catch (error) {
            console.log(error)
            // LogManager.Log(error.message, LogManager.LogTypes.error)
        }
        ResetForm(`${StringManager.GetFirstNameOnly(name)} Added!`)
    }

    return (
        <Form
            onSubmit={Submit}
            submitText={name.length > 0 ? `Add ${StringManager.UppercaseFirstLetterOfAllWords(name)}` : "Add"}
            title={`Add ${Manager.IsValid(name, true) ? StringManager.UppercaseFirstLetterOfAllWords(name) : "Co-Parent"} to Your Profile`}
            wrapperClass="new-parent-card"
            showCard={showCard}
            onClose={() => ResetForm()}>
            <div className="new-parent-wrapper">
                <Spacer height={5} />
                <div id="new-parent-container" className={`${theme}`}>
                    <div className="new-parent-form">
                        <FormDivider text={"Required"} />

                        <InputField inputType={InputTypes.text} required={true} placeholder={"Name"} onChange={(e) => setName(e.target.value)} />

                        <FormDivider text={"Optional"} />

                        <InputField
                            inputType={InputTypes.email}
                            inputValueType="email"
                            required={parentHasAccount}
                            placeholder={"Email Address"}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <AddressInput
                            placeholder={"Home Address"}
                            onChange={(place) => {
                                setAddress(place)
                            }}
                        />

                        <div className="flex">
                            <Label text={"Parent has an Account with Us"} />
                            <ToggleButton onCheck={() => setParentHasAccount(true)} onUncheck={() => setParentHasAccount(false)} />
                        </div>

                        <Spacer height={5} />

                        {/* PARENT TYPE */}
                        <SelectDropdown
                            onSelect={(e) => setParentType(e.label)}
                            placeholder={"Parent Type"}
                            options={[
                                {label: "Biological", value: "Biological"},
                                {label: "Step-Parent", value: "Step-Parent"},
                                {label: "Guardian", value: "Guardian"},
                                {label: "Foster", value: "Foster"},
                                {label: "Adoptive", value: "Adoptive"},
                            ]}
                        />
                    </div>
                </div>
            </div>
        </Form>
    )
}

export default NewParentForm