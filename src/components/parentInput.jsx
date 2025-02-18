// Path: src\components\parentInput.jsx
import React, { useContext, useState } from 'react'
import globalState from '../context'
import { phone } from 'phone'
import AlertManager from '../managers/alertManager'
import InputWrapper from './shared/inputWrapper'
import { RiUserAddLine } from 'react-icons/ri'
import StringManager from '../managers/stringManager'
export default function ParentInput({ add, parentsLength = 1, labels }) {
  const { state, setState } = useContext(globalState)
  const [userPhone, setUserPhone] = useState('')
  const [name, setName] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${StringManager.formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    return isValid
  }

  return (
    <div id="parent-input-container">
      <p id="parent-label">
        Parent #{parentsLength} {`- ${StringManager.uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <InputWrapper inputType={'input'} labelText={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
      <InputWrapper
        inputType={'input'}
        inputValueType="number"
        labelText={'Phone Number'}
        required={true}
        onChange={(e) => setUserPhone(e.target.value)}
      />
      {showAddButton && (
        <button
          className="button center default green"
          onClick={() => {
            if (name.length == 0 || userPhone.length === 0) {
              AlertManager.throwError('Parent name and phone are required')
              return false
            }
            if (!validatePhone()) {
              AlertManager.throwError('Please enter a valid phone number')
              return false
            }

            add({ name, phone: userPhone })
            setShowAddButton(false)
          }}>
          Add <RiUserAddLine />
        </button>
      )}
    </div>
  )
}
