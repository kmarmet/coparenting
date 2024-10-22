import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
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
  camelCaseToString,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
  lowercaseShouldBeLowercase,
} from '../../../globalFunctions'
import DateFormats from '../../../constants/dateFormats'

function Schooling({ activeChild, updateActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [schoolingValues, setSchoolingValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')
  const deleteProp = async (prop) => {
    const key = await DB.getNestedSnapshotKey(`/users/${currentUser.phone}/children`, activeChild, 'id')
    await DB.deleteByPath(`/users/${currentUser.phone}/children/${key}/schooling/${prop.toLowerCase()}`)
    updateActiveChild()
    setSelectedChild()
    setArrowDirection('down')
  }

  const update = async (section, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')

    // Update DB
    if (key !== null) {
      displayAlert('success', '', 'Updated!')
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop.toLowerCase()}`), value)
      updateActiveChild()
    }
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.schooling, false, true)) {
      // Set info
      let values = Object.entries(activeChild.schooling)
      setSchoolingValues(values)
    } else {
      setSchoolingValues([])
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section schooling">
      <Accordion>
        <p
          className={activeChild.schooling === undefined ? 'disabled header schooling' : 'header schooling'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.schooling')
            setArrowDirection(arrowDirection === 'up' ? 'down' : 'up')
            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              if (activeChild.schooling !== undefined) {
                parent.classList.add('active')
              }
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">school</span> Schooling {activeChild.schooling === undefined ? '- No Info' : ''}
          <span className="material-icons-round fs-30">{arrowDirection === 'down' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          {Manager.isValid(schoolingValues, true) &&
            schoolingValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop.flat()[1]
              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input">
                    <DebounceInput
                      className="mb-10"
                      value={value}
                      placeholder={camelCaseToString(infoLabel)}
                      minLength={2}
                      debounceTimeout={1000}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        update('schooling', infoLabel, `${inputValue}`).then((r) => r)
                      }}
                    />
                    <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                      delete
                    </span>
                  </div>
                </div>
              )
            })}
        </Accordion.Panel>
      </Accordion>
    </div>
  )
}

export default Schooling
