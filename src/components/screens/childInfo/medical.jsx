import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'

function Medical() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, selectedChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [medicalValues, setMedicalValues] = useState([])

  const deleteProp = async (prop) => {
    await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'medical', selectedChild)
    setSelectedChild()
  }

  const update = async (section, prop, value, isArray) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, selectedChild, 'id')

    let field = selectedChild[section][prop]

    if (field !== undefined) {
      if (isArray) {
        if (field && field !== undefined) {
          value = value.split(',')
        }
      }
    }

    // Update DB
    if (key !== null) {
      setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Updated!' })
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop}`), value)
    }
  }

  const setSelectedChild = () => {
    if (Manager.isValid(selectedChild.medical, false, true)) {
      setMedicalValues(Object.entries(selectedChild.medical).filter((x) => x[1].indexOf('custom') > -1))
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section medical">
      <Accordion>
        <p
          className="header medical"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.medical')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">medical_information</span> Medical
        </p>
        <Accordion.Panel expanded={expandAccordion === true ? true : false}>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = prop[0]
              const value = prop[1].replace('_custom', '')
              return (
                <div className="flex input mt-10" key={index}>
                  <DebounceInput
                    className="mb-10"
                    value={value}
                    placeholder={infoLabel.camelCaseToString(infoLabel)}
                    minLength={2}
                    debounceTimeout={1000}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 0) {
                        update('medical', infoLabel, `${inputValue}_custom`).then((r) => r)
                      } else {
                        update('medical', infoLabel, '_custom').then((r) => r)
                      }
                    }}
                  />
                  <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                    delete
                  </span>
                </div>
              )
            })}
        </Accordion.Panel>
      </Accordion>
    </div>
  )
}

export default Medical
