import React, { useState, useEffect, useContext, Fragment } from 'react'
import CheckboxGroup from '@shared/checkboxGroup'
import Manager from '@manager'
import globalState from '../context'

export default function CoparentInputs({ add, coparentsLength = 1 }) {
  const { state, setState } = useContext(globalState)
  const [date, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [parentType, setParentType] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

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
      <p id="coparent-label">Co-Parent #{coparentsLength}</p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" className="coparent-date" onChange={(e) => setName(e.target.value)} />
      <label>
        Phone Number <span className="asterisk">*</span>
      </label>
      <input className="coparent-phone" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
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
            if (date.length == 0 || phone.length === 0 || parentType.length === 0) {
              setState({ ...state, showAlert: true, alertMessage: 'Please enter required fields', alertType: 'error' })
              return false
            }
            setShowAddButton(false)
            add({ date, phone, parentType })
          }}>
          Add <span className="material-icons">check</span>
        </button>
      )}
    </div>
  )
}
