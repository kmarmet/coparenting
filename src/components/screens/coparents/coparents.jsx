// Path: src\components\screens\coparents\coparents.jsx
import {getDatabase, onValue, ref} from 'firebase/database'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import CustomCoparentInfo from './customCoparentInfo'
import {HiDotsHorizontal} from 'react-icons/hi'
import NewCoparentForm from './newCoparentForm'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {IoClose, IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import {Fade} from 'react-awesome-reveal'
import NavBar from '/src/components/navBar.jsx'
import {BsFillSendFill} from 'react-icons/bs'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import StringManager from '/src/managers/stringManager.coffee'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import Modal from '../../shared/modal'
import EmailManager from '../../../managers/emailManager'
import Spacer from '../../shared/spacer'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import InputTypes from '../../../constants/inputTypes'

export default function Coparents() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state

  // State
  const [userCoparents, setUserCoparents] = useState([])
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [selectedCoparent, setSelectedCoparent] = useState()
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')

  const deleteProp = async (prop) => {
    await DB_UserScoped.deleteCoparentInfoProp(currentUser, StringManager.formatDbProp(prop), selectedCoparent)
  }

  const getCoparent = async () => {
    return await DB.getTable(`${DB.tables.users}/${currentUser.key}/coparents`)
  }

  const update = async (prop, value) => {
    await DB_UserScoped.updateCoparent(currentUser, selectedCoparent, StringManager.formatDbProp(prop), value).finally(() => {
      setState({...state, successAlertMessage: 'Updated'})
    })
  }

  const deleteCoparent = async () => {
    const coparent = await getCoparent()
    await DB_UserScoped.deleteCoparent(currentUser, coparent)
  }

  const onTableChange = async () => {
    if (currentUser) {
      const dbRef = getDatabase()
      const userRef = ref(dbRef, `${DB.tables.users}/${currentUser?.key}/coparents`)
      onValue(userRef, async (coparents) => {
        const activeCoparentKey = selectedCoparent?.key
        const updatedCoparents = coparents.val()
        console.log(activeCoparentKey)
        if (Manager.isValid(updatedCoparents)) {
          if (Manager.isValid(activeCoparentKey)) {
            const updatedCoparent = updatedCoparents.find((x) => x.key === activeCoparentKey)
            setSelectedCoparent(updatedCoparent)
          } else {
            setSelectedCoparent(updatedCoparents[0])
          }
        }
        setUserCoparents(updatedCoparents)
      })
    }
  }

  useEffect(() => {
    if (selectedCoparent) {
      console.log(selectedCoparent.key)
    }
  }, [selectedCoparent?.key])

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo hideCard={() => setShowCustomInfoCard(false)} activeCoparent={selectedCoparent} showCard={showCustomInfoCard} />

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      {/*  SCREEN ACTIONS */}
      <ScreenActionsMenu>
        {/*<Fade direction={'right'} className={'fade-wrapper'} duration={800} damping={.2} triggerOnce={false} cascade={true}>*/}
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
            setState({...state, showScreenActions: false})
            setShowCustomInfoCard(true)
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <FaWandMagicSparkles className={'magic'} />
            </div>
            <p>
              Add your Own Info
              <span className="subtitle">Include personalized details about {selectedCoparent?.name}</span>
            </p>
          </div>
        </div>

        {/*  REMOVE COPARENT */}
        <div
          className="action-item"
          onClick={() => {
            setState({...state, showScreenActions: false})
            AlertManager.confirmAlert(`Are you sure you would like to remove ${selectedCoparent?.name}`, "I'm Sure", true, async () => {
              await deleteCoparent()
              AlertManager.successAlert('Co-Parent Removed')
              setSelectedCoparent(null)
            })
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <IoPersonRemove className={'remove-user'} />
            </div>

            <p>
              Unlink {selectedCoparent?.name} from Your Profile
              <span className="subtitle">Remove all information about {selectedCoparent?.name} from your profile</span>
            </p>
          </div>
        </div>

        <div
          className="action-item"
          onClick={() => {
            setShowInvitationForm(true)
            setState({...state, showScreenActions: false})
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
        {/*</Fade>*/}
        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
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
        <InputWrapper
          inputType={InputTypes.text}
          labelText={'Co-Parent Name'}
          required={true}
          onChange={(e) => setInvitedCoparentName(e.target.value)}
        />
        <InputWrapper
          inputType={InputTypes.text}
          labelText={'Co-Parent Email Address'}
          required={true}
          onChange={(e) => setInvitedCoparentEmail(e.target.value)}
        />
      </Modal>

      {/* COPARENTS CONTAINER */}
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper form`}>
        <Fade direction={'up'} duration={1000} className={'coparents-fade-wrapper'} triggerOnce={true}>
          <></>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Co-Parents </p>
          </div>
          <p>Maintain accessible records of important information regarding your co-parent.</p>

          {/* COPARENT ICONS CONTAINER */}
          <div id="coparent-container">
            {Manager.isValid(userCoparents) &&
              userCoparents.map((coparent, index) => {
                const coparentKey = selectedCoparent?.key
                return (
                  <div
                    onClick={() => setSelectedCoparent(coparent)}
                    className={coparentKey && coparentKey === coparent.key ? 'active coparent' : 'coparent'}
                    data-name={coparent.name}
                    data-key={coparent?.key}
                    key={index}>
                    <span className="coparent-name">{StringManager.getFirstNameOnly(coparent.name)[0]}</span>
                  </div>
                )
              })}
          </div>

          {!Manager.isValid(currentUser?.coparents) && <NoDataFallbackText text={'You have not added any co-parents yet'} />}

          {/* COPARENT INFO */}
          <div id="coparent-info">
            <p id="coparent-name-primary">{StringManager.getFirstNameOnly(selectedCoparent?.name)}</p>
            <p id="coparent-type-primary"> {selectedCoparent?.parentType}</p>
            <div className="form">
              <Fade direction={'right'} className={'coparents-info-fade-wrapper'} duration={800} damping={0.08} triggerOnce={false} cascade={true}>
                <></>
                {/* ITERATE COPARENT INFO */}
                {Manager.isValid(selectedCoparent) &&
                  Object.entries(selectedCoparent).map((propArray, index) => {
                    let infoLabel = propArray[0]
                    infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                    infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                    infoLabel = StringManager.formatTitle(infoLabel, true)
                    const value = propArray[1]
                    const inputsToSkip = ['address', 'key']
                    return (
                      <div key={index}>
                        {infoLabel !== 'Id' && (
                          <div className="row">
                            <div className="flex input">
                              {/* LOCATION */}
                              {infoLabel.toLowerCase().includes('address') && (
                                <InputWrapper
                                  defaultValue={value}
                                  inputType={InputTypes.address}
                                  labelText={'Home Address'}
                                  onChange={(address) => update('address', address)}
                                />
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
                                    inputType={InputTypes.text}
                                    labelText={StringManager.addSpaceBetweenWords(infoLabel)}
                                  />
                                  <PiTrashSimpleDuotone className="delete-icon fs-24" onClick={() => deleteProp(infoLabel)} />
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
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>Actions</p>
        </div>
      </NavBar>
    </>
  )
}