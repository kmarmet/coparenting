// Path: src\components\screens\childInfo\schooling.jsx
import InputWrapper from '/src/components/shared/inputWrapper'
import DB from '/src/database/DB'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import Manager from '/src/managers/manager'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {IoSchool} from 'react-icons/io5'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import StringManager from '../../../managers/stringManager'

export default function Schooling({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [schoolingValues, setSchoolingValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)
  const {currentUser} = useCurrentUser()

  const DeleteProp = async (prop) => {
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
      await SetSelectedChild()
    } else {
      const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)
      await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, 'schooling', StringManager.formatDbProp(prop))
      await SetSelectedChild()
    }
  }

  const Update = async (prop, value) => {
    await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, 'schooling', StringManager.formatDbProp(prop), value)
    AlertManager.successAlert('Updated!')
  }

  const SetSelectedChild = async () => {
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
    SetSelectedChild().then((x) => x)
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
                <div key={index} id="data-row">
                  {infoLabel.toLowerCase().includes('phone') && (
                    <>
                      <a href={`tel:${StringManager.FormatPhone(value).toString()}`}>
                        {infoLabel}: {value}
                      </a>
                      <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => DeleteProp(infoLabel)} />
                    </>
                  )}
                  {!infoLabel.toLowerCase().includes('phone') && (
                    <>
                      <InputWrapper
                        hasBottomSpacer={false}
                        inputType={InputTypes.text}
                        labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                        defaultValue={value}
                        onChange={(e) => Update(infoLabel, e.target.value)}
                      />
                      <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => DeleteProp(infoLabel)} />
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