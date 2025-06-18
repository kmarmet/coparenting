// Path: src\components\parentInput.jsx
import {phone} from 'phone'
import React, {useContext, useState} from 'react'
import {RiUserAddLine} from 'react-icons/ri'
import globalState from '../context'
import AlertManager from '../managers/alertManager'
import StringManager from '../managers/stringManager'
import InputField from './shared/inputField'

export default function ParentInput({add, parentsLength = 1, labels}) {
  const {state, setState} = useContext(globalState)
  const [userPhone, setUserPhone] = useState('')
  const [name, setName] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${StringManager.FormatPhone(userPhone)}`)
    const {isValid} = validatePhone
    return isValid
  }

  return (
    <div id="parent-input-container">
      <p id="group-label">
        Parent #{parentsLength} {`- ${StringManager.UppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <InputField inputType={'input'} placeholder={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
      <InputField
        inputType={'input'}
        inputValueType="number"
        placeholder={'Phone Number'}
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

            add({name, phone: userPhone})
            setShowAddButton(false)
          }}>
          Add <RiUserAddLine />
        </button>
      )}
    </div>
  )
}