// Path: src\components\screens\parents\newParentForm.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import AlertManager from '/src/managers/alertManager'
import Manager from '/src/managers/manager'
import React, {useContext, useState} from 'react'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import ModelNames from '../../../models/modelNames'
import Parent from '../../../models/parent'
import AddressInput from '../../shared/addressInput'
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
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: successMessage})
    hideCard()
  }

  const Submit = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {
        name: 'Name',
        value: name,
      },
      {
        name: 'Email',
        value: email,
      },
    ])
    if (Manager.isValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }
    if (parentHasAccount && !Manager.isValid(email)) {
      AlertManager.throwError('If the parent has an account with us, their email is required')
      return false
    }
    const existingParent = users.find((x) => x?.email === email)
    let newParent = new Parent()

    newParent.email = email
    newParent.id = Manager.getUid()
    newParent.address = address
    newParent.name = StringManager.uppercaseFirstLetterOfAllWords(name.trim())
    newParent.parentType = parentType
    newParent.userKey = Manager.getUid()

    // Link parent with an existing user/profile
    if (Manager.isValid(existingParent) || parentHasAccount) {
      newParent.id = Manager.getUid()
      newParent.userKey = existingParent?.key
      newParent.phone = existingParent?.phone
      newParent.email = existingParent?.email
      await DB_UserScoped.addSharedDataUser(currentUser, existingParent.key)
    }
    // Create new parent
    else {
      await DB_UserScoped.addSharedDataUser(currentUser, newParent.userKey)
    }

    const cleanParent = ObjectManager.cleanObject(newParent, ModelNames.parent)
    try {
      await DB_UserScoped.AddParent(currentUser, cleanParent)
    } catch (error) {
      console.log(error)
      // LogManager.Log(error.message, LogManager.LogTypes.error)
    }
    await ResetForm(`${StringManager.getFirstNameOnly(name)} Added!`)
  }

  const HandleParentType = (e) => {
    const type = e.dataset['key']
    Manager.handleCheckboxSelection(
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
    <Modal
      onSubmit={Submit}
      submitText={name.length > 0 ? `Add ${StringManager.uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.isValid(name, true) ? StringManager.uppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} to Your Profile`}
      wrapperClass="new-parent-card"
      showCard={showCard}
      onClose={ResetForm}>
      <div className="new-parent-wrapper">
        <Spacer height={5} />
        <div id="new-parent-container" className={`${theme} form`}>
          <div className="form new-parent-form">
            <InputWrapper inputType={InputTypes.text} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.email}
              inputValueType="email"
              required={parentHasAccount}
              labelText={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AddressInput
              labelText={'Home Address'}
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
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Foster', 'Adoptive'],
              })}
              onCheck={HandleParentType}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default NewParentForm