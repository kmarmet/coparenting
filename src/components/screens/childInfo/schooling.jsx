import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'

function Schooling() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, selectedChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [schoolingValues, setSchoolingValues] = useState([])

  const deleteProp = async (prop) => await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'schooling', selectedChild)

  const update = async (section, prop, value, isArray) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, selectedChild, 'id')

    let field = selectedChild[section][prop]

    if (field !== undefined) {
      if (isArray) {
        if (field) {
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
    if (Manager.isValid(selectedChild.schooling, false, true)) {
      setSchoolingValues(Object.entries(selectedChild.schooling).filter((x) => x[1].indexOf('custom') > -1))
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section schooling">
      <Accordion>
        <p
          className="header schooling"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.schooling')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">school</span> Schooling <span className="material-icons-round"></span>
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          <div className="flex input mt-10">
            <DebounceInput
              className="mb-10"
              value={selectedChild.schooling.schoolName}
              placeholder={'School name'}
              minLength={2}
              debounceTimeout={1000}
              onChange={(e) => update('schooling', 'schoolName', e.target.value)}
            />
            <span className="material-icons-outlined delete-icon" onClick={() => deleteProp('schoolName')}>
              delete
            </span>
          </div>
          <div className="flex input">
            <DebounceInput
              className="mb-10"
              value={selectedChild.schooling.grade}
              placeholder={'Grade level'}
              minLength={2}
              debounceTimeout={1000}
              onChange={(e) => update('schooling', 'grade', e.target.value)}
            />
            <span className="material-icons-outlined delete-icon" onClick={() => deleteProp('grade')}>
              delete
            </span>
          </div>
          {Manager.isValid(schoolingValues, true) &&
            schoolingValues.map((prop, index) => {
              const infoLabel = prop[0]
              const value = prop.flat()[1].replaceAll('_custom', '')
              return (
                <div key={Manager.getUid()} className="flex input">
                  <DebounceInput
                    className="mb-10"
                    value={value}
                    placeholder={infoLabel.camelCaseToString(infoLabel)}
                    minLength={2}
                    debounceTimeout={1000}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 0) {
                        update('schooling', infoLabel, `${inputValue}_custom`).then((r) => r)
                      } else {
                        update('schooling', infoLabel, '_custom').then((r) => r)
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

export default Schooling
