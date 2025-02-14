import React, { useContext, useState } from 'react'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import Manager from '../../../managers/manager'
import CheckboxGroup from '../../shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Spacer from '/src/components/shared/spacer'
import AlertManager from '/src/managers/alertManager.js'

export default function UserDetails() {
  const { state, setState } = useContext(globalState)
  const { currentUser, authUser } = state
  const [accountType, setAccountType] = useState('')
  const [phone, setPhone] = useState('')

  const submit = async () => {
    if (accountType === '') {
      AlertManager.throwError('Please select an account type')
      return
    }
    if (phone === '') {
      AlertManager.throwError('Please enter a phone number')
      return
    }
    const newUser = await DB_UserScoped.createAndInsertUser(authUser.uid, authUser.email, name, phone, accountType)
    AlertManager.successAlert('Success!')
    setState({ ...state, currentScreen: ScreenNames.calendar, currentUser: newUser })
  }

  const handleParentType = (type) => {
    Manager.handleCheckboxSelection(
      type,
      (type) => {
        setAccountType(type)
      },
      (type) => {},
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
        onCheck={(e) => {
          handleParentType(e)
        }}
        parentLabel="Account Type (cannot be changed later)"
        labelText="Account Type"
        checkboxLabels={['Parent', 'Child']}
        required={true}
      />

      <Spacer height={5} />

      <InputWrapper
        inputType={'input'}
        inputValueType="number"
        required={true}
        labelText={'Phone Number'}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Spacer height={15} />
      <button className="button default green has-bg center" onClick={submit}>
        Let's Go!
      </button>
    </div>
  )
}
