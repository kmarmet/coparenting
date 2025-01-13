import React, { useContext, useState } from 'react'
import globalState from '../context'
import Manager from '../managers/manager'
import phone from 'phone'

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
import AlertManager from '../managers/alertManager'
import ChildUser from '../models/child/childUser'
import InputWrapper from '../components/shared/inputWrapper'
import General from '../models/child/general'

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
      <InputWrapper inputType={'input'} labelText={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
      <InputWrapper inputType={'input'} inputValueType="number" labelText={'Phone Number'} onChange={(e) => setUserPhone(e.target.value)} />
      {showAddButton && name.length > 0 && (
        <button
          className="button default green"
          onClick={() => {
            if (name.length == 0) {
              AlertManager.throwError('Please enter required fields')
              return false
            }
            if (userPhone.length > 0) {
              if (!validatePhone(userPhone)) {
                AlertManager.throwError('Phone number is not valid')
                return false
              }
            }
            const child = new ChildUser()
            child.general = new General()
            child.id = Manager.getUid()
            child.general.name = name
            child.general.phone = userPhone
            add(child)
            setShowAddButton(false)
          }}>
          Save {uppercaseFirstLetterOfAllWords(name)}
        </button>
      )}
    </div>
  )
}