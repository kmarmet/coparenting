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
import { RiShieldUserLine } from 'react-icons/ri'
import DatasetManager from '../../managers/datasetManager'

function ShareWithCheckboxes({ onCheck, containerClass = '', checkboxGroupClass = '', defaultPhones, labelText = '', icon = '' }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [shareWith, setShareWith] = useState([])

  const setShareWithUsers = async () => {
    let people = []
    if (currentUser?.coparents?.length > 0) {
      people = [...people, currentUser.coparents]
    }
    if (currentUser?.parents?.length > 0) {
      people = [...people, currentUser.parents]
    }
    if (currentUser?.children?.length > 0) {
      people = [...people, currentUser.children]
    }
    people = DatasetManager.getUniqueArray(people, true)
    setShareWith(people)
  }

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      setShareWithUsers().then((r) => r)
    }
  }, [])

  return (
    <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass} mt-15 mb-15`}>
      <div className="flex">
        <RiShieldUserLine className={'fs-22 mr-5'} />
        <Label text={'Who is allowed to see it?'} required={true} />
      </div>
      <div className="flex" id="checkboxes">
        {Manager.isValid(shareWith, true) &&
          shareWith?.map((user, index) => {
            const userName = user?.name

            return (
              <div
                key={index}
                id="share-with-checkbox-container"
                data-phone={user?.phone ? user?.phone : ''}
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