// Path: src\components\childrenInput.jsx
import phone from 'phone'
import React, {useContext, useState} from 'react'
import InputWrapper from '.../../shared/inputWrapper'
import globalState from '../context'
import AlertManager from '../managers/alertManager'
import Manager from '../managers/manager'

import StringManager from '../managers/stringManager.coffee'
import ChildUser from '../models/child/childUser'

export default function ChildrenInput({add, childrenCount}) {
  const {state, setState} = useContext(globalState)
  const [name, setName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const validatePhone = () => {
    const validatePhone = phone(`+1${StringManager.FormatPhone(userPhone)}`)
    const {isValid} = validatePhone
    return isValid
  }

  return (
    <div id="child-input-container">
      <p id="child-label">
        Child #{childrenCount} {`- ${StringManager.uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <InputField inputType={'input'} placeholder={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
      <InputField inputType={'input'} inputValueType="number" placeholder={'Phone Number'} onChange={(e) => setUserPhone(e.target.value)} />
      {showAddButton && name.length > 0 && (
        <button
          className="button default green"
          onClick={() => {
            if (name.length === 0) {
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
            child.id = Manager.GetUid()
            child.general.name = name
            child.general.phone = userPhone
            add(child)
            setShowAddButton(false)
          }}>
          Save {StringManager.uppercaseFirstLetterOfAllWords(name)}
        </button>
      )}
    </div>
  )
}