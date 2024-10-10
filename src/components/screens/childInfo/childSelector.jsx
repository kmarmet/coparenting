import React, { useContext, useEffect, useRef, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import DB from '@db'
import DB_UserScoped from '@userScoped'
import PopupCard from 'components/shared/popupCard'
import { Accordion } from 'rsuite'
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

function ChildSelector() {
  // @ts-ignore
  const { state, setState } = useContext(globalState)
  const { currentUser, selectedChild } = state
  const [showPopup, setShowPopup] = useState(true)
  const [children, setChildren] = useState([])
  const [expandAccordion, setExpandAccordion] = useState(false)

  const getChildren = async () => {
    const _children = await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, 'children')
    setChildren(_children)
  }

  useEffect(() => {
    getChildren().then((r) => r)
    setState({ ...state, showAlert: true, alertType: 'success' })
  }, [])

  return (
    <BottomCard
      // onClose={() => setState({ ...state, showAlert: false, alertMessage: '', alertType: 'error' })}
      title={'Choose Child'}
      subtitle="Select which child you would like to view & edit"
      showCard={true}
      className={`success`}>
      <div className="flex gap wrap mt-15">
        {Manager.isValid(children, true) &&
          children.map((child, index) => {
            return (
              <p
                className="child-name mt-0 w-30"
                key={index}
                onClick={(e) =>
                  setState({
                    ...state,
                    selectedChild: child,
                    currentScreen: ScreenNames.childInfo,
                    showAlert: false,
                    alertMessage: '',
                    alertType: 'error',
                  })
                }>
                {formatNameFirstNameOnly(child.general.name)}
              </p>
            )
          })}
      </div>
    </BottomCard>
  )
}

export default ChildSelector
