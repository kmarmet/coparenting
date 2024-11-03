import { getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '@db'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoparentForm from './newCoparentForm'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  formatTitleWords,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  lowercaseShouldBeLowercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import { MdOutlinePersonAddAlt1 } from 'react-icons/md'
import { IoMdRemoveCircle } from 'react-icons/io'
import BottomCard from '../../shared/bottomCard'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [coparentData, setCoparentData] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [activeCoparentInfo, setActiveCoparentInfo] = useState(null)
  const deleteProp = async (prop) => {
    console.log(selectedCoparent)
    await DB_UserScoped.deleteCoparentInfoProp(currentUser, Manager.toCamelCase(prop), selectedCoparent)
  }

  const update = async (prop, value) => {
    // Update DB
    successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateCoparent(currentUser, selectedCoparent, Manager.toCamelCase(prop), value)
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
      const userRef = ref(dbRef, `${DB.tables.users}/${currentUser.phone}/coparents`)
      onValue(userRef, async (snapshot) => {
        await getCoparents()
      })
    }
  }

  const formatParentType = (type) => {
    if (type) {
      type = type
        .replace('Biological Parent', 'Bio')
        .replace('Biological', 'Bio')
        .replace('Step-Parent', 'Step')
        .replace('SpousesCoparent', "Spouse's Co-parent")
    }
    return type
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
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowNewCoparentFormCard(true)
          },
          icon: <MdOutlinePersonAddAlt1 />,
        },
      })
    }, 300)
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
      <BottomCard title={'Add Custom Info'} showCard={showCustomInfoCard} onClose={() => setShowCustomInfoCard(false)}>
        <CustomCoparentInfo
          hideCard={() => setShowCustomInfoCard(false)}
          activeCoparent={selectedCoparent}
          setActiveCoparent={(coparent) => setActiveCoparentInfo(coparent)}
        />
      </BottomCard>

      {!selectedCoparent && <p className="dead-center">No coparents at this time</p>}

      {/* NEW COPARENT FORM */}
      <BottomCard title={'Add Co-Parent'} showCard={showNewCoparentFormCard} onClose={() => setShowNewCoparentFormCard(false)}>
        <NewCoparentForm hideCard={() => setShowNewCoparentFormCard(false)} />
      </BottomCard>

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
                  <span className="coparent-name">{formatNameFirstNameOnly(coparent.name)}</span>
                  <span className="coparent-type">{formatParentType(coparent.parentType)}</span>
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
                            <IoMdRemoveCircle className="material-icons-outlined delete-icon fs-24" onClick={() => deleteProp(infoLabel)} />
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
                Remove Co-parent <span className="material-icons">person_remove</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
