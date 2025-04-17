// Path: src\components\screens\childInfo\schooling.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import {IoSchool} from 'react-icons/io5'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'

export default function Schooling({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [schoolingValues, setSchoolingValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

    const existingPropCount = Object.keys(activeChild?.schooling).length

    if (existingPropCount <= 1) {
      const accordion = document.querySelector('.schooling.info-section')
      if (accordion) {
        accordion.querySelector('.MuiCollapse-root').remove()
      }
      setShowInputs(false)
    }

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
      await setSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'schooling', StringManager.formatDbProp(prop))
      await setSelectedChild()
      setState({...state, activeChild: updatedChild})
    }
  }

  const update = async (prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'schooling', StringManager.formatDbProp(prop), value)
    AlertManager.successAlert('Updated!')
    setState({...state, activeChild: updatedChild})
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    if (Manager.isValid(sharing)) {
      for (let obj of sharing) {
        sharedValues.push([obj.prop, obj.value, obj.sharedByName])
      }
    }

    if (Manager.isValid(activeChild?.schooling)) {
      // Set info
      let values = Object.entries(activeChild?.schooling)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }

      const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
      if (values.length === valuesArr.length) {
        setSchoolingValues([])
      } else {
        setSchoolingValues(values)
      }
    } else {
      if (Manager.isValid(sharedValues)) {
        setSchoolingValues(sharedValues)
      } else {
        setSchoolingValues([])
      }
    }
  }

  useEffect(() => {
    setSelectedChild().then((x) => x)
  }, [activeChild])

  return (
    <div className="info-section section schooling">
      <Accordion className={`${theme} child-info`} disabled={!Manager.isValid(activeChild?.schooling)}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(schoolingValues) ? 'disabled header schooling' : 'header schooling'}>
          <IoSchool className={'svg schooling'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            Schooling
            {!Manager.isValid(schoolingValues) ? '- no info' : ''}
            {Manager.isValid(schoolingValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(schoolingValues) &&
            schoolingValues.map((prop, index) => {
              let infoLabel = StringManager.uppercaseFirstLetterOfAllWords(StringManager.spaceBetweenWords(prop[0]))
              const value = prop.flat()[1]
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
                          labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                          defaultValue={value}
                          onChange={(e) => update(infoLabel, e.target.value)}
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