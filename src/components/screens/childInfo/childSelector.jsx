import React, { useContext, useEffect, useRef, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import Manager from '@manager'
import BottomCard from '../../shared/bottomCard'
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
  uniqueArray,
} from '../../../globalFunctions'
import DB from '@db'

function ChildSelector({ setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, activeInfoChild } = state
  const [children, setChildren] = useState(currentUser?.children)

  const setUserChildren = async () => {
    const childs = await DB.getTable(`users/${currentUser.phone}/children`)
    setChildren(childs)
  }

  useEffect(() => {
    setUserChildren().then((r) => r)
  }, [activeInfoChild])

  return (
    <div className="flex gap wrap mt-15">
      {Manager.isValid(children, true) &&
        children.map((child, index) => {
          return (
            <p className="child-name mt-0 w-30" key={index} onClick={(e) => setActiveChild(child)}>
              {formatNameFirstNameOnly(child?.general?.name)}
            </p>
          )
        })}
    </div>
  )
}

export default ChildSelector
