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
import {
  toCamelCase,
  formatTitleWords,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  lowercaseShouldBeLowercase,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [coparentData, setCoparentData] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')
  const [showNewCoparentForm, setShowNewCoparentForm] = useState(false)

  const deleteProp = async (prop) => await DB_UserScoped.deleteCoparentInfoProp(currentUser, prop, selectedCoparent)

  const update = async (prop, value) => {
    // Update DB
    successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateCoparent(currentUser, selectedCoparent, prop, value)
    setSelectedCoparent(updatedChild)
  }

  const deleteCoparent = async () => {
    await DB_UserScoped.deleteCoparent(currentUser, selectedCoparent)
  }

  const getCoparents = async () => {
    let all = []
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, 'coparents').then((coparent) => {
      all.push(coparent)
    })
    all = all[0]
    setSelectedCoparent(all[0])
    all = all.filter((x) => x !== 'address')
    setUserCoparents(all)
  }

  const onValueChange = async () => {
    if (currentUser) {
      const dbRef = getDatabase()
      const userRef = ref(dbRef, `${DB.tables.users}`)
      onValue(userRef, async (snapshot) => {
        await getCoparents()
      })
    }
  }

  useEffect(() => {
    if (selectedCoparent) {
      setCoparentData(Object.entries(selectedCoparent))
    } else {
      if (Manager.isValid(currentUser?.coparents, true)) {
        setCoparentData(Object.entries(currentUser?.coparents[0]))
        setSelectedCoparent(currentUser?.coparents[0])
      }
    }
  }, [selectedCoparent])

  useEffect(() => {
    if (currentUser) {
      onValueChange().then((r) => r)
    }
    Manager.showPageContainer()

    const autocompleteInput = document.querySelector('.pac-target-input')
    if (autocompleteInput) {
      document.querySelector('.pac-target-input').setAttribute('placeholder', 'Enter updated address')
    }
    setState({
      ...state,
      navbarButton: {
        ...navbarButton,
        action: () => {
          setShowNewCoparentForm(true)
        },
      },
    })
  }, [])

  return (
    <>
      <Confirm
        onAccept={async () => {
          await deleteCoparent()
          setConfirmTitle('')
        }}
        onCancel={() => setConfirmTitle('')}
        onReject={() => setConfirmTitle('')}
        title={confirmTitle}
        message={`Are you sure you would like to delete ${Manager.isValid(selectedCoparent) ? selectedCoparent.name + '?' : ''}`}
      />

      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo
        showCard={showCustomInfoCard}
        hideCard={() => {
          setShowCustomInfoCard(false)
        }}
      />

      {!selectedCoparent && <p className="dead-center">No coparents at this time</p>}

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentForm} hideCard={() => setShowNewCoparentForm(false)} />

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
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
        <div id="coparent-info">
          {selectedCoparent && (
            <div className="form">
              {Manager.isValid(coparentData) &&
                coparentData.map((propArray, index) => {
                  let infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(propArray[0])))
                  infoLabel = formatTitleWords(infoLabel)
                  const value = propArray[1]
                  return (
                    <div key={index}>
                      {infoLabel !== 'Id' && (
                        <div className="row">
                          <label className="w-100">{infoLabel}</label>
                          <div className="flex input">
                            {contains(infoLabel.toLowerCase(), 'address') && (
                              <Autocomplete
                                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                                options={{
                                  types: ['geocode', 'establishment'],
                                  componentRestrictions: { country: 'usa' },
                                }}
                                onPlaceSelected={async (place) => {
                                  await update('address', place.formatted_address)
                                }}
                                placeholder={Manager.isValid(selectedCoparent.address) ? selectedCoparent.address : 'Location'}
                              />
                            )}
                            {!contains(infoLabel.toLowerCase(), 'address') && (
                              <DebounceInput
                                value={value}
                                minLength={2}
                                debounceTimeout={1000}
                                onChange={async (e) => {
                                  const inputValue = e.target.value
                                  await update(infoLabel, `${inputValue}`)
                                }}
                              />
                            )}
                            <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                              delete
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* BUTTONS */}
              <button
                className="button w-60 default center white-text mb-10 green"
                onClick={() => {
                  setShowCustomInfoCard(true)
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
          )}
        </div>
      </div>
    </>
  )
}
