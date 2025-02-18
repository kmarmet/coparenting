// Path: src\components\screens\auth\userDetails.jsx
import React, { useContext, useState } from 'react'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import Manager from '../../../managers/manager'
import CheckboxGroup from '../../shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Spacer from '/src/components/shared/spacer'
import AlertManager from '/src/managers/alertManager.js'
import StringManager from '../../../managers/stringManager'
import phone from 'phone'

export default function UserDetails() {
  const { state, setState } = useContext(globalState)
  const { authUser, registrationUserName } = state
  const [accountType, setAccountType] = useState('')
  const [userPhone, setUserPhone] = useState('')

  const validatePhone = () => {
    const validatePhone = phone(`+1${StringManager.formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    return isValid
  }

  const submit = async () => {
    if (!validatePhone(userPhone)) {
      AlertManager.throwError('Phone number is not valid')
      return false
    }
    if (accountType === '') {
      AlertManager.throwError('Please select an account type')
      return false
    }
    if (userPhone === '') {
      AlertManager.throwError('Please enter a phone number')
      return false
    }
    const userObject = {
      phone: userPhone,
      email: authUser.email,
      accountType,
      key: authUser.uid,
    }
    const newUser = await DB_UserScoped.createAndInsertUser(userObject)
    AlertManager.successAlert('Success!')
    setState({ ...state, currentScreen: ScreenNames.calendar, currentUser: newUser })
  }

  const handleAccountType = (type) => {
    Manager.handleCheckboxSelection(
      type,
      (type) => {
        setAccountType(type)
      },
      () => {},
      false
    )
  }

  return (
    <div id="user-details" className="page-container user-details">
      <p className="screen-title">Almost Done!</p>
      <p>
        Please provide a just a couple more details about yourself to increase our efficiency and security. The information you enter is secure, and
        will only used inside this app.
      </p>

      <Spacer height={10} />

      <CheckboxGroup
        onCheck={handleAccountType}
        parentLabel="Account Type (cannot be changed later)"
        labelText="Account Type"
        checkboxLabels={['Parent', 'Child']}
        required={true}
        textOnly={true}
        dataKey={['Parent', 'Child']}
      />

      <Spacer height={5} />

      <InputWrapper
        inputType={'input'}
        inputValueType="number"
        required={true}
        labelText={'Phone Number'}
        onChange={(e) => setUserPhone(e.target.value)}
      />
      <Spacer height={15} />
      <button
        className="button default green has-bg center"
        onClick={() => {
          AlertManager.confirmAlert('Are the details you provided correct?', 'Yes', 'No', submit)
        }}>
        Let&apos;s Go!
      </button>
    </div>
  )
}