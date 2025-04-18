// Path: src\components\screens\childInfo\medical.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import InputWrapper from '/src/components/shared/inputWrapper'
import {FaBriefcaseMedical} from 'react-icons/fa'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'

export default function Medical({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [medicalValues, setMedicalValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)

  const deleteProp = async (prop) => {
    const sharedInfoRecords = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    const existingPropCount = Object.keys(activeChild?.medical).length

    if (existingPropCount <= 1) {
      const accordion = document.querySelector('.medical.info-section')
      if (accordion) {
        accordion.querySelector('.MuiCollapse-root').remove()
      }
      setShowInputs(false)
    }

    // Delete Shared
    const sharedProps = sharedInfoRecords?.map((x) => x?.prop)
    let formattedProp = StringManager.toCamelCase(prop.toLowerCase())

    if (Manager.isValid(sharedProps) && sharedProps.includes(formattedProp)) {
      const scopedSharingObject = await DB.find(sharedInfoRecords, ['prop', formattedProp], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, scopedSharingObject, formattedProp, scopedSharingObject?.sharedByOwnerKey)
      await setChildData()
    }

    // Delete NOT shared
    else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'medical', StringManager.formatDbProp(prop))
      setState({...state, activeChild: updatedChild})
      await setChildData()
    }
  }

  const update = async (prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'medical', StringManager.formatDbProp(prop), value)
  }

  const setChildData = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeChild?.medical)) {
      // Set info
      let values = Object.entries(activeChild?.medical)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }

      const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
      if (values.length === valuesArr.length) {
        setMedicalValues([])
      } else {
        setMedicalValues(values)
      }
    } else {
      if (sharedValues.length > 0) {
        setMedicalValues(sharedValues)
      } else {
        setMedicalValues([])
      }
    }
  }

  useEffect(() => {
    if (showInputs) {
      setChildData().then((r) => r)
    }
  }, [showInputs])

  useEffect(() => {
    setChildData().then((r) => r)
  }, [activeChild])

  return (
    <div className="info-section section medical form">
      <Accordion className={`${theme} child-info`} disabled={!Manager.isValid(medicalValues)}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(medicalValues) ? 'disabled header medical' : 'header medical'}>
          <FaBriefcaseMedical className={'svg medical'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            Medical
            {!Manager.isValid(medicalValues) ? '- no info' : ''}
            {Manager.isValid(medicalValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = StringManager.spaceBetweenWords(prop[0])
              const value = prop[1]

              return (
                <div key={index}>
                  {infoLabel.toLowerCase().includes('phone') && (
                    <>
                      <div className="flex input">
                        <a href={`tel:${StringManager.formatPhone(value).toString()}`}>
                          {infoLabel}: {value}
                        </a>
                        <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                      </div>
                      <Spacer height={5} />
                    </>
                  )}
                  {!infoLabel.toLowerCase().includes('phone') && (
                    <>
                      <div className="flex input">
                        <InputWrapper
                          hasBottomSpacer={false}
                          inputType={InputTypes.text}
                          labelText={`${StringManager.uppercaseFirstLetterOfAllWords(infoLabel)} ${
                            Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''
                          }`}
                          defaultValue={value}
                          debounceTimeout={1000}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            update(infoLabel, `${inputValue}`).then((r) => r)
                          }}
                        />
                        <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                      </div>
                      <Spacer height={5} />
                    </>
                  )}
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}