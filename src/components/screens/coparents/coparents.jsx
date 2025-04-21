// Path: src\components\screens\parents\parents.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
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
import StringManager from '/src/managers/stringManager'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import Modal from '../../shared/modal'
import EmailManager from '../../../managers/emailManager'
import Spacer from '../../shared/spacer'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import InputTypes from '../../../constants/inputTypes'
import useCoparents from '../../../hooks/useCoparents'
import useCurrentUser from '../../../hooks/useCurrentUser'

export default function Coparents() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const {coparents} = useCoparents()

  // State
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [activeCoparent, setActiveCoparent] = useState(coparents?.[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')

  const DeleteProp = async (prop) => await DB_UserScoped.deleteCoparentInfoProp(currentUser, StringManager.formatDbProp(prop), activeCoparent)

  const Update = async (prop, value) => {
    await DB_UserScoped.updateCoparent(currentUser, activeCoparent, StringManager.formatDbProp(prop), value)
    setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
  }

  const DeleteCoparent = async () => {
    await DB_UserScoped.deleteCoparent(currentUser, activeCoparent)
    setState({...state, successAlertMessage: `${activeCoparent?.name} has been unlinked from your profile`})
    setActiveCoparent(coparents?.[0])
  }

  useEffect(() => {
    if (Manager.isValid(coparents) && !Manager.isValid(activeCoparent)) {
      setActiveCoparent(coparents?.[0])
    }
  }, [coparents])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo
        hideCard={() => setShowCustomInfoCard(false)}
        onAdd={(coparent) => setActiveCoparent(coparent)}
        activeCoparent={activeCoparent}
        showCard={showCustomInfoCard}
      />

      {/* NEW COPARENT FORM */}
      <NewCoparentForm showCard={showNewCoparentFormCard} hideCard={() => setShowNewCoparentFormCard(false)} />

      {/*  SCREEN ACTIONS */}
      <ScreenActionsMenu>
        {/* ADD COPARENT */}
        <div
          className="action-item"
          onClick={() => {
            setShowNewCoparentFormCard(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <IoPersonAdd className={'add-coparent fs-22'} />
            </div>
            <p>
              Enable Sharing & Info Storage
              <span className="subtitle">
                Store information and provide sharing permissions <b>for a co-parent who that has not been added to your profile</b> yet
              </span>
            </p>
          </div>
        </div>

        {/* ONLY SHOW IF THERE ARE CO-PARENTS  */}
        {Manager.isValid(coparents) && (
          <>
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
                AlertManager.confirmAlert(
                  `Are you sure you would like to unlink ${activeCoparent?.name} from your profile?`,
                  "I'm Sure",
                  true,
                  async () => {
                    await DeleteCoparent()
                  }
                )
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <IoPersonRemove className={'remove-user'} />
                </div>

                <p>
                  Unlink {activeCoparent?.name} from Your Profile
                  <span className="subtitle">Remove sharing permissions for {activeCoparent?.name} along with the information stored about them</span>
                </p>
              </div>
            </div>
          </>
        )}

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
      <div id="parents-container" className={`${theme} page-container parents-wrapper`}>
        <Fade direction={'up'} duration={1000} className={'parents-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Co-Parents</p>
          </div>
          <p>Maintain accessible records of important information regarding your co-parent.</p>
        </Fade>

        {/* COPARENT ICONS CONTAINER */}
        <div id="coparent-container">
          {Manager.isValid(coparents) &&
            coparents?.map((coparent, index) => {
              const coparentKey = activeCoparent?.userKey
              return (
                <div
                  onClick={() => setActiveCoparent(coparent)}
                  className={coparentKey && coparentKey === coparent?.userKey ? 'active coparent' : 'coparent'}
                  key={index}>
                  <span className="coparent-name">{StringManager.getFirstNameOnly(coparent?.name)?.[0]}</span>
                </div>
              )
            })}
        </div>

        {/* NO DATA FALLBACK */}
        {!Manager.isValid(coparents) && <NoDataFallbackText text={'You have not added any co-parents to your profile yet'} />}

        {/* COPARENT INFO */}
        <div id="coparent-info" key={activeCoparent?.key}>
          <p id="coparent-name-primary">{StringManager.getFirstNameOnly(activeCoparent?.name)}</p>
          <p id="coparent-type-primary"> {activeCoparent?.parentType}</p>
          {Manager.isValid(activeCoparent) && (
            <Fade direction={'right'} className={'parents-info-fade-wrapper'} duration={800} damping={0.08} triggerOnce={false} cascade={true}>
              {/* ITERATE COPARENT INFO */}
              {Manager.isValid(activeCoparent) &&
                Object.entries(activeCoparent).map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.FormatTitle(infoLabel, true)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key', 'id', 'user key']

                  return (
                    <div key={index}>
                      {/* ADDRESS */}
                      {infoLabel.toLowerCase().includes('address') && (
                        <InputWrapper
                          defaultValue={value}
                          inputType={InputTypes.address}
                          labelText={'Home Address'}
                          onChange={(address) => Update('address', address).then((r) => r)}
                        />
                      )}

                      {/* TEXT INPUT */}
                      {!inputsToSkip.includes(infoLabel.toLowerCase()) && !infoLabel.toLowerCase().includes('address') && (
                        <>
                          <div className="flex input">
                            <InputWrapper
                              hasBottomSpacer={false}
                              defaultValue={value}
                              onChange={(e) => {
                                const inputValue = e.target.value
                                Update(infoLabel, `${inputValue}`).then((r) => r)
                              }}
                              inputType={InputTypes.text}
                              labelText={infoLabel}
                            />
                            <PiTrashSimpleDuotone className="delete-icon fs-24" onClick={() => DeleteProp(infoLabel)} />
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                    </div>
                  )
                })}
            </Fade>
          )}
        </div>
      </div>

      {/* NAVBAR */}
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>Actions</p>
        </div>
      </NavBar>
    </>
  )
}