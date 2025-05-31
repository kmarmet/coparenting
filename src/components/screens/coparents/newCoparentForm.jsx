// Path: src\components\screens\coparents\newCoparentForm.jsx
import CheckboxGroup from '../../shared/checkboxGroup'
import Form from '../../shared/form'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import Manager from '../../../managers/manager'
import Coparent from '../../../models/users/coparent'
import React, {useContext, useState} from 'react'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import ModelNames from '../../../constants/modelNames'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import DomManager from '../../../managers/domManager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import AddressInput from '../../shared/addressInput'
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

const NewCoparentForm = ({showCard, hideCard}) => {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [parentType, setParentType] = useState('')
  const [coparentHasAccount, setCoparentHasAccount] = useState(false)

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-coparent-wrapper')
    setName('')
    setAddress('')
    setEmail('')
    setParentType('')
    setCoparentHasAccount(false)
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
    hideCard()
  }

  const Submit = async () => {
    if (!validator.isEmail(email) && coparentHasAccount) {
      AlertManager.throwError('Email address is not valid')
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {
        label: 'Name',
        value: name,
      },
      {
        label: 'Parent Type',
        value: parentType,
      },
    ])

    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }

    if (coparentHasAccount && !Manager.IsValid(email)) {
      AlertManager.throwError('If the coparent has an account with us, their email is required')
      return false
    }

    const existingCoparentRecord = users.find((x) => x?.email === email)
    let newCoparent = new Coparent()
    newCoparent.id = Manager.GetUid()
    newCoparent.address = address
    newCoparent.name = StringManager.uppercaseFirstLetterOfAllWords(name.trim())
    newCoparent.parentType = parentType
    newCoparent.email = email
    newCoparent.userKey = Manager.GetUid()
    newCoparent.phone = existingCoparentRecord?.phone

    // Link to existing account
    if (Manager.IsValid(existingCoparentRecord)) {
      newCoparent.userKey = existingCoparentRecord.key
      await DB_UserScoped.addSharedDataUser(currentUser, existingCoparentRecord.key)
    }

    // Create new account
    else {
      await DB_UserScoped.addSharedDataUser(currentUser, newCoparent.userKey)
    }

    const cleanCoparent = ObjectManager.GetModelValidatedObject(newCoparent, ModelNames.coparent)
    try {
      await DB_UserScoped.addCoparent(currentUser, cleanCoparent)
    } catch (error) {
      console.log(error)
      // LogManager.Log(error.message, LogManager.LogTypes.error)
    }
    await ResetForm(`${StringManager.GetFirstNameOnly(name)} Added!`)
  }

  const HandleCoparentType = (e) => {
    const type = e.dataset['key']
    DomManager.HandleCheckboxSelection(
      e,
      () => {
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
      submitText={name.length > 0 ? `Add ${StringManager.uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.IsValid(name, true) ? StringManager.uppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} Contact`}
      wrapperClass="new-coparent-card"
      showCard={showCard}
      onClose={ResetForm}>
      <div className="new-coparent-wrapper">
        <Spacer height={5} />
        <div id="new-coparent-container" className={`${theme} form`}>
          <div className="form new-coparent-form">
            <InputWrapper inputType={InputTypes.text} required={true} placeholder={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.email}
              inputValueType="email"
              required={coparentHasAccount}
              placeholder={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AddressInput placeholder={'Home Address'} onChange={(address) => setAddress(address)} />

            <div className="flex">
              <Label text={'Co-Parent has an Account with Us'} />
              <ToggleButton onCheck={() => setCoparentHasAccount(true)} onUncheck={() => setCoparentHasAccount(false)} />
            </div>

            <Spacer height={5} />

            {/* PARENT TYPE */}
            <CheckboxGroup
              parentLabel={'Parent Type'}
              className="coparent-type"
              skipNameFormatting={true}
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Other'],
              })}
              onCheck={HandleCoparentType}
            />
          </div>
        </div>
      </div>
    </Form>
  )
}

export default NewCoparentForm