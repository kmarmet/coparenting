// Path: src\components\screens\parents\newParentForm.jsx
import React, {useContext, useState} from 'react'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import ModelNames from '../../../constants/modelNames'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import Parent from '../../../models/users/parent'
import AddressInput from '../../shared/addressInput'
import CheckboxGroup from '../../shared/checkboxGroup'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

const NewParentForm = ({showCard, hideCard}) => {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {users} = useUsers()
  const {currentUser} = useCurrentUser()
  const [parentHasAccount, setParentHasAccount] = useState(false)

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [parentType, setParentType] = useState('')

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-parent-wrapper')
    setName('')
    setAddress('')
    setEmail('')
    setParentType('')
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
    hideCard()
  }

  const Submit = async () => {
    if ((!validator.isEmail(email) || !Manager.IsValid(email)) && parentHasAccount) {
      AlertManager.throwError('Email address is not valid')
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {
        name: 'Name',
        value: name,
      },
    ])
    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }
    if (parentHasAccount && !Manager.IsValid(email)) {
      AlertManager.throwError('If the parent has an account with us, their email is required')
      return false
    }
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
      await DB_UserScoped.addSharedDataUser(currentUser, existingParent.key)
    }
    // Create new parent
    else {
      await DB_UserScoped.addSharedDataUser(currentUser, newParent.userKey)
    }

    const cleanParent = ObjectManager.GetModelValidatedObject(newParent, ModelNames.parent)
    try {
      await DB_UserScoped.AddParent(currentUser, cleanParent)
    } catch (error) {
      console.log(error)
      // LogManager.Log(error.message, LogManager.LogTypes.error)
    }
    await ResetForm(`${StringManager.GetFirstNameOnly(name)} Added!`)
  }

  const HandleParentType = (e) => {
    const type = e.dataset['key']
    DomManager.HandleCheckboxSelection(
      e,
      () => {
        console.log(type)
        setParentType(type)
      },
      () => {
        setParentType('')
      }
    )
  }

  return (
    <Form
      onSubmit={Submit}
      submitText={name.length > 0 ? `Add ${StringManager.UppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.IsValid(name, true) ? StringManager.UppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} to Your Profile`}
      wrapperClass="new-parent-card"
      showCard={showCard}
      onClose={ResetForm}>
      <div className="new-parent-wrapper">
        <Spacer height={5} />
        <div id="new-parent-container" className={`${theme} form`}>
          <div className="form new-parent-form">
            <InputField inputType={InputTypes.text} required={true} placeholder={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputField
              inputType={InputTypes.email}
              inputValueType="email"
              required={parentHasAccount}
              placeholder={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AddressInput
              placeholder={'Home Address'}
              onChange={(place) => {
                setAddress(place)
              }}
            />

            <div className="flex">
              <Label text={'Parent has an Account with Us'} />
              <ToggleButton onCheck={() => setParentHasAccount(true)} onUncheck={() => setParentHasAccount(false)} />
            </div>

            <Spacer height={5} />

            {/* PARENT TYPE */}
            <CheckboxGroup
              parentLabel={'Parent Type'}
              className="parent-type"
              skipNameFormatting={true}
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Foster', 'Adoptive'],
              })}
              onCheck={HandleParentType}
            />
          </div>
        </div>
      </div>
    </Form>
  )
}

export default NewParentForm