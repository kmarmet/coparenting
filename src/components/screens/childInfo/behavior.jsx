import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  camelCaseToString,
  contains,
  formatDbProp,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  lowercaseShouldBeLowercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import { IoCloseOutline } from 'react-icons/io5'
import DB_UserScoped from '@userScoped'
import Accordion from '@mui/material/Accordion'
import { FaChevronDown } from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'

export default function Behavior({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [behaviorValues, setBehaviorValues] = useState([])

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'behavior', formatDbProp(prop))
    setSelectedChild()
    setActiveChild(updatedChild)
  }
  const update = async (section, prop, value, isArray) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'behavior', formatDbProp(prop), value)
    setActiveChild(updatedChild)
    AlertManager.successAlert('Updated!')
  }
  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.behavior)) {
      // Set info
      let values = Object.entries(activeChild.behavior)
      setBehaviorValues(values)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section behavior">
      <Accordion className={theme}>
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.behavior) ? 'disabled header behavior' : 'header behavior'}>
          <span className="material-icons-round">psychology</span> Behavior {!Manager.isValid(activeChild.behavior) ? '- No Info' : ''}
        </AccordionSummary>
        <AccordionDetails>
          {behaviorValues &&
            behaviorValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]
              return (
                <div key={index}>
                  <div className="flex input">
                    <InputWrapper
                      inputType={'input'}
                      defaultValue={value}
                      labelText={infoLabel}
                      onChange={async (e) => {
                        const inputValue = e.target.value
                        await update('behavior', infoLabel, `${inputValue}`)
                      }}
                    />
                    <IoCloseOutline className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                  </div>
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}