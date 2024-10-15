import React, { useState, useEffect, useContext } from 'react'
import Modal from '../../shared/modal'
import globalState from '../../../context'
import DB from '@db'
import { Accordion } from 'rsuite'
import Manager from '@manager'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB_UserScoped from '@userScoped'

export default function CustomCoparentInfo({ selectedChild, showForm, onClose, hasDropdown = false }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState(null)
  const [value, setValue] = useState(null)
  const [infoSection, setInfoSection] = useState('Select Info Section')
  const [infoSectionIsExpanded, setInfoSectionIsExpanded] = useState(false)

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

      const formattedTitle = title.removeSpacesAndLowerCase().toCamelCase()
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

      const formattedTitle = title.removeSpacesAndLowerCase().toCamelCase()
      if (key !== null) {
        set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${formattedTitle}`), `${value}_custom`)
        onClose()
      }
    }
  }

  const sectionSelection = async (e) => {
    const section = e.target.innerText.toLowerCase()
    const accordionHeader = document.querySelector('.accordion-header')
    accordionHeader.innerText = section.uppercaseFirstLetterOfAllWords()
    setInfoSection(section)
    setInfoSectionIsExpanded(false)
  }

  return (
    <>
      {showForm && (
        <div className={`${theme} form`}>
          {hasDropdown && (
            <Accordion className="mb-15">
              <p onClick={() => setInfoSectionIsExpanded(!infoSectionIsExpanded)} className="accordion-header">
                {infoSection.uppercaseFirstLetterOfAllWords()}
              </p>
              <Accordion.Panel expanded={infoSectionIsExpanded}>
                <p onClick={sectionSelection} className="item">
                  General
                </p>
                <p onClick={sectionSelection} className="item">
                  Medical
                </p>
                <p onClick={sectionSelection} className="item">
                  Schooling
                </p>
                <p onClick={sectionSelection} className="item">
                  Behavior
                </p>
              </Accordion.Panel>
            </Accordion>
          )}
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
      )}
    </>
  )
}
