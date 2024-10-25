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
import DB_UserScoped from '@userScoped'

function Behavior() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [behaviorValues, setBehaviorValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeInfoChild, 'behavior', prop)
    setSelectedChild()
    setArrowDirection('down')
    setState({ ...state, activeInfoChild: updatedChild })
  }

  const update = async (section, prop, value, isArray) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'behavior', prop, value)
    setState({ ...state, activeInfoChild: updatedChild })
    successAlert('Updated!')
  }
  const setSelectedChild = () => {
    if (Manager.isValid(activeInfoChild.behavior, false, true)) {
      // Set info
      let values = Object.entries(activeInfoChild.behavior)
      setBehaviorValues(values)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  useEffect(() => {
    setSelectedChild()
  }, [activeInfoChild])

  return (
    <div className="info-section section behavior">
      <Accordion>
        <p
          className={activeInfoChild.behavior === undefined ? 'disabled header behavior' : 'header behavior'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.behavior')
            setArrowDirection(arrowDirection === 'up' ? 'down' : 'up')
            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              if (activeInfoChild.behavior !== undefined) {
                parent.classList.add('active')
              }
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">psychology</span> Behavior {activeInfoChild.behavior === undefined ? '- No Info' : ''}
          <span className="material-icons-round fs-30">{arrowDirection === 'down' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
        </p>
        <Accordion.Panel expanded={expandAccordion === true ? true : false}>
          {behaviorValues &&
            behaviorValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]
              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input">
                    <DebounceInput
                      className="mb-10"
                      value={value}
                      element={'input'}
                      placeholder={camelCaseToString(infoLabel)}
                      minLength={2}
                      debounceTimeout={1000}
                      onChange={async (e) => {
                        const inputValue = e.target.value
                        await update('behavior', infoLabel, `${inputValue}`)
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

export default Behavior
