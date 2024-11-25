import Manager from '@manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
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
import Label from './label'

function ShareWithCheckboxes({ onCheck, containerClass = '', checkboxGroupClass = '', dataPhone, defaultPhones, labelText = '', icon = '' }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [shareWith, setShareWith] = useState([])

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      const coparents = currentUser.coparents
      //TODO ADD CHILD ACCOUNTS TO SHARE WITH
      setShareWith(coparents)
    }
  }, [])

  return (
    <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass} mt-15 mb-15`}>
      <Label text={labelText} required={true}></Label>
      <div className="flex" id="checkboxes">
        {Manager.isValid(shareWith, true) &&
          shareWith.map((user, index) => {
            let thisPhone = shareWith[index]
            if (Manager.isValid(dataPhone)) {
              if (Manager.isValid(dataPhone[index])) {
                thisPhone = dataPhone[index]
              }
            }
            const userName = user?.name

            return (
              <div
                key={index}
                id="share-with-checkbox-container"
                data-phone={thisPhone ? thisPhone : ''}
                className={`flex ${containerClass}`}
                onClick={onCheck}>
                <div className={`box ${Manager.isValid(defaultPhones, true) && defaultPhones.includes(user) ? 'active' : ''}`}>
                  <div id="inner-circle"></div>
                </div>
                <span>{formatNameFirstNameOnly(userName)}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ShareWithCheckboxes