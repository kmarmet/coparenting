import Manager from '@manager'
import React, { useContext } from 'react'
import globalState from '../../context'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'

export default function CheckboxGroup({ labels, onCheck, elClass = '', dataPhone, dataDate, skipNameFormatting = false, defaultLabel }) {
  const { state, setState } = useContext(globalState)
  const { theme } = state
  return (
    <div id="checkbox-group" className={`${theme} ${elClass}`}>
      {Manager.isValid(labels, true) &&
        labels.map((label, index) => {
          let thisPhone = null
          let thisDate = null
          if (dataPhone !== undefined) {
            thisPhone = dataPhone[index]
            if (thisPhone !== undefined) {
              thisPhone = dataPhone[index]
            }
          }
          if (dataDate !== undefined) {
            thisDate = dataDate[index]
            if (thisDate !== undefined) {
              thisDate = dataDate[index]
            }
          }
          if (Manager.isValid(label) && !stringHasNumbers(label) && !skipNameFormatting && !contains(label, 'Spouse')) {
            label = formatNameFirstNameOnly(label.toString())
          }
          return (
            <div
              id="checkbox-container"
              data-phone={thisPhone ? thisPhone : ''}
              data-label={label ? label : ''}
              data-date={thisDate ? thisDate : ''}
              className={`flex`}
              key={index}
              onClick={(e) => {
                onCheck(e)
              }}>
              <div className={`box ${defaultLabel && defaultLabel === label ? 'active' : ''}`}>
                {/*<span className="checkmark-icon material-icons-round">check</span>*/}
                <div id="inner-circle"></div>
              </div>
              <span>{label}</span>
            </div>
          )
        })}
    </div>
  )
}
