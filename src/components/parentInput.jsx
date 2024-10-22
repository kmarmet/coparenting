import React, { useState, useEffect, useContext, Fragment } from 'react'
import CheckboxGroup from '@shared/checkboxGroup'
import globalState from '../context'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  formatPhone,
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'
import { phone } from 'phone'

export default function ParentInput({ add, parentsLength = 1, labels }) {
  const { state, setState } = useContext(globalState)
  const [userPhone, setUserPhone] = useState('')
  const [name, setName] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    return isValid
  }

  return (
    <div id="parent-input-container">
      <p id="parent-label">
        Parent #{parentsLength} {`- ${uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" className="parent-date" onChange={(e) => setName(e.target.value)} />
      <label>
        Phone Number <span className="asterisk">*</span>
      </label>
      <input className="parent-phone" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setUserPhone(e.target.value)} />
      {showAddButton && (
        <button
          className="button center default green"
          onClick={() => {
            if (name.length == 0 || userPhone.length === 0) {
              displayAlert('error', 'Parent name and phone are required')
              return false
            }
            if (!validatePhone()) {
              displayAlert('error', 'Please enter a valid phone number')
              return false
            }

            add({ name, userPhone })
            setShowAddButton(false)
          }}>
          Add <span className="material-icons">add</span>
        </button>
      )}
    </div>
  )
}
