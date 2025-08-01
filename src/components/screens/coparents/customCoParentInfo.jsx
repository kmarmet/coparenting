// Path: src\components\screens\coparents\customCoParentInfo.jsx
import _ from "lodash"
import React, {useContext, useState} from "react"
import {FaWandMagicSparkles} from "react-icons/fa6"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB_UserScoped from "../../../database/db_userScoped"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager.coffee"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function CustomCoParentInfo({hideCard, activeCoparent, showCard, onAdd = (coParent) => {}}) {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state
    const [title, setTitle] = useState("")
    const [value, setValue] = useState("")
    const {currentUser} = useCurrentUser()

    const ResetForm = (hasMessage = false) => {
        Manager.ResetForm("custom-coParent-info-wrapper")
        setTitle("")
        setValue("")
        setState({
            ...state,
            refreshKey: Manager.GetUid(),
            bannerMessage: hasMessage ? `${StringManager.UppercaseFirstLetterOfAllWords(title)} Property Added` : null,
        })
        hideCard()
    }

    const Add = async () => {
        if (_.isEmpty(title) || _.isEmpty(value)) {
            AlertManager.throwError("Both fields are required")
            return false
        }
        const updatedCoparent = await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, title, value)
        onAdd(updatedCoparent)
        ResetForm(true)
    }

    return (
        <Form
            submitIcon={<FaWandMagicSparkles />}
            submitText={"Add"}
            onSubmit={Add}
            wrapperClass="custom-coparent-card"
            title={"Add Custom Info"}
            showCard={showCard}
            onClose={() => ResetForm()}>
            <Spacer height={8} />
            <div className="custom-coparent-info-wrapper">
                <InputField
                    hasBottomSpacer={true}
                    inputType={InputTypes.text}
                    required={true}
                    placeholder={"Title/Label"}
                    onChange={(e) => setTitle(StringManager.removeSpecialChars(e.target.value))}
                />
                <InputField inputType={InputTypes.text} required={true} placeholder={"Value"} onChange={(e) => setValue(e.target.value)} />
            </div>
        </Form>
    )
}