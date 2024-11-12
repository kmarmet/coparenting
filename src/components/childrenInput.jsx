import React, { useContext, useState } from 'react'
import globalState from '../context'
import Manager from '@manager'
import phone from 'phone'

import {
  contains,
  displayAlert,
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
import ChildUser from '../models/child/childUser'

export default function ChildrenInput({ add, childrenCount }) {
  const { state, setState } = useContext(globalState)
  const [name, setName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    return isValid
  }

  return (
    <div id="child-input-container">
      <p id="child-label">
        Child #{childrenCount} {`- ${uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" autoComplete="off" onChange={(e) => setName(e.target.value)} />
      <label>Phone Number</label>
      <input type="phone" inputMode="numeric" onChange={(e) => setUserPhone(e.target.value)} />
      {showAddButton && (
        <button
          className="button default green"
          onClick={() => {
            if (name.length == 0) {
              displayAlert('error', 'Please enter required fields')
              return false
            }
            if (userPhone.length > 0) {
              if (!validatePhone(userPhone)) {
                displayAlert('error', 'Phone number is not valid')
                return false
              }
            }
            const child = new ChildUser()
            child.id = Manager.getUid()
            child.general.name = name
            child.general.phone = userPhone
            add(child)
            setShowAddButton(false)
          }}>
          Add Child
          <span className="material-icons">check</span>
        </button>
      )}
    </div>
  )
}
