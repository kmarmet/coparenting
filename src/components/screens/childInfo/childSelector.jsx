import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  formatFileName,
  formatNameFirstNameOnly,
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
} from '../../../globalFunctions'
import DB from '@db'
import BottomCard from '../../shared/bottomCard'

function ChildSelector({ setActiveChild, hideCard, showCard, activeInfoChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [children, setChildren] = useState(currentUser?.children)

  const setUserChildren = async () => {
    const currentUserChildren = await DB.getTable(`users/${currentUser?.phone}/children`)
    setChildren(currentUserChildren)
  }

  useEffect(() => {
    setUserChildren().then((r) => r)
  }, [activeInfoChild])

  return (
    <BottomCard
      hasSubmitButton={false}
      onClose={hideCard}
      title={'Choose Child'}
      subtitle="Select which child you would like to view & edit"
      showCard={showCard}
      wrapperClass="child-selector-card"
      className={`child-selector`}>
      <div className="flex gap wrap mt-15">
        {Manager.isValid(children, true) &&
          children.map((child, index) => {
            return (
              <p
                className={`child-name pill ${child?.general?.name === activeInfoChild?.general?.name ? 'active' : ''}`}
                key={index}
                onClick={(e) => setActiveChild(child)}>
                {formatNameFirstNameOnly(child?.general?.name)}
              </p>
            )
          })}
      </div>
    </BottomCard>
  )
}

export default ChildSelector