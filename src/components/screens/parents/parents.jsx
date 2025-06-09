// Path: src\components\screens\parents\parents.jsx
import NavBar from '../../navBar'
import InputField from '../../shared/inputField'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import DB_UserScoped from '../../../database/db_userScoped'
import AlertManager from '../../../managers/alertManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import React, {useContext, useEffect, useState} from 'react'
import {BsFillSendFill} from 'react-icons/bs'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoClose, IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB from '../../../database/DB'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useParents from '../../../hooks/useParents'
import DomManager from '../../../managers/domManager'
import EmailManager from '../../../managers/emailManager'
import AddressInput from '../../shared/addressInput'
import Form from '../../shared/form'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import Spacer from '../../shared/spacer'
import CustomParentInfo from './customParentInfo'
import NewParentForm from './newParentForm'

export default function Parents() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {parents} = useParents()
  const {currentUser} = useCurrentUser()

  // State
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewParentFormCard, setShowNewParentFormCard] = useState(false)
  const [activeParent, setActiveParent] = useState(parents?.[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)
  const [invitedParentName, setInvitedParentName] = useState('')
  const [invitedParentEmail, setInvitedParentEmail] = useState('')

  const DeleteProp = async (prop) => await DB_UserScoped.deleteParentInfoProp(currentUser, StringManager.formatDbProp(prop), activeParent)

  const Update = async (prop, value) => {
    const parentIndex = DB.GetTableIndexById(parents, activeParent?.id)
    await DB_UserScoped.UpdateParent(currentUser?.key, parentIndex, StringManager.formatDbProp(prop), value)
    setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
  }

  const DeleteCoparent = async () => {
    await DB_UserScoped.DeleteParent(currentUser, activeParent)
    setState({...state, successAlertMessage: `${activeParent?.name} has been unlinked from your profile`, showScreenActions: false})
    setActiveParent(parents[0])
  }

  useEffect(() => {
    if (Manager.IsValid(parents)) {
      setActiveParent(parents[0])
    }
  }, [parents])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomParentInfo
        hideCard={() => setShowCustomInfoCard(false)}
        onAdd={(parent) => setActiveParent(parent)}
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
              <IoPersonAdd className={'Add-child fs-22'} />
            </div>
            <p>
              Add a Parent
              <span className="subtitle">
                Store information and provide sharing permissions for a parent who that has not been added to your profile yet
              </span>
            </p>
          </div>
        </div>

        {Manager.IsValid(parents) && (
          <>
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
                  <span className="subtitle">Remove sharing permissions for {activeParent?.name} along with the information stored about them</span>
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
          </>
        )}

        {/* INVITE */}
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
              Invite Another Parent <span className="subtitle">Send invitation to a parent you would like to share information with</span>
            </p>
          </div>
        </div>
        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      <Form
        submitText={'Send Invitation'}
        wrapperClass="invite-parent-card"
        title={'Invite Parent'}
        subtitle="Extend an invitation to a parent to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationForm(false)}
        showCard={showInvitationForm}
        onSubmit={() => {
          if (!Manager.IsValid(invitedParentEmail) || !Manager.IsValid(invitedParentName)) {
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.parentInvitation, '', invitedParentEmail, invitedParentName)
          setState({...state, successAlertMessage: `Invitation has been sent to ${invitedParentName}`})
          setShowInvitationForm(false)
        }}
        hideCard={() => setShowInvitationForm(false)}>
        <Spacer height={5} />
        <InputField inputType={InputTypes.text} placeholder={'Parent Name'} required={true} onChange={(e) => setInvitedParentName(e.target.value)} />
        <InputField
          inputType={InputTypes.text}
          placeholder={'Parent Email Address'}
          required={true}
          onChange={(e) => setInvitedParentEmail(e.target.value)}
        />
      </Form>

      {/* COPARENTS CONTAINER */}
      <div id="parents-container" className={`${theme} page-container parents-wrapper`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title beside-action-button">Parents</p>
        </div>
        <p>Maintain accessible records of important information regarding your parent(s).</p>

        <div className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, '.fade-up-wrapper')}`}>
          <>
            {/* PARENT ICONS CONTAINER */}
            <div id="parent-container">
              {Manager.IsValid(parents) &&
                parents?.map((parent, index) => {
                  const parentKey = activeParent?.userKey
                  return (
                    <div
                      onClick={() => setActiveParent(parent)}
                      className={parentKey && parentKey === parent.userKey ? 'active parent' : 'parent'}
                      key={index}>
                      <span className="parent-name">{StringManager.GetFirstNameOnly(parent.name)[0]}</span>
                    </div>
                  )
                })}
            </div>

            {/* PARENT INFO */}
            <div id="parent-info" key={activeParent?.key}>
              <p id="parent-name-primary">{StringManager.GetFirstNameOnly(activeParent?.name)}</p>
              <p id="parent-type-primary"> {activeParent?.parentType}</p>
              {/* ITERATE PARENT INFO */}
              {Manager.IsValid(activeParent) &&
                Object.entries(activeParent).map((propArray, index) => {
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
                          defaultValue={value}
                          placeholder={'Home Address'}
                          onChange={(address) => Update('address', address).then((r) => r)}
                        />
                      )}

                      {/* TEXT INPUT */}
                      {!inputsToSkip.includes(infoLabel.toLowerCase()) && !infoLabel.toLowerCase().includes('address') && (
                        <>
                          <div className="flex input">
                            <InputField
                              hasBottomSpacer={false}
                              defaultValue={value}
                              onChange={(e) => {
                                const inputValue = e.target.value
                                Update(infoLabel, `${inputValue}`).then((r) => r)
                              }}
                              inputType={InputTypes.text}
                              placeholder={infoLabel}
                            />
                            <PiTrashSimpleFill className="close-x fs-24" onClick={() => DeleteProp(infoLabel)} />
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          </>
        </div>
      </div>
      {/* NO DATA FALLBACK */}
      {!Manager.IsValid(parents) && <NoDataFallbackText text={'You have not added or linked any parents to your profile yet'} />}

      {/* NAVBAR */}
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon'} />
          <p>More</p>
        </div>
      </NavBar>
    </>
  )
}