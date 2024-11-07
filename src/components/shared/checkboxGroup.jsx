import Manager from '@manager'
import React, { useContext } from 'react'
import globalState from '../../context'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'

export default function CheckboxGroup({
  labels,
  onCheck,
  containerClass = '',
  elClass = '',
  dataPhone,
  dataDate,
  skipNameFormatting = false,
  defaultLabels,
}) {
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
              className={`flex ${containerClass}`}
              key={index}
              onClick={(e) => {
                onCheck(e)
              }}>
              <div className={`box ${Manager.isValid(defaultLabels, true) && defaultLabels.includes(label) ? 'active' : ''}`}>
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
