// Path: src\components\screens\parents\parents.jsx
import React, {useContext, useEffect, useRef, useState} from 'react'
import {BsFillSendFill} from 'react-icons/bs'
import {CgClose} from 'react-icons/cg'
import {FaWandMagicSparkles} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoPersonAdd, IoPersonRemove} from 'react-icons/io5'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import useCoParents from '../../../hooks/useCoParents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import EmailManager from '../../../managers/emailManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import NavBar from '../../navBar.jsx'
import AddressInput from '../../shared/addressInput'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import CustomCoparentInfo from './customCoparentInfo'
import NewCoParentForm from './newCoParentForm'

export default function CoParents() {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const {coParents} = useCoParents()

  // State
  const [showCustomInfoCard, setShowCustomInfoCard] = useState(false)
  const [showNewCoParentFormCard, setShowNewCoParentFormCard] = useState(false)
  const [activeCoParent, setActiveCoParent] = useState(coParents?.[0])
  const [showInvitationForm, setShowInvitationForm] = useState(false)

  const invite = useRef({name: '', email: ''})

  const DeleteProp = async (prop) => {
    const coparentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)
    if (Manager.IsValid(coparentIndex)) {
      await DB_UserScoped.DeleteCoparentInfoProp(currentUser?.key, coparentIndex, StringManager.formatDbProp(prop), activeCoParent)
    }
  }

  const Update = async (prop, value) => {
    const coParentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)

    if (!Manager.IsValid(coParentIndex)) {
      return
    }
    await DB_UserScoped.UpdateCoparent(currentUser?.key, coParentIndex, StringManager.formatDbProp(prop), value)
    setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
  }

  const DeleteCoParent = async () => {
    const coparentIndex = DB.GetTableIndexByUserKey(coParents, activeCoParent?.userKey)

    if (!Manager.IsValid(coparentIndex)) {
      return
    }
    await DB_UserScoped.DeleteCoparent(currentUser?.key, coparentIndex)
    await DB_UserScoped.DeleteSharedDataUserKey(currentUser, activeCoParent?.userKey)
  }

  const HandleCoParentChange = (coParent) => {
    setActiveCoParent(coParent)
    setShowCustomInfoCard(false)
    setState({...state, refreshKey: Manager.GetUid()})
  }

  useEffect(() => {
    if (!Manager.IsValid(coParents)) {
      setActiveCoParent(null)
    } else {
      if (Manager.IsValid(coParents) && !Manager.IsValid(activeCoParent)) {
        setActiveCoParent(coParents?.[0])
      }
      if (Manager.IsValid(activeCoParent) && Manager.IsValid(coParents)) {
        const coparentId = activeCoParent?.id
        const updatedCoparent = coParents?.find((x) => x?.id === coparentId)
        setActiveCoParent(updatedCoparent)
      }
    }
  }, [coParents])

  return (
    <>
      {/* CUSTOM INFO FORM */}
      <CustomCoparentInfo
        hideCard={() => setShowCustomInfoCard(false)}
        onAdd={(coParent) => setActiveCoParent(coParent)}
        activeCoparent={activeCoParent}
        showCard={showCustomInfoCard}
      />

      {/* NEW CO-PARENT FORM */}
      <NewCoParentForm showCard={showNewCoParentFormCard} hideCard={() => setShowNewCoParentFormCard(false)} />

      {/*  SCREEN ACTIONS */}
      <ScreenActionsMenu title="Manage Co-Parents">
        {/* ADD CO-PARENT */}
        <div
          className="action-item"
          onClick={() => {
            setShowNewCoParentFormCard(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <IoPersonAdd className={'add-co-parent fs-22'} />
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
        {Manager.IsValid(coParents) && (
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
                  <span className="subtitle">Include personalized details about {StringManager.GetFirstNameOnly(activeCoParent?.name)}</span>
                </p>
              </div>
            </div>

            {/*  REMOVE CO-PARENT */}
            <div
              className="action-item"
              onClick={() => {
                setState({...state, showScreenActions: false})
                AlertManager.confirmAlert(
                  `Are you sure you would like to unlink ${StringManager.GetFirstNameOnly(activeCoParent?.name)} from your profile?`,
                  "I'm Sure",
                  true,
                  async () => {
                    await DeleteCoParent()
                  }
                )
              }}>
              <div className="content">
                <div className="svg-wrapper">
                  <IoPersonRemove className={'remove-user'} />
                </div>

                <p>
                  Unlink {StringManager.GetFirstNameOnly(activeCoParent?.name)} from Your Profile
                  <span className="subtitle">
                    Remove sharing permissions for {StringManager.GetFirstNameOnly(activeCoParent?.name)} along with the information stored about them
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
            <div className="svg-wrapper invite-co-parent">
              <BsFillSendFill className={'paper-airplane'} />
            </div>
            <p>
              Invite Another Co-Parent
              <span className="subtitle">Send invitation to a co-parent you would like to share essential information with</span>
            </p>
          </div>
        </div>
      </ScreenActionsMenu>

      {/* INVITATION FORM */}
      <Form
        submitText={'Send Invitation'}
        wrapperClass="invite-co-parent-card"
        title={'Invite Co-Parent'}
        subtitle="Extend an invitation to a co-parent to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationForm(false)}
        showCard={showInvitationForm}
        onSubmit={() => {
          if (!Manager.IsValid(invite.current.name) || !Manager.IsValid(invite.current.email)) {
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', invite.current.name, invite.current.email)
          AlertManager.successAlert('Invitation Sent!')
          setShowInvitationForm(false)
        }}
        hideCard={() => setShowInvitationForm(false)}>
        <Spacer height={5} />
        <InputField
          inputType={InputTypes.text}
          placeholder={'Co-Parent Name'}
          required={true}
          onChange={(e) => (invite.current.name = e.target.value)}
        />
        <InputField
          inputType={InputTypes.email}
          placeholder={'Co-Parent Email Address'}
          required={true}
          onChange={(e) => (invite.current.email = e.target.value)}
        />
      </Form>

      {/* CO-PARENTS CONTAINER */}
      <div id="co-parents-container" className={`${theme} page-container parents-wrapper`}>
        <ScreenHeader title={'Co-Parents'} screenDescription=" Maintain accessible records of important information regarding your co-parent." />
        <Spacer height={10} />
        <div style={DomManager.AnimateDelayStyle(1)} className={`fade-up-wrapper ${DomManager.Animate.FadeInUp(true, '.fade-up-wrapper')}`}>
          <div className="screen-content">
            {/* CO-PARENT ICONS CONTAINER */}
            <div id="co-parent-container" key={activeCoParent?.id}>
              {Manager.IsValid(coParents) &&
                coParents?.map((coParent, index) => {
                  const coParentKey = activeCoParent?.userKey
                  return (
                    <div
                      onClick={() => HandleCoParentChange(coParent)}
                      className={coParentKey && coParentKey === coParent?.userKey ? 'active co-parent' : 'co-parent'}
                      key={index}>
                      <span className="co-parent-name">{StringManager.GetFirstNameAndLastInitial(coParent?.name)?.[0]}</span>
                    </div>
                  )
                })}
            </div>

            {/* CO-PARENT INFO */}
            <div id="co-parent-info" key={activeCoParent?.current?.userKey}>
              <p id="co-parent-name-primary">{StringManager.GetFirstNameAndLastInitial(activeCoParent?.name)}</p>
              <p id="co-parent-type-primary"> {activeCoParent?.parentType}</p>
              {/* ITERATE CO-PARENT INFO */}
              {Manager.IsValid(activeCoParent) &&
                Object.entries(activeCoParent).map((propArray, index) => {
                  let infoLabel = propArray[0]
                  infoLabel = StringManager.UppercaseFirstLetterOfAllWords(infoLabel)
                  infoLabel = StringManager.addSpaceBetweenWords(infoLabel)
                  infoLabel = StringManager.FormatTitle(infoLabel, true)
                  const value = propArray[1]
                  console.log(value)

                  const inputsToSkip = ['address', 'key', 'id', 'user key']

                  return (
                    <div key={index} className="info-row">
                      {/* ADDRESS */}
                      {infoLabel.toLowerCase().includes('address') && (
                        <AddressInput
                          key={activeCoParent?.id}
                          wrapperClasses={'address-input blue-background'}
                          defaultValue={value}
                          placeholder="Home Address"
                          onChange={(address) => Update('address', address)}
                        />
                      )}

                      {/* TEXT INPUT */}
                      {!inputsToSkip.includes(infoLabel.toLowerCase()) && !infoLabel.toLowerCase().includes('address') && (
                        <>
                          <div className="flex input">
                            <InputField
                              hasBottomSpacer={false}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await Update(infoLabel, `${inputValue}`).then((r) => r)
                                setActiveCoParent(activeCoParent)
                              }}
                              inputType={InputTypes.text}
                              placeholder={infoLabel}
                            />
                            <CgClose className={'close-x children'} onClick={() => DeleteProp(infoLabel)} />
                          </div>
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
      {!Manager.IsValid(coParents) && <NoDataFallbackText text={'You have not added any co-parents to your profile yet'} />}

      {/* NAVBAR */}
      <NavBar navbarClass={'actions'}>
        <div
          style={DomManager.AnimateDelayStyle(1, 0.06)}
          onClick={() => setState({...state, showScreenActions: true})}
          className={`menu-item ${DomManager.Animate.FadeInUp(true, '.menu-item')}`}>
          <HiDotsHorizontal className={'screen-actions-menu-icon more'} />
          <p>More</p>
        </div>
      </NavBar>
    </>
  )
}