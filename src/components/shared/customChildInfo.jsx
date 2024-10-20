import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import DB from '@db'
import { Dropdown } from 'rsuite'
import Manager from '@manager'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB_UserScoped from '@userScoped'
import { Accordion } from 'rsuite'
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
  uniqueArray,
  getFileExtension,
} from '.././../globalFunctions'

export default function CustomChildInfo({ activeChild, showCard, hideCard, onClose, hasDropdown = false }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')

  const add = async () => {
    const dbRef = ref(getDatabase())

    let key = null
    currentUser.children.forEach((child, index) => {
      if (child.general.name === activeChild.general.name) {
        key = index
      }
    })

    const formattedTitle = removeSpacesAndLowerCase(title).toCamelCase()
    if (key !== null) {
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${formattedTitle}`), `${value}`)
      resetForm()
    }
  }

  const resetForm = () => {
    Manager.resetForm('custom-child-info-wrapper')
    setTitle('')
    setValue('')
    setInfoSection('Select Info Section')
    hideCard(false)
  }

  return (
    <BottomCard className="custom-child-info-wrapper" onClose={hideCard} title={'Add Custom Info'} showCard={showCard}>
      <div className="form">
        {hasDropdown && (
          <div className="flex">
            <p onClick={() => setInfoSection('general')} className={infoSection === 'general' ? 'active item' : 'item'}>
              General
            </p>
            <p onClick={() => setInfoSection('medical')} className={infoSection === 'medical' ? 'active item' : 'item'}>
              Medical
            </p>
            <p onClick={() => setInfoSection('schooling')} className={infoSection === 'schooling' ? 'active item' : 'item'}>
              Schooling
            </p>
            <p onClick={() => setInfoSection('behavior')} className={infoSection === 'behavior' ? 'active item' : 'item'}>
              Behavior
            </p>
          </div>
        )}
        <>
          <input className="mb-15" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
          <input className="mb-15" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
        </>
        <div className="buttons">
          {Manager.isValid(value) && Manager.isValid(title) && (
            <button className="button card-button" onClick={add}>
              Add<span className="ml-10 material-icons-outlined">auto_fix_high</span>
            </button>
          )}
          <button className="button card-button red" onClick={resetForm}>
            Cancel
          </button>
        </div>
      </div>
    </BottomCard>
  )
}
