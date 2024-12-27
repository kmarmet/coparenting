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
      title={'View Another Child'}
      subtitle="Select which child you would like to view and/or edit"
      showCard={showCard}
      wrapperClass="child-selector-card"
      className={`child-selector`}>
      <div className="flex mt-15" id="child-selector">
        {Manager.isValid(children, true) &&
          children.map((child, index) => {
            return (
              <div key={index} id="children-container" onClick={(e) => setActiveChild(child)}>
                {Manager.isValid(child?.general['profilePic']) && (
                  <div id="profile-pic-wrapper" style={{ backgroundImage: `url(${child?.general['profilePic']})` }}></div>
                )}
                {!Manager.isValid(child?.general['profilePic']) && (
                  <div className="profile-pic-container no-image">
                    <p>{child?.general?.name[0]}</p>
                  </div>
                )}
                <p className={`child-name ${child?.general?.name === child?.general?.name ? 'active' : ''}`}>
                  {formatNameFirstNameOnly(child?.general?.name)}
                </p>
              </div>
            )
          })}
      </div>
    </BottomCard>
  )
}

export default ChildSelector