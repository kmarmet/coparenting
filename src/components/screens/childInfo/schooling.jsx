// Path: src\components\screens\childInfo\schooling.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import { IoCloseOutline, IoSchool } from 'react-icons/io5'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager'
import { FaPlus, FaMinus } from 'react-icons/fa6'
export default function Schooling() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const [schoolingValues, setSchoolingValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
      await setSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeInfoChild, 'schooling', StringManager.formatDbProp(prop))
      await setSelectedChild()
      setState({ ...state, activeInfoChild: updatedChild })
    }
  }

  const update = async (prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'schooling', StringManager.formatDbProp(prop), value)
    AlertManager.successAlert('Updated!')
    setState({ ...state, activeInfoChild: updatedChild })
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeInfoChild?.schooling)) {
      // Set info
      let values = Object.entries(activeInfoChild?.schooling)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      setSchoolingValues(values)
    } else {
      if (sharedValues.length > 0) {
        setSchoolingValues(sharedValues)
      } else {
        setSchoolingValues([])
      }
    }
  }

  useEffect(() => {
    setSelectedChild().then((x) => x)
  }, [activeInfoChild])

  return (
    <div className="info-section section schooling">
      <Accordion className={theme} disabled={!Manager.isValid(activeInfoChild?.schooling)}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(activeInfoChild?.schooling) ? 'disabled header schooling' : 'header schooling'}>
          <IoSchool className={'svg'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            Schooling
            {!Manager.isValid(activeInfoChild?.schooling) ? '- no info' : ''}
            {Manager.isValid(activeInfoChild?.schooling) && <>{showInputs ? <FaMinus /> : <FaPlus />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(schoolingValues) &&
            schoolingValues.map((prop, index) => {
              let infoLabel = StringManager.uppercaseFirstLetterOfAllWords(StringManager.spaceBetweenWords(prop[0]))
              const value = prop.flat()[1]
              return (
                <div key={index}>
                  <div className="flex input">
                    {infoLabel.toLowerCase().includes('phone') && (
                      <a href={`tel:${StringManager.formatPhone(value).toString()}`}>
                        {infoLabel}: {value}
                      </a>
                    )}
                    {!infoLabel.toLowerCase().includes('phone') && (
                      <InputWrapper
                        inputType={'input'}
                        labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                        defaultValue={value}
                        onChange={(e) => update(infoLabel, e.target.value)}
                      />
                    )}
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