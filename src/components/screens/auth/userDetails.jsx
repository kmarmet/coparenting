// Path: src\components\screens\auth\userDetails.jsx
import React, {useContext, useState} from 'react'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import Manager from '../../../managers/manager'
import CheckboxGroup from '../../shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Spacer from '/src/components/shared/spacer'
import AlertManager from '/src/managers/alertManager.js'
import InputTypes from '../../../constants/inputTypes'
import validator from 'validator'

export default function UserDetails() {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const [accountType, setAccountType] = useState('')
  const [name, setName] = useState('')
  const [userPhone, setUserPhone] = useState('')

  const Submit = async () => {
    if (!validator.isMobilePhone(userPhone)) {
      AlertManager.throwError('Phone number is not valid')
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {name: 'Your Name', value: name},
      {name: 'Your Phone Number', value: userPhone},
      {name: 'Profile Type', value: accountType},
    ])
    if (errorString !== '') {
      AlertManager.throwError(errorString)
      return false
    }

    const userObject = {
      phone: userPhone,
      email: authUser?.email,
      accountType,
      name,
      key: authUser?.uid,
    }
    const newUser = await DB_UserScoped.createAndInsertUser(userObject)
    setState({
      ...state,
      currentScreen: accountType === 'parent' ? ScreenNames.calendar : ScreenNames.requestParentAccess,
      currentUser: newUser,
      successAlertMessage: 'Success',
    })
  }

  const HandleAccountType = (type) => {
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
        To increase our efficiency and security, we kindly ask you to provide a few additional details about yourself. The information you enter will
        be secure and utilized only within this application.
      </p>

      <Spacer height={10} />

      <InputWrapper inputType={InputTypes.text} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />

      <InputWrapper inputType={InputTypes.phone} required={true} labelText={'Phone Number'} onChange={(e) => setUserPhone(e.target.value)} />

      <CheckboxGroup
        onCheck={HandleAccountType}
        parentLabel="Profile Type (cannot be changed later)"
        labelText="Profile Type"
        checkboxArray={Manager.buildCheckboxGroup({
          customLabelArray: ['Parent', 'Child'],
        })}
        required={true}
        textOnly={true}
        dataKey={['Parent', 'Child']}
      />

      <Spacer height={15} />
      <button
        className="button default green center"
        onClick={() => {
          AlertManager.confirmAlert('Are the details you provided correct?', 'Yes', 'No', Submit)
        }}>
        Let&apos;s Go!
      </button>
    </div>
  )
}