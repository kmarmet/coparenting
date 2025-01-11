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
import DB_UserScoped from 'database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { FaChevronDown } from 'react-icons/fa6'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import { IoCloseOutline } from 'react-icons/io5'
import { FaBriefcaseMedical } from 'react-icons/fa'
import DB from 'database/DB'

export default function Medical({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [medicalValues, setMedicalValues] = useState([])

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByPhone)
      await setSelectedChild()
    }

    // Delete NOT shared
    else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'medical', formatDbProp(prop))
      setActiveChild(updatedChild)
      await setSelectedChild()
    }
  }

  const update = async (section, prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'medical', formatDbProp(prop), value)
    setActiveChild(updatedChild)
    AlertManager.successAlert('Updated!')
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeChild.medical)) {
      // Set info
      let values = Object.entries(activeChild.medical)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      setMedicalValues(values)
    } else {
      if (sharedValues.length > 0) {
        setMedicalValues(sharedValues)
      } else {
        setMedicalValues([])
      }
    }
  }

  useEffect(() => {
    setSelectedChild().then((r) => r)
  }, [activeChild])

  return (
    <div className="info-section section medical">
      <Accordion className={theme} disabled={!Manager.isValid(medicalValues)}>
        <AccordionSummary expandIcon={<FaChevronDown />} className={!Manager.isValid(medicalValues) ? 'disabled header medical' : 'header medical'}>
          <FaBriefcaseMedical className={'svg medical'} /> Medical {!Manager.isValid(activeChild.medical) ? '- No Info' : ''}
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]

              return (
                <div key={index}>
                  <div className="flex input">
                    <InputWrapper
                      inputType={'input'}
                      labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${formatNameFirstNameOnly(prop[2])})` : ''}`}
                      defaultValue={value}
                      value={value}
                      debounceTimeout={1000}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        update('medical', infoLabel, `${inputValue}`).then((r) => r)
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