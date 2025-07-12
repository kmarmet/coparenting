// Path: src\components\screens\coparents\newCoparentForm.jsx
import React, {useContext, useState} from 'react'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import CoParent from '../../../models/users/coParent'
import AddressInput from '../../shared/addressInput'
import Form from '../../shared/form'
import FormDivider from '../../shared/formDivider'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import SelectDropdown from '../../shared/selectDropdown'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

const NewCoParentForm = ({showCard, hideCard}) => {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const {currentUser} = useCurrentUser()
    const {users} = useUsers()

    // State
    const [coParentHasAccount, setCoParentHasAccount] = useState(false)

    // Ref
    const formRef = React.useRef({...new CoParent()})

    const ResetForm = (successMessage) => {
        Manager.ResetForm('new-coParent-wrapper')
        setCoParentHasAccount(false)
        setTimeout(() => {
            setState({...state, refreshKey: Manager.GetUid()})
        }, 100)
        if (Manager.IsValid(successMessage, true)) {
            setState({...state, successAlertMessage: successMessage})
        }
        hideCard()
    }

    const Submit = async () => {
        formRef.current.userKey = Manager.GetUid()
        if (!validator.isEmail(formRef.current.email) && coParentHasAccount) {
            AlertManager.throwError('Email address is not valid')
            return false
        }
        if (!Manager.IsValid(formRef.current.name, true)) {
            AlertManager.throwError('Please enter a name')
            return false
        }
        if (!Manager.IsValid(formRef.current.parentType, true)) {
            AlertManager.throwError('Please select a parent type')
            return false
        }

        if (coParentHasAccount && !Manager.IsValid(formRef.current.email)) {
            AlertManager.throwError('If the co-parent has an account with us, their email is required')
            return false
        }

        const existingCoParentRecord = users.find((x) => x?.email === formRef.current.email)

        // Link to existing account
        if (Manager.IsValid(existingCoParentRecord) && coParentHasAccount) {
            formRef.current.userKey = existingCoParentRecord.key
            await DB_UserScoped.AddSharedDataUser(currentUser, existingCoParentRecord.key)
        } else {
            const cleanCoParent = ObjectManager.CleanObject(formRef.current)
            await DB_UserScoped.addCoparent(currentUser, cleanCoParent)
            await DB_UserScoped.AddSharedDataUser(currentUser, formRef.current.userKey)
        }

        ResetForm(`${StringManager.GetFirstNameOnly(formRef.current.name)} Added!`)
    }

    return (
        <Form
            onSubmit={Submit}
            submitText={'Create'}
            title={`Create Co-Parent Contact`}
            wrapperClass="new-coParent-card"
            showCard={showCard}
            onClose={() => ResetForm()}>
            <div className="new-coparent-wrapper">
                <div id="new-coparent-container" className={`${theme}`}>
                    <div className="new-coparent-form">
                        <FormDivider text={'Required'} />

                        {/* NAME */}
                        <InputField
                            inputType={InputTypes.text}
                            required={true}
                            placeholder={'Name'}
                            onChange={(e) => (formRef.current.name = e.target.value)}
                        />

                        <Spacer height={3} />

                        {/* PARENT TYPE */}
                        <SelectDropdown
                            placeholder={'Select Parent Type'}
                            options={[
                                {label: 'Biological', value: 'Biological'},
                                {label: 'Step-Parent', value: 'Step-Parent'},
                                {label: 'Guardian', value: 'Guardian'},
                                {label: 'Other', value: 'Other'},
                            ]}
                            onSelect={(e) => {
                                formRef.current.parentType = e.label
                            }}
                        />

                        <FormDivider text={'Optional'} />

                        <div className="flex gap">
                            {/* EMAIL ADDRESS */}
                            <InputField
                                inputType={InputTypes.email}
                                inputValueType="email"
                                required={coParentHasAccount}
                                placeholder={'Email Address'}
                                onChange={(e) => (formRef.current.email = e.target.value)}
                            />

                            {/* PHONE */}
                            <InputField
                                inputType={InputTypes.phone}
                                inputValueType="phone"
                                required={coParentHasAccount}
                                placeholder={'Phone Number'}
                                onChange={(e) => (formRef.current.phone = e.target.value)}
                            />
                        </div>

                        <Spacer height={3} />

                        {/* ADDRESS */}
                        <AddressInput placeholder={'Home Address'} onChange={(address) => (formRef.current.address = address)} />

                        <Spacer height={8} />

                        {/* CO-PARENT HAS AN ACCOUNT WITH US? */}
                        <div className="flex">
                            <Label text={'Co-Parent has an Account with Us'} classes={'always-show'} />
                            <ToggleButton onCheck={() => setCoParentHasAccount(true)} onUncheck={() => setCoParentHasAccount(false)} />
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    )
}

export default NewCoParentForm