import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from 'managers/manager'
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
import DB_UserScoped from 'database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import { FaChevronDown } from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import { GiBrain } from 'react-icons/gi'
import DB from 'database/DB'

export default function Behavior({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [behaviorValues, setBehaviorValues] = useState([])

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByPhone)
      await setSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'behavior', formatDbProp(prop))
      await setSelectedChild()
      setActiveChild(updatedChild)
    }
  }
  const update = async (section, prop, value, isArray) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'behavior', formatDbProp(prop), value)
    setActiveChild(updatedChild)
    AlertManager.successAlert('Updated!')
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeChild.behavior)) {
      // Set info
      let values = Object.entries(activeChild.behavior)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      setBehaviorValues(values)
    } else {
      if (sharedValues.length > 0) {
        setBehaviorValues(sharedValues)
      } else {
        setBehaviorValues([])
      }
    }
  }

  useEffect(() => {
    setSelectedChild().then((r) => r)
  }, [activeChild])

  return (
    <div className="info-section section behavior">
      <Accordion className={theme} disabled={Manager.isValid(activeChild?.behavior) ? false : true}>
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.behavior) ? 'disabled header behavior' : 'header behavior'}>
          <GiBrain className={'svg'} /> Behavior {!Manager.isValid(activeChild.behavior) ? '- No Info' : ''}
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
                      labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${formatNameFirstNameOnly(prop[2])})` : ''}`}
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
