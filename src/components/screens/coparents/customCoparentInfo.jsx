import React, { useState, useEffect, useContext } from 'react'
import Modal from '../../shared/modal'
import globalState from '../../../context'
import DB from '@db'
import { Accordion } from 'rsuite'
import Manager from '@manager'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB_UserScoped from '@userScoped'
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
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'

export default function CustomCoparentInfo({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoCoparent } = state
  const [title, setTitle] = useState(null)
  const [value, setValue] = useState(null)
  const [infoSection, setInfoSection] = useState('Select Info Section')

  const resetForm = () => {
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    hideCard()
  }

  const update = async () => {
    const dbRef = ref(getDatabase())

    const coparents = await DB.getTable(`users/${currentUser.phone}/coparents`)
    console.log(coparents)
    // if (activeCoparentInfo.hasOwnProperty('parentType')) {
    //   const coparents = (await get(child(dbRef, `users/${currentUser.phone}/coparents`))).val()
    //   let key = null
    //   coparents.forEach((child, index) => {
    //     if (child.phone === activeCoparentInfo.phone) {
    //       key = index
    //     }
    //   })
    //
    //   const formattedTitle = removeSpacesAndLowerCase(title).toCamelCase()
    //   if (key !== null) {
    //     set(child(dbRef, `users/${currentUser.phone}/coparents/${key}/${formattedTitle}`), `${value}`)
    //     hideCard()
    //   }
    // } else {
    //   const children = await DB_UserScoped.getRecordsByUser(DB.tables.users, currentUser, theme, 'children')
    //   let key = null
    //   children.forEach((child, index) => {
    //     if (child.general.name === activeCoparentInfo.general.name) {
    //       key = index
    //     }
    //   })
    //
    //   const formattedTitle = removeSpacesAndLowerCase(title).toCamelCase()
    //   if (key !== null) {
    //     set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${formattedTitle}`), `${value}`)
    //     hideCard()
    //   }
    // }
  }

  return (
    <div className="custom-coparent-info-wrapper">
      <BottomCard showCard={showCard} onClose={hideCard} title={'Add Custom Info'}>
        <div className={`${theme} form`}>
          <>
            <input className="mb-5" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
            <input className="mb-5" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
            {Manager.validation([title, value]) === 0 && (
              <div id="button-group">
                <button className="button green w-50 single center block mr-auto ml-auto" onClick={add}>
                  Add<span className="ml-10 material-icons-outlined">auto_fix_high</span>
                </button>
              </div>
            )}
          </>
        </div>
      </BottomCard>
    </div>
  )
}
