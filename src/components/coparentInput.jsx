import React, { useState, useEffect, useContext, Fragment } from 'react'
import CheckboxGroup from '@shared/checkboxGroup'
import Manager from '@manager'
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

export default function CoparentInputs({ add, coparentsLength = 1 }) {
  const { state, setState } = useContext(globalState)
  const [name, setName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [parentType, setParentType] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    return isValid
  }

  const handleCoparentType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setParentType(e)
      },
      (e) => {},
      false
    )
  }

  return (
    <div id="coparent-input-container">
      <p id="coparent-label">
        Co-Parent #{coparentsLength} {`- ${uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" className="coparent-name" onChange={(e) => setName(e.target.value)} />
      <label>
        Phone Number <span className="asterisk">*</span>
      </label>
      <input className="coparent-phone" type="phone" inputMode="numeric" onChange={(e) => setUserPhone(e.target.value)} />
      <CheckboxGroup
        boxWidth={50}
        className="coparent-type"
        labels={['Step-Parent', 'Biological Parent', "Spouse's Coparent"]}
        onCheck={handleCoparentType}
      />
      {showAddButton && (
        <button
          className="button default green"
          onClick={() => {
            if (name.length == 0 || userPhone.length === 0 || parentType.length === 0) {
              displayAlert('error', 'Please enter required fields')
              return false
            }
            if (name.length == 0 || userPhone.length === 0) {
              displayAlert('error', 'Parent name and phone are required')
              return false
            }
            if (!validatePhone()) {
              displayAlert('error', 'Please enter a valid phone number')
              return false
            }
            setShowAddButton(false)
            add({ name, userPhone, parentType })
          }}>
          Add Co-Parent <span className="material-icons">check</span>
        </button>
      )}
    </div>
  )
}
