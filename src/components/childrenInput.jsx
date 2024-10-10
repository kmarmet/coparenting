import React, { useState, useEffect, useContext, Fragment } from 'react'
import globalState from '../context'
import Child from '../models/child/child'
import Manager from '@manager'

export default function ChildrenInput({ add, childrenCount }) {
  const { state, setState } = useContext(globalState)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showAddButton, setShowAddButton] = useState(true)
  return (
    <div id="child-input-container">
      <p id="child-label">Child #{childrenCount}</p>
      <label>
        Name <span className="asterisk">*</span>
      </label>
      <input type="text" autoComplete="off" onChange={(e) => setName(e.target.value)} />
      <label>Phone Number</label>
      <input type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
      {showAddButton && (
        <button
          className="button default green"
          onClick={() => {
            if (name.length == 0) {
              setState({ ...state, showAlert: true, alertMessage: 'Please enter required fields', alertType: 'error' })
              return false
            }
            if (phone.length > 0) {
              if (!Manager.phoneNumberIsValid(phone)) {
                setState({ ...state, showAlert: true, alertMessage: 'Phone number is not valid', alertType: 'error' })
                return false
              }
            }
            const child = new Child()
            child.id = Manager.getUid()
            child.general.name = name
            child.general.phone = phone
            add(child)
            setShowAddButton(false)
          }}>
          Add <span className="material-icons">check</span>
        </button>
      )}
    </div>
  )
}
