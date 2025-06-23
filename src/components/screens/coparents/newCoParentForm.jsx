// Path: src\components\screens\coparents\newCoparentForm.jsx
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
import AddressInput from '../../shared/addressInput'
import CheckboxGroup from '../../shared/checkboxGroup'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

const NewCoParentForm = ({showCard, hideCard}) => {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [parentType, setParentType] = useState('')
  const [coParentHasAccount, setCoParentHasAccount] = useState(false)

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('new-coparent-wrapper')
    setName('')
    setAddress('')
    setEmail('')
    setParentType('')
    setCoParentHasAccount(false)
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
    hideCard()
  }

  const Submit = async () => {
    if (!validator.isEmail(email) && coParentHasAccount) {
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

    if (coParentHasAccount && !Manager.IsValid(email)) {
      AlertManager.throwError('If the coparent has an account with us, their email is required')
      return false
    }

    const existingCoparentRecord = users.find((x) => x?.email === email)
    let newCoparent = new CoParent()
    newCoparent.id = Manager.GetUid()
    newCoparent.address = address
    newCoparent.name = StringManager.UppercaseFirstLetterOfAllWords(name.trim())
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

  const HandleCoParentType = (e) => {
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
      submitText={name.length > 0 ? `Add ${StringManager.UppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.IsValid(name, true) ? StringManager.UppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} Contact`}
      wrapperClass="new-coparent-card"
      showCard={showCard}
      onClose={() => ResetForm()}>
      <div className="new-coparent-wrapper">
        <Spacer height={5} />
        <div id="new-coparent-container" className={`${theme}`}>
          <div className="new-coparent-form">
            <InputField inputType={InputTypes.text} required={true} placeholder={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputField
              inputType={InputTypes.email}
              inputValueType="email"
              required={coParentHasAccount}
              placeholder={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AddressInput placeholder={'Home Address'} onChange={(address) => setAddress(address)} />

            <div className="flex">
              <Label text={'Co-Parent has an Account with Us'} />
              <ToggleButton onCheck={() => setCoParentHasAccount(true)} onUncheck={() => setCoParentHasAccount(false)} />
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
              onCheck={HandleCoParentType}
            />
          </div>
        </div>
      </div>
    </Form>
  )
}

export default NewCoParentForm