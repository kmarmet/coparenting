// Path: src\components\screens\childInfo\childSelector.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB from '/src/database/DB'
import BottomCard from '/src/components/shared/bottomCard'
import StringManager from '../../../managers/stringManager'

function ChildSelector({ setActiveChild, hideCard, showCard, activeInfoChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [children, setChildren] = useState(currentUser?.children)

  const setUserChildren = async () => {
    const currentUserChildren = await DB.getTable(`users/${currentUser?.key}/children`)
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
        {Manager.isValid(children) &&
          children.map((child, index) => {
            return (
              <div key={index} id="children-container" onClick={() => setActiveChild(child)}>
                {Manager.isValid(child?.general['profilePic']) && (
                  <div id="profile-pic-wrapper" style={{ backgroundImage: `url(${child?.general['profilePic']})` }}></div>
                )}
                {!Manager.isValid(child?.general['profilePic']) && (
                  <div className="profile-pic-container no-image">
                    <p>{child?.general?.name[0]}</p>
                  </div>
                )}
                <p className={`child-name ${child?.general?.name === child?.general?.name ? 'active' : ''}`}>
                  {StringManager.getFirstNameOnly(child?.general?.name)}
                </p>
              </div>
            )
          })}
      </div>
    </BottomCard>
  )
}

export default ChildSelector