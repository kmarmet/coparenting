import Manager from '@manager'
import React, { useContext } from 'react'
import globalState from '../../context'

export default function CheckboxGroup({
  labels,
  onCheck,
  elClass = '',
  dataPhone,
  skipNameFormatting = false,
  defaultLabel,
  onLightBackground = false,
  boxWidth,
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  return (
    <div id="checkbox-group" className={`${currentUser?.settings?.theme} ${elClass}`}>
      {Manager.isValid(labels, true) &&
        labels.map((label, index) => {
          let thisPhone = null
          if (dataPhone !== undefined) {
            thisPhone = dataPhone[index]
            if (thisPhone !== undefined) {
              thisPhone = dataPhone[index]
            }
          }
          if (!label.stringHasNumbers() && !skipNameFormatting && !label.contains('Spouse')) {
            label = label.toString().formatNameFirstNameOnly()
          }
          return (
            <div
              id="checkbox-container"
              data-phone={thisPhone ? thisPhone : ''}
              data-label={label ? label : ''}
              className={`flex animate ${boxWidth ? `w-${boxWidth}` : ''} ${onLightBackground ? 'on-light-background' : ''} ${boxWidth === 'auto' ? 'mr-20' : ''}`}
              key={index}
              onClick={(e) => {
                onCheck(e)
              }}>
              <div className={`box ${defaultLabel && defaultLabel === label ? 'active' : ''}`}>
                <span className="checkmark-icon material-icons-round">check</span>
              </div>
              <span>{label}</span>
            </div>
          )
        })}
    </div>
  )
}
