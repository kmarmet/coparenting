import Manager from '@manager'
import React, { useContext } from 'react'
import globalState from '../../context'
import { formatNameFirstNameOnly, stringHasNumbers } from '../../globalFunctions'

export default function CheckboxGroup({
  checkboxLabels,
  onCheck,
  containerClass = '',
  elClass = '',
  dataPhone,
  dataDate,
  skipNameFormatting = false,
  defaultLabels,
  labelText = '',
  required = false,
  parentLabel = '',
}) {
  const { state, setState } = useContext(globalState)
  const { theme } = state
  return (
    <div id="checkbox-group" className={`${theme} ${elClass}`}>
      <div id="parent-label-wrapper">
        <label id="parent-label">{parentLabel}</label>
        {required && <span className="asterisk">*</span>}
      </div>
      <div id="checkboxes">
        {Manager.isValid(checkboxLabels, true) &&
          checkboxLabels.map((label, index) => {
            let thisPhone = checkboxLabels[index]
            let thisDate = null
            if (Manager.isValid(dataPhone)) {
              if (Manager.isValid(dataPhone[index])) {
                thisPhone = dataPhone[index]
              }
            }
            if (Manager.isValid(dataDate)) {
              thisDate = dataDate[index]
              if (thisDate !== undefined) {
                thisDate = dataDate[index]
              }
            }
            if (Manager.isValid(label) && !stringHasNumbers(label) && !skipNameFormatting) {
              label = formatNameFirstNameOnly(label.toString())
            }
            return (
              <div
                key={index}
                id="checkbox-container"
                data-phone={thisPhone ? thisPhone : ''}
                data-label={label ? label : ''}
                data-date={thisDate ? thisDate : ''}
                className={`flex ${containerClass}`}
                onClick={(e) => onCheck(e)}>
                <div className={`box ${Manager.isValid(defaultLabels, true) && defaultLabels.includes(label) ? 'active' : ''}`}>
                  <div id="inner-circle"></div>
                </div>
                <span>{label}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}