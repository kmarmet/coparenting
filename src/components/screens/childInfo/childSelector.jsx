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

function ChildSelector({ showCard, setShowCard, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [children, setChildren] = useState([])

  useEffect(() => {
    setChildren(currentUser?.children)
  }, [])

  return (
    <BottomCard
      onClose={setShowCard}
      title={'Choose Child'}
      subtitle="Select which child you would like to view & edit"
      showCard={showCard}
      className={`success`}>
      <div className="flex gap wrap mt-15">
        {Manager.isValid(children, true) &&
          children.map((child, index) => {
            return (
              <p
                className="child-name mt-0 w-30"
                key={index}
                onClick={(e) => {
                  setActiveChild(child)
                  setShowCard()
                }}>
                {formatNameFirstNameOnly(child.general.name)}
              </p>
            )
          })}
      </div>
    </BottomCard>
  )
}

export default ChildSelector
