// Path: src\components\screens\parents\parents.jsx
import NavBar from '/src/components/navBar.jsx'
import InputWrapper from '/src/components/shared/inputWrapper'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'
import React, {useContext, useEffect, useState} from 'react'
import {BsFillSendFill} from 'react-icons/bs'
import {CgClose} from 'react-icons/cg'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiOutlineChevronDoubleUp} from 'react-icons/hi2'
import {IoClose, IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB from '../../../database/DB'
import useCoparents from '../../../hooks/useCoparents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DomManager from '../../../managers/domManager'
import EmailManager from '../../../managers/emailManager'
import AddressInput from '../../shared/addressInput'
import Modal from '../../shared/modal'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoparentForm from './newCoparentForm'

export default function Coparents() {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {coparents, coparentsAreLoading} = useCoparents()

  // State
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoparentFormCard, setShowNewCoparentFormCard] = useState(false)
  const [activeCoparent, setActiveCoparent] = useState(coparents?.[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedCoparentName, setInvitedCoparentName] = useState('')
  const [invitedCoparentEmail, setInvitedCoparentEmail] = useState('')

  const DeleteProp = async (prop) => {
    const coparentIndex = DB.GetTableIndexByUserKey(coparents, activeCoparent?.userKey)
    if (Manager.IsValid(coparentIndex)) {
      await DB_UserScoped.DeleteCoparentInfoProp(currentUser?.key, coparentIndex, StringManager.formatDbProp(prop), activeCoparent)
    }
  }

  const Update = async (prop, value) => {
    const coparentIndex = DB.GetTableIndexByUserKey(coparents, activeCoparent?.userKey)

    if (!Manager.IsValid(coparentIndex)) {
      return
    }
    await DB_UserScoped.UpdateCoparent(currentUser?.key, coparentIndex, StringManager.formatDbProp(prop), value)
    setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
  }

  const DeleteCoparent = async () => {
    const coparentIndex = DB.GetTableIndexByUserKey(coparents, activeCoparent?.userKey)

    if (!Manager.IsValid(coparentIndex)) {
      return
    }
    await DB_UserScoped.DeleteCoparent(currentUser?.key, coparentIndex)
    await DB_UserScoped.DeleteSharedDataUserKey(currentUser, activeCoparent?.userKey)
  }

  useEffect(() => {
    if (!Manager.IsValid(coparents)) {
      setActiveCoparent(null)
    } else {
      if (Manager.IsValid(coparents) && !Manager.IsValid(activeCoparent)) {
        setActiveCoparent(coparents?.[0])
      }
      if (Manager.IsValid(activeCoparent) && Manager.IsValid(coparents)) {
        const coparentId = activeCoparent?.id
        const updatedCoparent = coparents?.find((x) => x?.id === coparentId)
        setActiveCoparent(updatedCoparent)
      }
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
              <IoPersonAdd className={'Add-coparent fs-22'} />
            </div>
            <p>
              Add a Co-Parent
              <span className="subtitle">
                Store information and provide sharing permissions for a co-parent who that has not been added to your profile yet
              </span>
            </p>
          </div>
        </div>

        {/* ONLY SHOW IF THERE ARE CO-PARENTS  */}
        {Manager.IsValid(coparents) && (
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
                  <span className="subtitle">Include personalized details about {StringManager.GetFirstNameOnly(activeCoparent?.name)}</span>
                </p>
              </div>
            </div>

            {/*  REMOVE COPARENT */}
            <div
              className="action-item"
              onClick={() => {
                setState({...state, showScreenActions: false})
                AlertManager.confirmAlert(
                  `Are you sure you would like to unlink ${StringManager.GetFirstNameOnly(activeCoparent?.name)} from your profile?`,
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
                  Unlink {StringManager.GetFirstNameOnly(activeCoparent?.name)} from Your Profile
                  <span className="subtitle">
                    Remove sharing permissions for {StringManager.GetFirstNameOnly(activeCoparent?.name)} along with the information stored about them
                  </span>
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
              Invite Another Co-Parent{' '}
              <span className="subtitle">Send invitation to a co-parent you would like to share essential information with</span>
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
          if (!Manager.IsValid(invitedCoparentEmail) || !Manager.IsValid(invitedCoparentName)) {
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
      <div id="coparents-container" className={`${theme} page-container parents-wrapper`}>
        <ScreenHeader
          screenDescription="Maintain accessible records of important information regarding your co-parent."
          title={'Co-Parents'}
          screenName={ScreenNames.coparents}
        />
        <div className="screen-content">
          <div style={DomManager.AnimateDelayStyle(1)} className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, '.fade-up-wrapper')}`}>
            {/* COPARENT ICONS CONTAINER */}
            <div id="coparent-container">
              {Manager.IsValid(coparents) &&
                coparents?.map((coparent, index) => {
                  const coparentKey = activeCoparent?.userKey
                  return (
                    <div
                      onClick={() => setActiveCoparent(coparent)}
                      className={coparentKey && coparentKey === coparent?.userKey ? 'active coparent' : 'coparent'}
                      key={index}>
                      <span className="coparent-name">{StringManager.GetFirstNameAndLastInitial(coparent?.name)?.[0]}</span>
                    </div>
                  )
                })}
            </div>

            {/* COPARENT INFO */}
            <div id="coparent-info" key={activeCoparent?.userKey}>
              <p id="coparent-name-primary">{StringManager.GetFirstNameAndLastInitial(activeCoparent?.name)}</p>
              <p id="coparent-type-primary"> {activeCoparent?.parentType}</p>
              {/* ITERATE COPARENT INFO */}
              {Manager.IsValid(activeCoparent) &&
                Object.entries(activeCoparent).map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.FormatTitle(infoLabel, true)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key', 'id', 'user key']

                  return (
                    <div key={index} className="info-row">
                      {/* ADDRESS */}
                      {infoLabel.toLowerCase().includes('address') && (
                        <AddressInput
                          className={'address-input'}
                          defaultValue={value}
                          labelText="Home Address"
                          onChange={(address) => Update('address', address)}
                        />
                      )}

                      {/* TEXT INPUT */}
                      {!inputsToSkip.includes(infoLabel.toLowerCase()) && !infoLabel.toLowerCase().includes('address') && (
                        <>
                          <div className="flex input">
                            <InputWrapper
                              hasBottomSpacer={false}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await Update(infoLabel, `${inputValue}`).then((r) => r)
                                setActiveCoparent(activeCoparent)
                              }}
                              inputType={InputTypes.text}
                              labelText={infoLabel}
                            />
                            <CgClose className="close-x fs-24" onClick={() => DeleteProp(infoLabel)} />
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
      {/* NO DATA FALLBACK */}
      {!Manager.IsValid(coparents) && <NoDataFallbackText text={'You have not added any co-parents to your profile yet'} />}

      {/* NAVBAR */}
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiOutlineChevronDoubleUp className={'screen-actions-menu-icon'} />
          <p>More</p>
        </div>
      </NavBar>
    </>
  )
}