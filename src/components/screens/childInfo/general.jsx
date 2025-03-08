// Path: src\components\screens\childInfo\general.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import { MdContactEmergency } from 'react-icons/md'
import DB from '/src/database/DB'
import StringManager from '/src/managers/stringManager.coffee'
import { FaMinus, FaPlus } from 'react-icons/fa6'
import DB_UserScoped from '../../../database/db_userScoped'
import AddressInput from '/src/components/shared/addressInput'
import { PiTrashSimpleDuotone } from 'react-icons/pi'

function General() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const [generalValues, setGeneralValues] = useState([])
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
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeInfoChild, 'general', StringManager.formatDbProp(prop))
      setState({ ...state, activeInfoChild: updatedChild })
      await setSelectedChild()
    }
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    if (Manager.isValid(sharing)) {
      for (let obj of sharing) {
        sharedValues.push([obj.prop, obj.value, obj.sharedByName])
      }
    }
    if (Manager.isValid(activeInfoChild?.general)) {
      // Set info
      let values = Object.entries(activeInfoChild?.general)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      setGeneralValues(values)
    } else {
      if (sharedValues.length > 0) {
        setGeneralValues(sharedValues)
      } else {
        setGeneralValues([])
      }
    }
  }

  const update = async (prop, value) => {
    AlertManager.successAlert('Updated!')
    await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', StringManager.formatDbProp(prop), value)
  }

  useEffect(() => {
    setSelectedChild().then((r) => r)
  }, [activeInfoChild])

  return (
    <div key={activeInfoChild?.id} className="info-section section general form">
      <Accordion className={`${theme} child-info`} expanded={showInputs}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(activeInfoChild?.general) ? 'disabled header general' : 'header general'}>
          <MdContactEmergency className={'svg general'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            General
            {!Manager.isValid(activeInfoChild?.general) ? '- no info' : ''}
            {Manager.isValid(activeInfoChild?.general) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(generalValues) &&
            generalValues.map((prop, index) => {
              let infoLabel = StringManager.spaceBetweenWords(prop[0])
              const value = prop[1]
              return (
                <div key={index}>
                  {prop[0] !== 'profilePic' && (
                    <div className="flex input">
                      {Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <InputWrapper inputType={'location'} labelText={`ADDRESS: ${value.replace(/\d{5}/, '').replaceAll(', USA', '')}`}>
                          <AddressInput
                            onSelection={async (place) => {
                              await update('address', place)
                            }}
                          />
                        </InputWrapper>
                      )}
                      {!Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <>
                          {infoLabel.toLowerCase().includes('phone') && (
                            <a className="label child-info" href={`tel:${StringManager.formatPhone(value).toString()}`}>
                              {infoLabel}: {value}
                            </a>
                          )}
                          {!infoLabel.toLowerCase().includes('phone') && (
                            <InputWrapper
                              inputType={'input'}
                              labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await update(infoLabel, inputValue)
                              }}
                            />
                          )}
                        </>
                      )}
                      {infoLabel.toLowerCase() !== 'name' && <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />}
                    </div>
                  )}
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default General