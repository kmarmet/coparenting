import React, { useContext, useState } from 'react'
import Label from './label.jsx'
import DomManager from '../../managers/domManager.coffee'
import Manager from '../../managers/manager.js'
import globalState from '../../context.js'

export default function Checkbox({ defaultLabels, text, onClick, wrapperClass = '', dataPhone, dataDate, dataLabel }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, refreshKey } = state
  const toggleActive = (e) => {
    const checkboxWrapper = e.currentTarget
    const label = checkboxWrapper.querySelector('#label-wrapper')
    const checkbox = checkboxWrapper.querySelector('#checkbox')
    DomManager.toggleActive(label)
    DomManager.toggleActive(checkbox)
    DomManager.toggleAnimateClass(checkbox)
    const labelText = checkbox.nextSibling.textContent
    onClick(e.currentTarget)
  }
  return (
    <div
      key={refreshKey}
      data-phone={dataPhone}
      data-label={dataLabel}
      data-date={dataDate}
      className={`${Manager.isValid(defaultLabels) && defaultLabels.includes(text) ? 'active' : ''} ${wrapperClass}`}
      id="checkbox-wrapper"
      onClick={toggleActive}>
      <span id="checkbox" className={`${Manager.isValid(defaultLabels) && defaultLabels.includes(text) ? 'active' : ''}`}></span>
      <Label classes={`${Manager.isValid(defaultLabels) && defaultLabels.includes(text) ? 'active' : ''}`} text={text} />
    </div>
  )
}