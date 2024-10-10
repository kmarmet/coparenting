import React, { useState, useEffect, useContext, Fragment } from 'react'
import CheckboxGroup from '@shared/checkboxGroup'
import globalState from '../context'

export default function ParentInput({ add, parentsLength = 1, labels }) {
  const { state, setState } = useContext(globalState)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)

  return (
    <div id="parent-input-container">
      <p id="parent-label">Parent #{parentsLength}</p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" className="parent-date" onChange={(e) => setName(e.target.value)} />
      <label>
        Phone Number <span className="asterisk">*</span>
      </label>
      <input className="parent-phone" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
      {showAddButton && (
        <button
          className="button center default green"
          onClick={() => {
            if (name.length == 0 || phone.length === 0) {
              setState({ ...state, showAlert: true, alertMessage: 'Parent date and phone are required', alertType: 'error' })
              return false
            }
            add({ name, phone })
            setShowAddButton(false)
          }}>
          Add <span className="material-icons">add</span>
        </button>
      )}
    </div>
  )
}
