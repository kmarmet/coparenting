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
  uniqueArray,
  getFileExtension,
} from '.././../globalFunctions'

export default function CustomChildInfo({ selectedChild, setShowCard, showCard, onClose, hasDropdown = false }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState(null)
  const [value, setValue] = useState(null)
  const [infoSection, setInfoSection] = useState('general')

  const add = async () => {
    const dbRef = ref(getDatabase())

    if (selectedChild.hasOwnProperty('parentType')) {
      const coparents = (await get(child(dbRef, `users/${currentUser.phone}/coparents`))).val()
      let key = null
      coparents.forEach((child, index) => {
        if (child.phone === selectedChild.phone) {
          key = index
        }
      })

      const formattedTitle = removeSpacesAndLowerCase(title).toCamelCase()
      if (key !== null) {
        set(child(dbRef, `users/${currentUser.phone}/coparents/${key}/${formattedTitle}`), `${value}_custom`)
        onClose()
      }
    } else {
      const children = await DB_UserScoped.getRecordsByUser(DB.tables.users, currentUser, theme, 'children')
      let key = null
      children.forEach((child, index) => {
        if (child.general.name === selectedChild.general.name) {
          key = index
        }
      })

      const formattedTitle = removeSpacesAndLowerCase(title).toCamelCase()
      if (key !== null) {
        set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${formattedTitle}`), `${value}_custom`)
        onClose()
      }
    }
  }

  const resetForm = () => {
    Manager.resetForm('custom-child-info-wrapper')
    setTitle(null)
    setValue(null)
    setInfoSection('Select Info Section')
    setShowCard()
  }

  return (
    <BottomCard className="custom-child-info-wrapper" onClose={setShowCard} title={'Add Custom Info'} showCard={showCard}>
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
