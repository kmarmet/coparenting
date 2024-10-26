import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import PopupCard from './popupCard'
import BottomCard from './bottomCard'
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
  contains,
  displayAlert,
  throwError,
  successAlert,
  uniqueArray,
  confirmAlert,
  getFileExtension,
} from '../../globalFunctions'

export default function Confirm({ message, title = '', onAccept, onReject, className = '', buttonsText = [], onCancel, type = 'confirm' }) {
  const { state, setState } = useContext(globalState)

  useEffect(() => {
    if (message.length > 0) {
      setState({ ...state, showOverlay: true })
    } else {
      setState({ ...state, showOverlay: false })
    }
  }, [message.length])

  return (
    <BottomCard onClose={onCancel} title={title} showCard={title.length > 0} className={`${type} ${className} confirm`}>
      <p>{message}</p>
      <div id="button-group" className="flex">
        <button
          className="button approve green w-50"
          onClick={() => {
            onAccept()
            setState({ ...state, showConfirm: false, confirmMessage: '' })
          }}>
          {buttonsText.length > 0 && buttonsText[0]}
          {buttonsText.length === 0 && "I'm Sure"}
        </button>
        <button
          className="reject red button w-50"
          onClick={() => {
            onReject()
            setState({ ...state, showConfirm: false, confirmMessage: '' })
          }}>
          {buttonsText.length > 0 && buttonsText[1]}
          {buttonsText.length === 0 && 'Nevermind'}
        </button>
      </div>
    </BottomCard>
  )
}
