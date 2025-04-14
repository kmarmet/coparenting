// Path: src\components\screens\coparents\coparents.jsx
import React, {useContext, useState} from 'react'
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
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [activeCoparent, setActiveCoparent] = useState(currentUser?.coparents[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')

  const deleteProp = async (prop) => {
    const updatedCoparent = await DB_UserScoped.deleteCoparentInfoProp(currentUser, StringManager.formatDbProp(prop), activeCoparent)
    setActiveCoparent(updatedCoparent)
  }

  const update = async (prop, value) => {
    const updatedCoparent = await DB_UserScoped.updateCoparent(currentUser, activeCoparent, StringManager.formatDbProp(prop), value)
    setActiveCoparent(updatedCoparent)

    setState({...state, successAlertMessage: 'Updated'})
  }

  const deleteCoparent = async () => {
    await DB_UserScoped.deleteCoparent(currentUser, activeCoparent)
  }

  const setActiveCoparentData = async (coparent) => {
    const coparentKey = coparent?.key
    if (Manager.isValid(coparentKey)) {
      const updatedCoparents = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/coparents`)
      const updatedCoparent = updatedCoparents.find((x) => x.key === coparentKey)
      setActiveCoparent(updatedCoparent)
    }
  }

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo
        hideCard={() => setShowCustomInfoCard(false)}
        onAdd={(coparent) => setActiveCoparentData(coparent)}
        activeCoparent={activeCoparent}
        showCard={showCustomInfoCard}
      />

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
              <span className="subtitle">Include personalized details about {activeCoparent?.name}</span>
            </p>
          </div>
        </div>

        {/*  REMOVE COPARENT */}
        <div
          className="action-item"
          onClick={() => {
            setState({...state, showScreenActions: false})
            AlertManager.confirmAlert(`Are you sure you would like to remove ${activeCoparent?.name}`, "I'm Sure", true, async () => {
              await deleteCoparent()
              AlertManager.successAlert('Co-Parent Removed')
              setActiveCoparent(null)
            })
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <IoPersonRemove className={'remove-user'} />
            </div>

            <p>
              Unlink {activeCoparent?.name} from Your Profile
              <span className="subtitle">Remove all information about {activeCoparent?.name} from your profile</span>
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
      <div id="coparents-container" className={`${theme} page-container coparents-wrapper`}>
        <Fade direction={'up'} duration={1000} className={'coparents-fade-wrapper'} triggerOnce={true}>
          <></>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Co-Parents </p>
          </div>
          <p>Maintain accessible records of important information regarding your co-parent.</p>

          {/* COPARENT ICONS CONTAINER */}
          <div id="coparent-container">
            {Manager.isValid(currentUser?.coparents) &&
              currentUser?.coparents.map((coparent, index) => {
                const coparentKey = activeCoparent?.key
                return (
                  <div
                    onClick={() => setActiveCoparentData(coparent)}
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
            <p id="coparent-name-primary">{StringManager.getFirstNameOnly(activeCoparent?.name)}</p>
            <p id="coparent-type-primary"> {activeCoparent?.parentType}</p>
            <Fade direction={'right'} className={'coparents-info-fade-wrapper'} duration={800} damping={0.08} triggerOnce={false} cascade={true}>
              <></>
              {/* ITERATE COPARENT INFO */}
              {Manager.isValid(activeCoparent) &&
                Object.entries(activeCoparent).map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.formatTitle(infoLabel, true)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key', 'id']
                  return (
                    <div key={index}>
                      {/* LOCATION */}
                      {infoLabel.toLowerCase().includes('address') && (
                        <InputWrapper
                          defaultValue={value}
                          inputType={InputTypes.address}
                          labelText={'Home Address'}
                          onChange={async (address) => await update('address', address)}
                        />
                      )}

                      {/* TEXT INPUT */}
                      {!inputsToSkip.includes(infoLabel.toLowerCase()) && (
                        <>
                          <div className="flex input">
                            <InputWrapper
                              hasBottomSpacer={false}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await update(infoLabel, `${inputValue}`)
                              }}
                              inputType={InputTypes.text}
                              labelText={StringManager.addSpaceBetweenWords(infoLabel)}
                            />
                            <PiTrashSimpleDuotone className="delete-icon fs-24" onClick={() => deleteProp(infoLabel)} />
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                    </div>
                  )
                })}
            </Fade>
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