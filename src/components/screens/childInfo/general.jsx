import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import ScreenNames from '@screenNames'

function General() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, selectedChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [generalValues, setGeneralValues] = useState([])

  const deleteProp = async (prop) => await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'general', selectedChild)

  const setSelectedChild = () => {
    if (Manager.isValid(selectedChild.general, false, true)) {
      setGeneralValues(Object.entries(selectedChild.general).filter((x) => x[1].indexOf('custom') > -1))
    }
  }

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

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
    setState({ ...state, showMenuButton: true, showBackButton: true, previousScreen: ScreenNames.childSelector })
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section general">
      <Accordion>
        {/* EXPAND ACCORDION */}
        <p
          className="header general"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.general')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">perm_contact_calendar</span>
          General
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          {/* DATE OF BIRTH */}
          <div className="flex input">
            <MobileDatePicker key={Manager.getUid()} className="dob mb-10 w-100" onChange={(e) => update('general', 'dateOfBirth', e)} />
            <span className="material-icons delete-icon" onClick={() => deleteProp('dateOfBirth')}>
              delete
            </span>
          </div>
          {/* ADDRESS */}
          <div className="flex input">
            <Autocomplete
              apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'usa' },
              }}
              className="mb-10"
              onPlaceSelected={(place) => {
                console.log('he')
                console.log(place)
                update('general', 'address', place.formatted_address, false)
              }}
              placeholder={Manager.isValid(selectedChild.general.address) ? selectedChild.general.address : 'Location'}
            />
            <span className="material-icons delete-icon" onClick={() => deleteProp('address')}>
              delete
            </span>
          </div>
          {/* PHONE */}
          <div className="flex input">
            <DebounceInput
              className="mb-10"
              key={Manager.getUid()}
              type="number"
              placeholder="Phone number"
              minLength={2}
              value={selectedChild.general.phone}
              debounceTimeout={2000}
              onChange={(e) => update('general', 'phone', e.target.value)}
            />
            <span className="material-icons delete-icon" onClick={() => deleteProp('phone')}>
              delete
            </span>
          </div>

          {/* LOOP INFO */}
          {Manager.isValid(generalValues, true) &&
            generalValues.map((prop, index) => {
              const infoLabel = prop[0]
              const value = prop[1].replaceAll('_custom', '')

              return (
                <div className="flex input" key={index}>
                  <DebounceInput
                    className="mb-15"
                    value={value}
                    placeholder={infoLabel.camelCaseToString(infoLabel)}
                    minLength={2}
                    debounceTimeout={1000}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 0) {
                        update('general', infoLabel, `${inputValue}_custom`)
                      } else {
                        update('general', infoLabel, '_custom')
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

export default General
