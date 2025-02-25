// Path: src\components\screens\coparents\coparents.jsx
import { getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoparentForm from './newCoparentForm'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { IoPersonRemove } from 'react-icons/io5'
import { Fade } from 'react-awesome-reveal'
import { IoMdRemoveCircle } from 'react-icons/io'
import NavBar from '/src/components/navBar.jsx'
import { BsPersonAdd } from 'react-icons/bs'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import DomManager from '/src/managers/domManager'
import StringManager from '/src/managers/stringManager.coffee'
import { PiUserCircleDuotone } from 'react-icons/pi'
import AddressInput from '../../shared/addressInput'
import BottomCard from '../../shared/bottomCard'
import EmailManager from '../../../managers/emailManager'
import { BsFillSendFill } from 'react-icons/bs'
import Spacer from '../../shared/spacer'
import Actions from '../../shared/actions'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparentDataArray, setSelectedCoparentDataArray] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [selectedCoparentRaw, setSelectedCoparentRaw] = useState()
  const [currentCoparentAddress, setCurrentCoparentAddress] = useState('')
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')
  const [hideActions, setHideActions] = useState(true)

  const deleteProp = async (prop) => {
    const coparent = await getCoparent()
    await DB_UserScoped.deleteCoparentInfoProp(currentUser, StringManager.formatDbProp(prop), coparent)
    setSelectedCoparentDataArray(Object.entries(coparent))
  }

  const getCoparent = async () => {
    let coparents = await DB.getTable(`${DB.tables.users}/${currentUser.key}/coparents`)
    const keyArray = selectedCoparentDataArray.find((x) => x[0] === 'key')
    const key = keyArray[1]
    return coparents.filter((x) => x.key === key)[0]
  }

  const update = async (prop, value) => {
    AlertManager.successAlert('Updated!')
    const coparent = await getCoparent()
    await DB_UserScoped.updateCoparent(currentUser, coparent, StringManager.formatDbProp(prop), value)
    const updatedCoparent = await getCoparent()
    console.log(updatedCoparent)
    setSelectedCoparentDataArray(Object.entries(updatedCoparent))
  }

  const deleteCoparent = async () => {
    const coparent = await getCoparent()
    await DB_UserScoped.deleteCoparent(currentUser, coparent)
    await getCoparents()
  }

  const getCoparents = async () => {
    let coparents = await DB.getTable(`${DB.tables.users}/${currentUser.key}/coparents`)
    coparents = DatasetManager.getValidArray(coparents)
    setUserCoparents(coparents)
    setTimeout(() => {
      if (Manager.isValid(currentUser?.coparents)) {
        setSelectedCoparentDataArray(Object.entries(coparents[0]))
        setSelectedCoparentRaw(coparents[0])
      }
    }, 300)
  }

  const onTableChange = async () => {
    if (currentUser) {
      const dbRef = getDatabase()
      const userRef = ref(dbRef, `${DB.tables.users}/${currentUser?.key}/coparents`)
      onValue(userRef, async () => {
        await getCoparents()
      })
    }
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  useEffect(() => {
    if (showCustomInfoCard || showInvitationForm || showNewCoparentFormCard) {
      setHideActions(true)
    }
    else {
      setHideActions(false)
    }
  }, [showCustomInfoCard, showInvitationForm, showNewCoparentFormCard])

  return (
    <>
      <Actions hide={hideActions}>
        <button
          className="button default center green"
          onClick={() => {
            setShowCustomInfoCard(true)
          }}>
          Add Your Own Info <FaWandMagicSparkles />
        </button>
        <button
          className="button default center red"
          onClick={() => {
            AlertManager.confirmAlert(`Are you sure you would like to remove this co-parent?`, "I'm Sure", true, async () => {
              await deleteCoparent()
              AlertManager.successAlert('Co-Parent Removed')
              setSelectedCoparentDataArray(null)
            })
          }}>
          Remove Co-Parent <IoPersonRemove />
        </button>
        <button className="default button center" onClick={() => setShowInvitationForm(true)}>
          Invite Co-Parent <BsFillSendFill />
        </button>
      </Actions>

      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo hideCard={() => setShowCustomInfoCard(false)} activeCoparent={selectedCoparentRaw} showCard={showCustomInfoCard} />

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      <BottomCard
        submitText={'Send Invitation'}
        wrapperClass="invite-coparent-card"
        title={'Invite Co-Parent'}
        onClose={() => setShowInvitationForm(false)}
        showCard={showInvitationForm}
        onSubmit={() => {
          if (!Manager.isValid(invitedCoparentEmail) || !Manager.isValid(invitedCoparentName)) {
            AlertManager.throwError('Please field out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', invitedCoparentEmail, invitedCoparentName)
          AlertManager.successAlert('Invitation Sent!')
          setShowInvitationForm(false)
        }}
        hideCard={() => setShowInvitationForm(false)}>
        <InputWrapper labelText={'Co-Parent Name'} required={true} onChange={(e) => setInvitedCoparentName(e.target.value)} />
        <InputWrapper labelText={'Co-Parent Email Address'} required={true} onChange={(e) => setInvitedCoparentEmail(e.target.value)} />
      </BottomCard>

      {/*{!selectedCoparentDataArray && <NoDataFallbackText text={'No Co-Parents Added'} />}*/}
      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Co-Parents </p>
            {!DomManager.isMobile() && <BsPersonAdd id={'add-new-button'} onClick={() => setShowNewCoparentFormCard(true)} />}
          </div>
          <p>Maintain accessible records of important information regarding your co-parent.</p>
          {/* COPARENT ICONS CONTAINER */}
          <div id="coparent-container">
            {selectedCoparentDataArray &&
              Manager.isValid(userCoparents) &&
              userCoparents.map((coparent, index) => {
                const coparentPhone = selectedCoparentDataArray.filter((x) => Manager.contains(x, 'phone'))[0][1]
                return (
                  <div
                    onClick={() => {
                      setCurrentCoparentAddress(coparent.address)
                      setSelectedCoparentDataArray(Object.entries(coparent))
                      setSelectedCoparentRaw(coparent)
                    }}
                    className={coparentPhone && coparentPhone === coparent.key ? 'active coparent' : 'coparent'}
                    data-phone={coparent.key}
                    data-name={coparent.name}
                    key={index}>
                    <PiUserCircleDuotone />
                    <span className="coparent-name">{StringManager.getFirstNameOnly(coparent.name)}</span>
                    <span className="coparent-type">{coparent.parentType}</span>
                  </div>
                )
              })}
          </div>

          {!Manager.isValid(selectedCoparentDataArray) && <NoDataFallbackText text={'You have not added any co-parents yet'} />}

          {/* COPARENT INFO */}
          <div id="coparent-info">
            <div className="form">
              {/* ITERATE COPARENT INFO */}
              {Manager.isValid(selectedCoparentDataArray) &&
                selectedCoparentDataArray.map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.formatTitleWords(infoLabel)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key']
                  return (
                    <div key={index}>
                      {infoLabel !== 'Id' && (
                        <div className="row">
                          <div className="flex input">
                            {/* LOCATION */}
                            {infoLabel.toLowerCase().includes('address') && (
                              <InputWrapper inputType={'date'} labelText={infoLabel}>
                                <AddressInput
                                  defaultValue={value}
                                  onSelection={async (place) => {
                                    await update('address', place)
                                  }}
                                />
                              </InputWrapper>
                            )}

                            {/* TEXT INPUT */}
                            {!inputsToSkip.includes(infoLabel.toLowerCase()) && (
                              <>
                                <InputWrapper
                                  defaultValue={value}
                                  onChange={async (e) => {
                                    const inputValue = e.target.value
                                    await update(infoLabel, `${inputValue}`)
                                  }}
                                  inputType={'input'}
                                  labelText={StringManager.addSpaceBetweenWords(infoLabel)}></InputWrapper>
                                <IoMdRemoveCircle className="material-icons-outlined delete-icon fs-24" onClick={() => deleteProp(infoLabel)} />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

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