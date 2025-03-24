// Path: src\components\screens\childInfo\childSelector.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB from '/src/database/DB'
import Modal from '/src/components/shared/modal'
import StringManager from '../../../managers/stringManager'
import Spacer from '../../shared/spacer'

function ChildSelector({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, activeInfoChild } = state
  const [children, setChildren] = useState(currentUser?.children)

  const setUserChildren = async () => {
    const currentUserChildren = await DB.getTable(`users/${currentUser?.key}/children`)
    setChildren(currentUserChildren)
  }

  useEffect(() => {
    setUserChildren().then((r) => r)
  }, [activeInfoChild])

  return (
    <Modal
      hasSubmitButton={false}
      onClose={hideCard}
      title={'View Another Child'}
      subtitle="Choose the child whose information you wish to view or modify"
      showCard={showCard}
      wrapperClass="child-selector-card"
      className={`child-selector`}>
      <Spacer height={10} />
      <div id="child-selector">
        {Manager.isValid(children) &&
          children.map((child, index) => {
            return (
              <div
                key={index}
                id="child-wrapper"
                onClick={() => {
                  hideCard()
                  console.log(child.general.name)
                  setState({ ...state, activeInfoChild: child })
                }}>
                {Manager.isValid(child?.general['profilePic']) && (
                  <div id="profile-pic-wrapper" style={{ backgroundImage: `url(${child?.general['profilePic']})` }}></div>
                )}
                {!Manager.isValid(child?.general['profilePic']) && (
                  <div className="profile-pic-container no-image">
                    <p>{StringManager.uppercaseFirstLetterOfAllWords(child?.general?.name[0])}</p>
                  </div>
                )}
                <p className={`child-name ${child?.general?.name === child?.general?.name ? 'active' : ''}`}>
                  {StringManager.getFirstNameOnly(child?.general?.name)}
                </p>
              </div>
            )
          })}
      </div>
    </Modal>
  )
}

export default ChildSelector