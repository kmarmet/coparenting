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
import { FaUserShield } from 'react-icons/fa'
import DB from '@db'

export default function ShareWithCheckboxes({ onCheck, containerClass = '', checkboxGroupClass = '', defaultPhones, labelText = '', icon = '' }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [shareWith, setShareWith] = useState([])

  const setShareWithUsers = async () => {
    let people = []
    if (currentUser?.coparents?.length > 0) {
      people = [...people, [...currentUser.coparents]].filter((x) => x)
    }
    if (currentUser?.parents?.length > 0) {
      people = [...people, [...currentUser.parents]].filter((x) => x)
    }
    if (currentUser?.children?.length > 0) {
      let childrenAccounts = []
      for (let child of currentUser?.children) {
        if (child?.phone) {
          const childAccount = await DB.find(DB.tables.users, ['phone', child?.phone], true)
          if (Manager.isValid(childAccount)) {
            childrenAccounts.push(child)
          }
        }
      }
      people = [...people, [...childrenAccounts]].filter((x) => x)
    }
    setShareWith(Manager.convertToArray(people).flat())
  }

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      setShareWithUsers().then((r) => r)
    }
  }, [])

  return (
    <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass} mt-15 mb-15`}>
      <div className="flex">
        <FaUserShield className={'fs-20 mr-5'} />
        <Label text={'Share with'} required={true} />
      </div>
      <div className="flex" id="checkboxes">
        {Manager.isValid(shareWith, true) &&
          shareWith?.map((user, index) => {
            let name = user?.name
            let phone = user.phone
            if (!Manager.isValid(phone)) {
              phone = user?.general?.phone
            }
            if (!Manager.isValid(name)) {
              name = user?.general?.name
            }

            return (
              <div
                key={index}
                id="share-with-checkbox-container"
                data-phone={phone ? phone : ''}
                className={`flex ${containerClass}`}
                onClick={onCheck}>
                <span className="pill">{formatNameFirstNameOnly(name)}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}