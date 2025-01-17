import { getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '../../../database/DB'
import Manager from '../../../managers/manager'
import DB_UserScoped from '../../../database/db_userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoparentForm from './newCoparentForm'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { IoPersonRemove } from 'react-icons/io5'
import { RiParentFill } from 'react-icons/ri'
import { Fade } from 'react-awesome-reveal'
import { IoMdRemoveCircle } from 'react-icons/io'
import NavBar from '../../navBar'
import { BsPersonAdd } from 'react-icons/bs'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import StringManager from '../../../managers/stringManager.coffee'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparentDataArray, setSelectedCoparentDataArray] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)

  const deleteProp = async (prop) => {
    let coparents = await DB.getTable(`${DB.tables.users}/${currentUser.phone}/coparents`)

    const coparentPhone = selectedCoparentDataArray.filter((x) => Manager.contains(x, 'phone'))[0][1]
    const coparent = coparents.filter((x) => x.phone === coparentPhone)[0]
    await DB_UserScoped.deleteCoparentInfoProp(currentUser, StringManager.formatDbProp(prop), coparent)
  }

  const update = async (prop, value) => {
    AlertManager.successAlert('Updated!')
    const updatedCoparent = await DB_UserScoped.updateCoparent(currentUser, selectedCoparentDataArray, StringManager.formatDbProp(prop), value)
    setSelectedCoparentDataArray(Object.entries(updatedCoparent))
  }

  const deleteCoparent = async () => {
    let coparents = await DB.getTable(`${DB.tables.users}/${currentUser.phone}/coparents`)
    const coparentPhone = selectedCoparentDataArray.filter((x) => Manager.contains(x, 'phone'))[0][1]
    const coparent = coparents.filter((x) => x.phone === coparentPhone)[0]
    await DB_UserScoped.deleteCoparent(currentUser, coparent)
    await getCoparents()
  }

  const getCoparents = async () => {
    let coparents = await DB.getTable(`${DB.tables.users}/${currentUser.phone}/coparents`)
    coparents = DatasetManager.getValidArray(coparents)
    setUserCoparents(coparents)
    console.log(Object.entries(coparents[0]))
    setTimeout(() => {
      setSelectedCoparentDataArray(Object.entries(coparents[0]))
    }, 300)
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

  useEffect(() => {
    onValueChange().then((r) => r)
  }, [])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo hideCard={() => setShowCustomInfoCard(false)} activeCoparent={selectedCoparentDataArray} showCard={showCustomInfoCard} />

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          {!selectedCoparentDataArray && <NoDataFallbackText text={'No Co-Parents Added'} />}
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Co-Parents </p>
            {!DomManager.isMobile() && <BsPersonAdd id={'add-new-button'} onClick={() => setShowNewCoparentFormCard(true)} />}
          </div>
          {/* COPARENT ICONS CONTAINER */}
          <div id="coparent-container">
            {selectedCoparentDataArray &&
              Manager.isValid(userCoparents) &&
              userCoparents.map((coparent, index) => {
                const coparentPhone = selectedCoparentDataArray.filter((x) => Manager.contains(x, 'phone'))[0][1]
                return (
                  <div
                    onClick={() => {
                      setSelectedCoparentDataArray(Object.entries(coparent))
                    }}
                    className={coparentPhone && coparentPhone === coparent.phone ? 'active coparent' : 'coparent'}
                    data-phone={coparent.phone}
                    data-name={coparent.name}
                    key={index}>
                    <RiParentFill />
                    {/*<span className="material-icons-round">escalator_warning</span>*/}
                    <span className="coparent-name">{StringManager.formatNameFirstNameOnly(coparent.name)}</span>
                    <span className="coparent-type">{coparent.parentType}</span>
                  </div>
                )
              })}
          </div>

          {selectedCoparentDataArray?.length === 0 && <NoDataFallbackText text={'You do not have any co-parents currently'} />}

          {/* COPARENT INFO */}
          <div id="coparent-info">
            <div className="form">
              {/* ITERATE COPARENT INFO */}
              {Manager.isValid(selectedCoparentDataArray) &&
                selectedCoparentDataArray.map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  const value = propArray[1]
                  console.log(infoLabel)
                  return (
                    <div key={index}>
                      {infoLabel !== 'Id' && (
                        <div className="row">
                          <div className="flex input">
                            {/* LOCATION */}
                            {Manager.contains(infoLabel.toLowerCase(), 'address') && (
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
                                  defaultValue={Manager.contains(infoLabel, 'Address') ? value : 'Home Address'}
                                />
                              </InputWrapper>
                            )}

                            {/* TEXT INPUT */}
                            {!Manager.contains(infoLabel.toLowerCase(), 'address') && (
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
                className="button  default center white-text mb-10 mt-20 green"
                onClick={() => {
                  setShowCustomInfoCard(true)
                }}>
                Add Your Own Info <FaWandMagicSparkles />
              </button>
              <button
                className="button   default red center"
                onClick={(e) => {
                  AlertManager.confirmAlert(`Are you sure you would like to remove this co-parent?`, "I'm Sure", true, async () => {
                    await deleteCoparent()
                    AlertManager.successAlert('Co-Parent Removed')
                    setSelectedCoparentDataArray(null)
                  })
                }}>
                Remove Co-Parent <IoPersonRemove />
              </button>
            </div>
          </div>
        </Fade>
      </div>
      {!showNewCoparentFormCard && !showCustomInfoCard && (
        <NavBar navbarClass={'calendar'}>
          <BsPersonAdd id={'add-new-button'} onClick={() => setShowNewCoparentFormCard(true)} />
        </NavBar>
      )}
    </>
  )
}