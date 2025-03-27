// Path: src\components\screens\coparents\coparents.jsx
import { getDatabase, onValue, ref } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import { HiDotsHorizontal } from 'react-icons/hi'
import NewCoparentForm from './newCoparentForm'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { IoClose, IoPersonAdd, IoPersonRemove } from 'react-icons/io5'
import { Fade } from 'react-awesome-reveal'
import NavBar from '/src/components/navBar.jsx'
import { BsFillSendFill, BsPersonAdd } from 'react-icons/bs'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import DomManager from '/src/managers/domManager'
import StringManager from '/src/managers/stringManager.coffee'
import { PiTrashSimpleDuotone, PiUserCircle, PiUserCircleDuotone } from 'react-icons/pi'
import AddressInput from '../../shared/addressInput'
import Modal from '../../shared/modal'
import EmailManager from '../../../managers/emailManager'
import Spacer from '../../shared/spacer'
import ScreenActionsMenu from '../../shared/screenActionsMenu'

export default function Coparents() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [selectedCoparentDataArray, setSelectedCoparentDataArray] = useState(null)
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [selectedCoparentRaw, setSelectedCoparentRaw] = useState()
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')

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

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo hideCard={() => setShowCustomInfoCard(false)} activeCoparent={selectedCoparentRaw} showCard={showCustomInfoCard} />

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      {/*  SCREEN ACTIONS */}
      <ScreenActionsMenu>
          <Fade direction={'right'} className={'fade-wrapper'} duration={800} damping={.2} triggerOnce={false} cascade={true}>
            {/* ADD COPARENT */}
            <div
              className="action-item"
              onClick={() => {
                setShowNewCoparentFormCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'add-child fs-22'} />
                </div>
                <p>
                  Add Co-Parent to Your Profile
                  <span className="subtitle">Include a co-parent in your profile to save their details and facilitate information sharing with them</span>
                </p>
              </div>
            </div>

            {/*  ADD CUSTOM INFO */}
            <div
              className="action-item"
              onClick={() => {
                setState({ ...state, showScreenActions: false })
                setShowCustomInfoCard(true)
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <FaWandMagicSparkles className={'magic'} />
                </div>
                <p>
                  Add your Own Info<span className="subtitle">Include personalized details about {selectedCoparentDataArray?.find(x => x[0] === 'name')[1]}</span>
                </p>
              </div>
            </div>

            {/*  REMOVE COPARENT */}
            <div
              className="action-item"
              onClick={() => {
                setState({ ...state, showScreenActions: false })
                AlertManager.confirmAlert(`Are you sure you would like to remove this co-parent?`, "I'm Sure", true, async () => {
                  await deleteCoparent()
                  AlertManager.successAlert('Co-Parent Removed')
                  setSelectedCoparentDataArray(null)
                })
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <IoPersonRemove className={'remove-user'} />
                </div>

                <p>
                  Unlink {selectedCoparentDataArray?.find(x => x[0] === 'name')[1]} from Your Profile
                   <span className="subtitle">Remove all information about {selectedCoparentDataArray?.find(x => x[0] === 'name')[1]} from your profile</span>
                </p>
              </div>
            </div>

            <div
              className="action-item"
              onClick={() => {
                setShowInvitationForm(true)
                setState({ ...state, showScreenActions: false })
              }}>
              <div className="content">
                <div className="svg-wrapper invite-coparent">
                  <BsFillSendFill className={'paper-airplane'} />
                </div>
                <p>
                  Invite Co-Parent <span className="subtitle">Send invitation to a co-parent you would like to share essential information with</span>
                </p>
              </div>
            </div>
          </Fade>
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
      </ScreenActionsMenu>

      <Modal
        submitText={'Send Invitation'}
        wrapperClass="invite-coparent-card"
        title={'Invite Co-Parent'}
        subtitle="Extend an invitation to a co-parent to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationForm(false)}
        showCard={showInvitationForm}
        onSubmit={() => {
          if (!Manager.isValid(invitedCoparentEmail) || !Manager.isValid(invitedCoparentName)) {
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', invitedCoparentEmail, invitedCoparentName)
          AlertManager.successAlert('Invitation Sent!')
          setShowInvitationForm(false)
        }}
        hideCard={() => setShowInvitationForm(false)}>
        <Spacer height={5} />
        <InputWrapper labelText={'Co-Parent Name'} required={true} onChange={(e) => setInvitedCoparentName(e.target.value)} />
        <InputWrapper labelText={'Co-Parent Email Address'} required={true} onChange={(e) => setInvitedCoparentEmail(e.target.value)} />
      </Modal>

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Co-Parents </p>
            {!DomManager.isMobile() && <BsPersonAdd id={'add-new-button'} onClick={() => setShowNewCoparentFormCard(true)} />}
          </div>
          <p>Maintain accessible records of important information regarding your co-parent.</p>

          {/* COPARENT ICONS CONTAINER */}
          <div id="coparent-container">
            {selectedCoparentDataArray &&
              Manager.isValid(userCoparents) &&
              userCoparents.map((coparent, index) => {
                const coparentKeyArray = selectedCoparentDataArray.find((x) => x[0] === 'key')
                const coparentKey = coparentKeyArray[1]
                return (
                  <div
                    onClick={() => {
                      setSelectedCoparentDataArray(Object.entries(coparent))
                      setSelectedCoparentRaw(coparent)
                    }}
                    className={coparentKey && coparentKey === coparent.key ? 'active coparent' : 'coparent'}
                    data-phone={coparent.key}
                    data-name={coparent.name}
                    key={index}>
                    {coparentKey === coparent.key ? <PiUserCircleDuotone /> : <PiUserCircle />}
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
              <Fade direction={'right'} className={'child-info-fade-wrapper'} duration={800} damping={.08} triggerOnce={false} cascade={true}>
              {/* ITERATE COPARENT INFO */}
              {Manager.isValid(selectedCoparentDataArray) &&
                selectedCoparentDataArray.map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.formatTitle(infoLabel, true, true)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key']
                  return (
                    <div key={index}>
                      {infoLabel !== 'Id' && (
                        <div className="row">
                          <div className="flex input">
                            {/* LOCATION */}
                            {infoLabel.toLowerCase().includes('address') && (
                              <InputWrapper inputType={'date'} labelText={value}>
                                <AddressInput
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
                                <PiTrashSimpleDuotone className="material-icons-outlined delete-icon fs-24" onClick={() => deleteProp(infoLabel)} />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </Fade>
            </div>
          </div>
        </Fade>
      </div>
      <NavBar navbarClass={'actions'}>
        <div  onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>Actions</p>
        </div>
      </NavBar>
    </>
  )
}