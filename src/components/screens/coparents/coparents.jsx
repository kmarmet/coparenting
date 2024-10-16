import { child, getDatabase, onValue, ref, remove, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '@db'
import Manager from '@manager'
import AddNewButton from '@shared/addNewButton.jsx'
import Confirm from '@shared/confirm.jsx'
import ScreenNames from '@screenNames'
import DB_UserScoped from '@userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import PopupCard from 'components/shared/popupCard'
import BottomCard from '../../shared/bottomCard'
import NewCoparentForm from './newCoparentForm'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [showCustomInfoForm, setShowCustomInfoForm] = useState(false)
  const [customValues, setCustomValues] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')

  const resetForm = () => {
    Manager.resetForm()
    setUserCoparents([])
    setSelectedCoparent(null)
    setShowCustomInfoForm(false)
    setCustomValues([])
    setConfirmTitle('')
    setState({ ...state, formToShow: '' })
  }

  const deleteProp = async (prop) => await DB.deleteCoparentInfoProp(DB.tables.users, currentUser, theme, prop, selectedCoparent)

  useEffect(() => {
    if (selectedCoparent) {
      setCustomValues(Object.entries(selectedCoparent).filter((x) => x[1].indexOf('custom') > -1))
    }
  }, [selectedCoparent])

  const update = async (prop, value) => {
    const dbRef = ref(getDatabase())
    const activeCoparentEl = document.querySelector('.coparent.active')
    const coparentPhone = activeCoparentEl.getAttribute('data-phone')
    let key = null

    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'coparents').then((coparents) => {
      coparents.forEach((coparent, index) => {
        if (coparent.phone === coparentPhone) {
          key = index
        }
      })
    })

    if (key !== null) {
      set(child(dbRef, `users/${currentUser.phone}/coparents/${key}/${prop}`), value)
      setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Updated!' })
    }
  }

  const deleteCoparent = async () => {
    const dbRef = ref(getDatabase())
    const activeCoparentEl = document.querySelector('.coparent.active')
    const coparentPhone = activeCoparentEl.getAttribute('data-phone')
    let key = null
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'coparents').then((coparents) => {
      coparents.forEach((coparent, index) => {
        if (coparent.phone === coparentPhone) {
          key = index
        }
      })
    })
    if (key !== null) {
      remove(child(dbRef, `users/${currentUser.phone}/coparents/${key}`))
    }
  }

  const getCoparents = async () => {
    let all = []
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'coparents').then((coparent) => {
      all.push(coparent)
    })
    all = all[0]
    setSelectedCoparent(all[0])
    setUserCoparents(all)
  }

  const onValueChange = async () => {
    if (currentUser) {
      const dbRef = getDatabase()
      const userRef = ref(dbRef, `${DB.tables.users}`)
      onValue(userRef, (snapshot) => {
        getCoparents()
      })
    }
  }

  useEffect(() => {
    if (currentUser) {
      onValueChange().then((r) => r)
    }
    Manager.toggleForModalOrNewForm()

    const autocompleteInput = document.querySelector('.pac-target-input')
    if (autocompleteInput) {
      document.querySelector('.pac-target-input').setAttribute('placeholder', 'Enter updated address')
    }
    setState({ ...state, showMenuButton: true, showBackButton: false })
  }, [])

  return (
    <>
      <Confirm
        onAccept={() => {
          deleteCoparent()
          setConfirmTitle('')
        }}
        onCancel={() => setConfirmTitle('')}
        onReject={() => setConfirmTitle('')}
        title={confirmTitle}
        message={`Are you sure you would like to delete ${Manager.isValid(selectedCoparent) ? selectedCoparent.name + '?' : ''}`}
      />

      {/* CUSTOM INFO FORM */}
      <BottomCard
        showCard={showCustomInfoForm}
        title={'Add Custom Information'}
        className={`${showCustomInfoForm ? 'active' : ''} ${theme}`}
        onClose={() => setShowCustomInfoForm(false)}>
        <CustomCoparentInfo
          selectedChild={selectedCoparent}
          showForm={showCustomInfoForm}
          onClose={() => {
            setShowCustomInfoForm(false)
          }}
        />
      </BottomCard>

      {/* NEW COPARENT FORM */}
      <NewCoparentForm />

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container form`}>
        {/* COPARENT ICONS CONTAINER */}
        <div id="coparent-container">
          {selectedCoparent &&
            Manager.isValid(userCoparents, true) &&
            userCoparents.map((coparent, index) => {
              return (
                <div
                  onClick={() => setSelectedCoparent(coparent)}
                  className={selectedCoparent && selectedCoparent.phone === coparent.phone ? 'active coparent' : 'coparent'}
                  data-phone={coparent.phone}
                  data-name={coparent.name}
                  key={index}>
                  <span className="material-icons-round">escalator_warning</span>
                  <span className="coparent-name">{coparent.name.formatNameFirstNameOnly()}</span>
                  <span className="coparent-type">
                    {coparent.parentType
                      .replace('Biological Parent', 'Bio')
                      .replace('Biological', 'Bio')
                      .replace('Step-Parent', 'Step')
                      .replace('SpousesCoparent', "Spouse's Coparent")}
                  </span>
                </div>
              )
            })}
        </div>

        {/* COPARENT INFO */}
        {
          <div id="coparent-info">
            {selectedCoparent && (
              <div className="form">
                <div className="info-section section">
                  <div className="flex input">
                    {selectedCoparent && (
                      <a className="directions-icon" href={Manager.getDirectionsLink(selectedCoparent.address)}>
                        <span className="material-icons-round">directions</span>
                      </a>
                    )}
                    <Autocomplete
                      key={Manager.getUid()}
                      defaultValue={selectedCoparent.address}
                      apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                      options={{
                        types: ['geocode', 'establishment'],
                        componentRestrictions: { country: 'usa' },
                      }}
                      className="mb-15"
                      onPlaceSelected={(place) => {
                        update('address', place.formatted_address)
                      }}
                    />
                    <span className="material-icons-outlined delete-icon" onClick={() => deleteProp('address')}>
                      delete
                    </span>
                  </div>
                  <div className="flex input">
                    <DebounceInput
                      className="mb-20"
                      key={Manager.getUid()}
                      value={selectedCoparent.phone}
                      placeholder={'Enter updated phone number'}
                      minLength={2}
                      debounceTimeout={1000}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                    <span className="material-icons-outlined delete-icon" onClick={() => deleteProp('phone')}>
                      delete
                    </span>
                  </div>
                  {customValues &&
                    customValues.length > 0 &&
                    customValues.map((prop, index) => {
                      const infoLabel = prop[0]
                      const value = prop[1].replace('_custom', '')
                      return (
                        <div key={index} className="flex input">
                          <DebounceInput
                            className="mb-15"
                            key={Manager.getUid()}
                            value={value}
                            placeholder={infoLabel.camelCaseToString(infoLabel)}
                            minLength={2}
                            debounceTimeout={1000}
                            onChange={(e) => {
                              const inputValue = e.target.value
                              if (inputValue.length > 0) {
                                update(infoLabel, `${inputValue}_custom`)
                              } else {
                                update(infoLabel, '_custom')
                              }
                            }}
                          />
                          <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                            delete
                          </span>
                        </div>
                      )
                    })}

                  {/* BUTTONS */}
                  <button
                    className="button w-60 default center white-text mb-10 green"
                    onClick={() => {
                      setShowCustomInfoForm(true)
                    }}>
                    Add Your Own Info <span className="material-icons">auto_fix_high</span>
                  </button>
                  <button
                    className="button w-60 no-border default red center"
                    onClick={(e) => {
                      setConfirmTitle(`Deleting ${selectedCoparent.name}`)
                    }}>
                    Remove Coparent <span className="material-icons">person_remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </>
  )
}
