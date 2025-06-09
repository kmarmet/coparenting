// Path: src\components\coparentInput.jsx
import React, {useContext, useState} from 'react'
import validator from 'validator'
import CheckboxGroup from '.../..//shared/checkboxGroup'
import globalState from '../context'
import AlertManager from '../managers/alertManager'
import StringManager from '../managers/stringManager'

export default function CoparentInputs({add, coparentsLength = 1}) {
  const {state, setState} = useContext(globalState)
  const [name, setName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [parentType, setParentType] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  const handleCoparentType = (e) => {
    DomManager.HandleCheckboxSelection(
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
        Co-Parent #{coparentsLength} {`- ${StringManager.uppercaseFirstLetterOfAllWords(name)}`}
      </p>
      <InputField inputType={'input'} placeholder={'Name'} required={true} onChange={(e) => setName(e.target.value)} />
      <InputField
        inputType={'input'}
        inputValueType="number"
        placeholder={'Phone Number'}
        required={true}
        onChange={(e) => setUserPhone(e.target.value)}
      />
      <CheckboxGroup
        parentLabel={name.length > 0 ? `${StringManager.uppercaseFirstLetterOfAllWords(name)}'s Parent Type` : 'Parent Type'}
        className="coparent-type"
        skipNameFormatting={true}
        checkboxLabels={['Step-Parent', 'Biological Parent', "Partner's Co-Parent"]}
        onCheck={handleCoparentType}
      />
      {showAddButton && name.length > 0 && userPhone.length > 0 && parentType.length > 0 && (
        <button
          className="button default green"
          onClick={() => {
            if (parentType.length === 0) {
              AlertManager.throwError('Please select a Parent Type')
              return false
            }
            if (name.length == 0 || userPhone.length === 0) {
              AlertManager.throwError('Parent name and phone are required')
              return false
            }
            if (!validator.isMobilePhone(userPhone)) {
              AlertManager.throwError('Phone number is not valid')
              return false
            }
            setShowAddButton(false)
            add({name, phone: userPhone, parentType})
          }}>
          Save {StringManager.uppercaseFirstLetterOfAllWords(name)}
        </button>
      )}
    </div>
  )
}