import { getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '@db'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoparentForm from './newCoparentForm'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { IoPersonRemove } from 'react-icons/io5'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  formatTitleWords,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  lowercaseShouldBeLowercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import { IoMdRemoveCircle } from 'react-icons/io'
import NavBar from '../../navBar'
import { BsPersonAdd } from 'react-icons/bs'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [coparentData, setCoparentData] = useState([])
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)

  const deleteProp = async (prop) => {
    await DB_UserScoped.deleteCoparentInfoProp(currentUser, toCamelCase(prop), selectedCoparent)
  }

  const update = async (prop, value) => {
    // Update DB
    AlertManager.successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateCoparent(currentUser, selectedCoparent, toCamelCase(prop), value)
    setSelectedCoparent(updatedChild)
  }

  const deleteCoparent = async () => await DB_UserScoped.deleteCoparent(currentUser, selectedCoparent)

  const getCoparents = async (coparents) => {
    if (Manager.isValid(coparents, true)) {
      // setSelectedCoparent(coparents[0])
      setUserCoparents(coparents)
    } else {
      setSelectedCoparent(null)
    }
  }

  const onValueChange = async () => {
    if (currentUser) {
      const dbRef = getDatabase()
      const userRef = ref(dbRef, `${DB.tables.users}/${currentUser?.phone}/coparents`)
      onValue(userRef, async (snapshot) => {
        await getCoparents(snapshot.val())
      })
    }
  }

  const formatParentType = (type) => {
    if (type) {
      type = type
        .replace('Biological Parent', 'Bio')
        .replace('Biological', 'Bio')
        .replace('Step-Parent', 'Step')
        .replace("Partner's Co-Parent", "Partner's Co-parent")
    }
    return type
  }

  useEffect(() => {
    if (currentUser) {
      onValueChange().then((r) => r)
    }
    Manager.showPageContainer()

    setCoparentData(Object.entries(currentUser?.coparents[0]))
    setSelectedCoparent(currentUser?.coparents[0])
  }, [])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo hideCard={() => setShowCustomInfoCard(false)} activeCoparent={selectedCoparent} showCard={showCustomInfoCard} />

      {!selectedCoparent && <NoDataFallbackText text={'No Co-Parents Added'} />}

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
        <p className="screen-title">Co-Parents</p>
        {/* COPARENT ICONS CONTAINER */}
        <div id="coparent-container">
          {selectedCoparent &&
            Manager.isValid(userCoparents, true) &&
            userCoparents.map((coparent, index) => {
              return (
                <div
                  onClick={() => {
                    setSelectedCoparent(coparent)
                    setCoparentData(Object.entries(coparent))
                  }}
                  className={selectedCoparent && selectedCoparent.phone === coparent.phone ? 'active coparent' : 'coparent'}
                  data-phone={coparent.phone}
                  data-name={coparent.name}
                  key={index}>
                  <span className="material-icons-round">escalator_warning</span>
                  <span className="coparent-name">{formatNameFirstNameOnly(coparent.name)}</span>
                  <span className="coparent-type">{coparent.parentType}</span>
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
                          <div className="flex input">
                            {/* LOCATION */}
                            {contains(infoLabel.toLowerCase(), 'address') && (
                              <InputWrapper inputType={'date'} labelText={infoLabel}>
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
                              </InputWrapper>
                            )}

                            {/* TEXT INPUT */}
                            {!contains(infoLabel.toLowerCase(), 'address') && (
                              <InputWrapper
                                defaultValue={value}
                                onChange={async (e) => {
                                  const inputValue = e.target.value
                                  await update(infoLabel, `${inputValue}`)
                                }}
                                inputType={'input'}
                                labelText={infoLabel}></InputWrapper>
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
                className="button w-60 default center white-text mb-10 mt-20 green"
                onClick={() => {
                  setShowCustomInfoCard(true)
                }}>
                Add Your Own Info <FaWandMagicSparkles />
              </button>
              <button
                className="button w-60  default red center"
                onClick={(e) => {
                  AlertManager.confirmAlert(`Are you sure you would like to remove ${selectedCoparent.name}`, "I'm Sure", true, async () => {
                    await deleteCoparent()
                    AlertManager.successAlert('Co-Parent Removed')
                    setSelectedCoparent(null)
                  })
                }}>
                Remove Co-parent <IoPersonRemove />
              </button>
            </div>
          )}
        </div>
      </div>
      {!showNewCoparentFormCard && !showCustomInfoCard && (
        <NavBar navbarClass={'calendar'}>
          <BsPersonAdd id={'add-new-button'} onClick={() => setShowNewCoparentFormCard(true)} />
        </NavBar>
      )}
    </>
  )
}