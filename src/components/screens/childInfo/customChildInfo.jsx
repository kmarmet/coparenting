import React, { useState, useEffect, useContext } from 'react'
import Modal from '../../shared/modal'
import globalState from '../../../context'
import DB from '@db'
import { Accordion } from 'rsuite'
import Manager from '@manager'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB_UserScoped from '@userScoped'
import BottomCard from '../../shared/bottomCard'
import ScreenNames from '@screenNames'

export default function CustomChildInfo({ selectedChild, showCard, onClose }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [title, setTitle] = useState(null)
  const [value, setValue] = useState(null)
  const [infoSection, setInfoSection] = useState('Select Info Section')

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

    setState({ ...state, showAlert: false })
  }

  const sectionSelection = async (e) => {
    const section = e.target.innerText.toLowerCase()
    const accordionHeader = document.querySelector('.accordion-header')
    document.querySelectorAll('.item').forEach((item) => item.classList.remove('active'))
    accordionHeader.innerText = section.uppercaseFirstLetterOfAllWords()
    e.target.classList.add('active')
    setInfoSection(section)
  }

  return (
    <>
      <BottomCard
        onClose={() => {
          setState({ ...state, showAlert: false, alertMessage: '', alertType: 'error' })
          onClose()
        }}
        title={'Choose Section & Add Info'}
        subtitle="Select which child you would like to view & edit"
        showCard={showCard}
        className={`success form custom-child-info`}>
        <div className="flex gap wrap mt-15 mb-15">
          <p onClick={sectionSelection} className="item mt-0">
            General
          </p>
          <p onClick={sectionSelection} className="item mt-0">
            Medical
          </p>
          <p onClick={sectionSelection} className="item mt-0">
            Schooling
          </p>
          <p onClick={sectionSelection} className="item mt-0">
            Behavior
          </p>
        </div>
        <input className="mb-5" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
        <input className="mb-5" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
        {Manager.validation([title, value]) === 0 && (
          <button className="button default green w-50 mt-20 single center block" onClick={add}>
            Add<span className="ml-10 material-icons-outlined">auto_fix_high</span>
          </button>
        )}
      </BottomCard>
    </>
  )
}
