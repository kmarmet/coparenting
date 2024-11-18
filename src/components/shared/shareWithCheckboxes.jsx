import Manager from '@manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import {
  contains,
  displayAlert,
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

function ShareWithCheckboxes({
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  dataPhone,
  defaultPhones,
  labelText = '',
  shareWith,
  icon = '',
}) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [names, setNames] = useState([])

  const setUserNames = async () => {
    const userNames = await Manager.getNamesFromPhone(shareWith)
    if (Manager.isValid(userNames)) {
      setNames(userNames)
    }
  }

  useEffect(() => {
    if (Manager.isValid(shareWith, true)) {
      console.log(shareWith)
      setUserNames().then((r) => r)
    }
  }, [shareWith])

  return (
    <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass}`}>
      <div>
        <Label icon={icon} text={labelText} required={true}></Label>
        <div className="flex" id="checkboxes">
          {Manager.isValid(shareWith, true) &&
            Manager.isValid(names, true) &&
            shareWith.map((phone, index) => {
              let thisPhone = shareWith[index]
              if (Manager.isValid(dataPhone)) {
                if (Manager.isValid(dataPhone[index])) {
                  thisPhone = dataPhone[index]
                }
              }
              const userName = names?.filter((x) => x?.phone === phone)[0]?.name

              return (
                <div
                  key={index}
                  id="share-with-checkbox-container"
                  data-phone={thisPhone ? thisPhone : ''}
                  className={`flex ${containerClass}`}
                  onClick={(e) => onCheck(e)}>
                  <div className={`box ${Manager.isValid(defaultPhones, true) && defaultPhones.includes(phone) ? 'active' : ''}`}>
                    <div id="inner-circle"></div>
                  </div>
                  <span>{formatNameFirstNameOnly(userName)}</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default ShareWithCheckboxes