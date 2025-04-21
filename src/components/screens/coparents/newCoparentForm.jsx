// Path: src\components\screens\coparents\newCoparentForm.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import Coparent from '/src/models/coparent'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import AlertManager from '/src/managers/alertManager'
import validator from 'validator'
import StringManager from '../../../managers/stringManager'
import Spacer from '../../shared/spacer'
import ModelNames from '../../../models/modelNames'
import ObjectManager from '../../../managers/objectManager'
import DB_UserScoped from '../../../database/db_userScoped'
import InputTypes from '../../../constants/inputTypes'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import ToggleButton from '../../shared/toggleButton'
import Label from '../../shared/label'

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
        label: 'Name',
        value: name,
      },
      {
        label: 'Parent Type',
        value: parentType,
      },
    ])

    if (Manager.isValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }

    if (!coparentHasAccount && !Manager.isValid(email)) {
      AlertManager.throwError('If the coparent has an account with us, their email is required')
      return false
    }

    const existingCoparentRecord = users.find((x) => x?.email === email)
    let newCoparent = new Coparent()
    AlertManager.throwError('All fields are required')
    newCoparent.id = Manager.getUid()
    newCoparent.address = address
    newCoparent.name = StringManager.uppercaseFirstLetterOfAllWords(name.trim())
    newCoparent.parentType = parentType
    newCoparent.email = email
    newCoparent.userKey = Manager.getUid()
    newCoparent.phone = existingCoparentRecord?.phone

    // Link to existing account
    if (Manager.isValid(existingCoparentRecord)) {
      newCoparent.userKey = existingCoparentRecord.key
      await DB_UserScoped.addSharedDataUser(currentUser, existingCoparentRecord.key)
    }

    // Create new account
    else {
      await DB_UserScoped.addSharedDataUser(currentUser, newCoparent.userKey)
    }

    const cleanCoparent = ObjectManager.cleanObject(newCoparent, ModelNames.coparent)
    try {
      await DB_UserScoped.addCoparent(currentUser, cleanCoparent)
    } catch (error) {
      console.log(error)
      // LogManager.log(error.message, LogManager.logTypes.error)
    }
    await ResetForm(`${StringManager.getFirstNameOnly(name)} Added!`)
  }

  const HandleCoparentType = (e) => {
    const type = e.dataset['key']
    Manager.handleCheckboxSelection(
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
    <Modal
      onSubmit={Submit}
      submitText={name.length > 0 ? `Add ${StringManager.uppercaseFirstLetterOfAllWords(name)}` : 'Add'}
      title={`Add ${Manager.isValid(name, true) ? StringManager.uppercaseFirstLetterOfAllWords(name) : 'Co-Parent'} to Your Profile`}
      wrapperClass="new-coparent-card"
      showCard={showCard}
      onClose={ResetForm}>
      <div className="new-coparent-wrapper">
        <Spacer height={5} />
        <div id="new-coparent-container" className={`${theme} form`}>
          <div className="form new-coparent-form">
            <InputWrapper inputType={InputTypes.text} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />
            <InputWrapper
              inputType={InputTypes.email}
              inputValueType="email"
              required={coparentHasAccount}
              labelText={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputWrapper
              inputType={InputTypes.address}
              labelText={'Home Address'}
              onChange={(place) => {
                setAddress(place)
              }}
            />

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
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Biological', 'Step-Parent', 'Guardian', 'Other'],
              })}
              onCheck={HandleCoparentType}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default NewCoparentForm