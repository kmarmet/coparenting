// Path: src\components\shared\checkbox.jsx
import React, { useContext } from 'react'
import globalState from '../../context.js'
import DomManager from '../../managers/domManager.coffee'
import Label from './label.jsx'
import { GrCheckmark } from 'react-icons/gr'
import { ImCheckmark } from 'react-icons/im'

export default function Checkbox({ isActive, text, onCheck, wrapperClass = '', dataKey, dataDate, dataLabel }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, refreshKey } = state

  const toggleActive = (e) => {
    const checkboxWrapper = e.currentTarget
    DomManager.toggleActive(checkboxWrapper)

    if (onCheck) {
      onCheck(e.currentTarget)
    }
  }

  return (
    <div
      key={refreshKey}
      data-key={dataKey}
      data-label={dataLabel}
      data-date={dataDate}
      className={`checkbox-wrapper ${wrapperClass} ${isActive ? 'active' : ''}`}
      onClick={toggleActive}>
      <div className="checkbox">
        <ImCheckmark />
      </div>
      <p className="checkbox-text">{text}</p>
    </div>
  )
}