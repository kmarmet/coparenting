import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'

function Behavior() {
  const { state, setState } = useContext(globalState)
  const { currentUser, selectedChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [behaviorValues, setBehaviorValues] = useState([])

  const deleteProp = async (prop) => await DB.deleteChildInfoProp(DB.tables.users, currentUser, prop, 'behavior', selectedChild)

  const update = async (section, prop, value, isArray) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, selectedChild, 'id')
    console.log(key)

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
    if (Manager.isValid(selectedChild.behavior, false, true)) {
      setBehaviorValues(Object.entries(selectedChild.behavior).filter((x) => x[1].indexOf('custom') > -1))
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section behavior">
      <Accordion>
        <p
          className="header behavior"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.behavior')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">psychology</span> Behavior <span className="material-icons-round"></span>
        </p>
        <Accordion.Panel expanded={expandAccordion === true ? true : false}>
          <div className="flex input mt-10">
            <DebounceInput
              className="mb-10"
              value={selectedChild.behavior.counselorName}
              placeholder={'Counselor name'}
              minLength={2}
              debounceTimeout={1000}
              onChange={(e) => update('behavior', 'counselorName', e.target.value)}
            />
            <span className="material-icons delete-icon" onClick={() => deleteProp('counselorName')}>
              delete
            </span>
          </div>
          <div className="flex input">
            <DebounceInput
              className="mb-10"
              value={selectedChild.behavior.issues}
              placeholder={'Primary behavior issue'}
              minLength={2}
              debounceTimeout={1000}
              onChange={(e) => update('behavior', 'issues', e.target.value, true)}
            />
            <span className="material-icons delete-icon" onClick={() => deleteProp('issues')}>
              delete
            </span>
          </div>
          {behaviorValues &&
            behaviorValues.map((prop, index) => {
              const infoLabel = prop[0]
              const value = prop[1].replaceAll('_custom', '')
              return (
                <div key={Manager.getUid()} className="flex input">
                  <DebounceInput
                    className="mb-10"
                    value={value}
                    element={'input'}
                    placeholder={infoLabel.camelCaseToString(infoLabel)}
                    minLength={2}
                    debounceTimeout={1000}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 0) {
                        update('behavior', infoLabel, `${inputValue}_custom`)
                      } else {
                        update('behavior', infoLabel, '_custom')
                      }
                    }}
                  />
                  <span className="material-icons delete-icon" onClick={() => deleteProp(infoLabel)}>
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

export default Behavior
