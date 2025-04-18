// Path: src\components\screens\parents\parents.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import CustomParentInfo from './customParentInfo'
import {HiDotsHorizontal} from 'react-icons/hi'
import NewParentForm from './newParentForm'
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

export default function Parents() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state

  // State
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewParentFormCard, setShowNewParentFormCard] = useState(false)
  const [activeParent, setActiveParent] = useState(currentUser?.parents?.[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedParentName, setInvitedParentName] = useState('')
  const [invitedParentEmail, setInvitedParentEmail] = useState('')

  const DeleteProp = async (prop) => {
    const updatedCoparent = await DB_UserScoped.deleteParentInfoProp(currentUser, StringManager.formatDbProp(prop), activeParent)
    await SetActiveParentData(updatedCoparent)
  }

  const Update = async (prop, value) => {
    const updatedCoparent = await DB_UserScoped.updateParent(currentUser, activeParent, StringManager.formatDbProp(prop), value)
    setState({...state, successAlertMessage: `${StringManager.formatTitle(prop, true)} has been updated`})
    await SetActiveParentData(updatedCoparent)
  }

  const DeleteCoparent = async () => {
    await DB_UserScoped.deleteParent(currentUser, activeParent)
    setState({...state, successAlertMessage: `${activeParent?.name} has been unlinked from your profile`})
    setActiveParent(currentUser?.parents[0])
  }

  const SetActiveParentData = async (parent) => {
    const parentKey = parent?.userKey
    if (Manager.isValid(parentKey)) {
      const updatedParents = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/parents`)
      const updatedParent = updatedParents.find((x) => x.userKey === parentKey)
      setActiveParent(updatedParent)
    }
  }

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomParentInfo
        hideCard={() => setShowCustomInfoCard(false)}
        onAdd={(parent) => SetActiveParentData(parent)}
        activeCoparent={activeParent}
        showCard={showCustomInfoCard}
      />

      {/* NEW PARENT FORM */}
      <NewParentForm showCard={showNewParentFormCard} hideCard={() => setShowNewParentFormCard(false)} />

      {/*  SCREEN ACTIONS */}
      <ScreenActionsMenu>
        {/* ADD PARENT */}
        <div
          className="action-item"
          onClick={() => {
            setShowNewParentFormCard(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <IoPersonAdd className={'add-child fs-22'} />
            </div>
            <p>
              Add Parent to Your Profile
              <span className="subtitle">Include a parent in your profile to save their details and facilitate information sharing with them</span>
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
              <span className="subtitle">Include personalized details about {activeParent?.name}</span>
            </p>
          </div>
        </div>

        {/*  REMOVE PARENT */}
        <div
          className="action-item"
          onClick={() => {
            setState({...state, showScreenActions: false})
            AlertManager.confirmAlert(
              `Are you sure you would like to unlink ${activeParent?.name} from your profile?`,
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
              Unlink {activeParent?.name} from Your Profile
              <span className="subtitle">Remove all information about {activeParent?.name} from your profile</span>
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
            <div className="svg-wrapper invite-parent">
              <BsFillSendFill className={'paper-airplane'} />
            </div>
            <p>
              Invite Parent <span className="subtitle">Send invitation to a parent you would like to share information with</span>
            </p>
          </div>
        </div>
        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      <Modal
        submitText={'Send Invitation'}
        wrapperClass="invite-parent-card"
        title={'Invite Parent'}
        subtitle="Extend an invitation to a parent to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationForm(false)}
        showCard={showInvitationForm}
        onSubmit={() => {
          if (!Manager.isValid(invitedParentEmail) || !Manager.isValid(invitedParentName)) {
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.parentInvitation, '', invitedParentEmail, invitedParentName)
          AlertManager.successAlert('Invitation Sent!')
          setShowInvitationForm(false)
        }}
        hideCard={() => setShowInvitationForm(false)}>
        <Spacer height={5} />
        <InputWrapper inputType={InputTypes.text} labelText={'Parent Name'} required={true} onChange={(e) => setInvitedParentName(e.target.value)} />
        <InputWrapper
          inputType={InputTypes.text}
          labelText={'Parent Email Address'}
          required={true}
          onChange={(e) => setInvitedParentEmail(e.target.value)}
        />
      </Modal>

      {/* COPARENTS CONTAINER */}
      <div id="parents-container" className={`${theme} page-container parents-wrapper`}>
        <Fade direction={'up'} duration={1000} className={'parents-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title beside-action-button">Parents</p>
          </div>
          <p>Maintain accessible records of important information regarding your parent(s).</p>
        </Fade>

        {/* PARENT ICONS CONTAINER */}
        <div id="parent-container">
          {Manager.isValid(currentUser?.parents) &&
            currentUser?.parents?.map((parent, index) => {
              const parentKey = activeParent?.userKey
              return (
                <div
                  onClick={() => SetActiveParentData(parent)}
                  className={parentKey && parentKey === parent.userKey ? 'active parent' : 'parent'}
                  key={index}>
                  <span className="parent-name">{StringManager.getFirstNameOnly(parent.name)[0]}</span>
                </div>
              )
            })}
        </div>

        {/* NO DATA FALLBACK */}
        {!Manager.isValid(currentUser?.parents) && <NoDataFallbackText text={'You have not added or linked any parents to your profile yet'} />}

        {/* PARENT INFO */}
        <div id="parent-info" key={activeParent?.key}>
          <p id="parent-name-primary">{StringManager.getFirstNameOnly(activeParent?.name)}</p>
          <p id="parent-type-primary"> {activeParent?.parentType}</p>
          {Manager.isValid(activeParent) && (
            <Fade direction={'right'} className={'parents-info-fade-wrapper'} duration={800} damping={0.08} triggerOnce={false} cascade={true}>
              {/* ITERATE PARENT INFO */}
              {Manager.isValid(activeParent) &&
                Object.entries(activeParent).map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.formatTitle(infoLabel, true)
                  const value = propArray[1]
                  const inputsToSkip = ['address', 'key', 'id', 'linked key']

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