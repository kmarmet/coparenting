import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { FaChevronDown } from 'react-icons/fa6'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import { IoCloseOutline } from 'react-icons/io5'
import { FaBriefcaseMedical } from 'react-icons/fa'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager'
import { FaPlus, FaMinus } from 'react-icons/fa6'

export default function Medical({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [medicalValues, setMedicalValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)

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
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'medical', StringManager.formatDbProp(prop))
      setActiveChild(updatedChild)
      await setSelectedChild()
    }
  }

  const update = async (section, prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'medical', StringManager.formatDbProp(prop), value)
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
    <div className="info-section section medical form">
      <Accordion className={`${theme} child-info`} disabled={!Manager.isValid(medicalValues)}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(medicalValues) ? 'disabled header medical' : 'header medical'}>
          <FaBriefcaseMedical className={'svg medical'} /> {!Manager.isValid(activeChild.medical) ? '- No Info' : ''}
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            Medical
            {!Manager.isValid(activeChild.medical) ? '- No Info' : ''}
            {Manager.isValid(activeChild?.medical) && <>{showInputs ? <FaMinus /> : <FaPlus />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = StringManager.spaceBetweenWords(prop[0])
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