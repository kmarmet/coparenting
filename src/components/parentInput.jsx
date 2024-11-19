import React, { useContext, useState } from 'react'
import globalState from '../context'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  formatPhone,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../globalFunctions'
import { phone } from 'phone'
import AlertManager from '../managers/alertManager'

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
              AlertManager.throwError('Parent name and phone are required')
              return false
            }
            if (!validatePhone()) {
              AlertManager.throwError('Please enter a valid phone number')
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