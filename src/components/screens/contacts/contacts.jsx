import React, {useContext, useEffect, useState} from 'react'
import {GrEdit} from 'react-icons/gr'
import {HiOutlineChevronDoubleUp} from 'react-icons/hi2'
import {IoClose, IoPersonAdd} from 'react-icons/io5'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import useChildren from '../../../hooks/useChildren'
import useCoparents from '../../../hooks/useCoparents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useParents from '../../../hooks/useParents'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import EmailManager from '../../../managers/emailManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import Child from '../../../models/child/child'
import Coparent from '../../../models/coparent'
import NavBar from '../../navBar'
import DetailBlock from '../../shared/detailBlock'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import Map from '../../shared/map'
import Modal from '../../shared/modal'
import ScreenActionsMenu from '../../shared/screenActionsMenu'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import ViewSelector from '../../shared/viewSelector'
import NewChildForm from '../children/newChildForm'
import NewCoparentForm from '../coparents/newCoparentForm'
import NewParentForm from '../parents/newParentForm'

const Contacts = () => {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state

  // HOOKS
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()
  const {coparents} = useCoparents()
  const {parents} = useParents()
  const {users} = useUsers()

  // STATE
  const [activeContact, setActiveContact] = useState()
  const [showNewCoparentCard, setShowNewCoparentCard] = useState(false)
  const [showNewParentCard, setShowNewParentCard] = useState(false)
  const [showNewChildCard, setShowNewChildCard] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteeName, setInviteeName] = useState('')
  const [view, setView] = useState('details')
  const [updateObject, setUpdateObject] = useState({})

  // CONTACT UPDATE STATE
  const UpdateContact = async () => {
    const {model, propertyPath, inputValue} = updateObject
    let userIndex = DB.GetTableIndexById(children, activeContact?.id)
    let groupType = 'children'
    // Parents
    if (currentUser?.accountType === 'child' && GetAccountType() === 'parent') {
      userIndex = DB.GetTableIndexById(parents, activeContact?.id)
      groupType = 'parents'
    }

    // Coparents
    else if (currentUser?.accountType === 'parent' && GetAccountType() === 'parent') {
      userIndex = DB.GetTableIndexById(coparents, activeContact?.id)
      groupType = 'coparents'
    }

    // Database Update
    const updated = ObjectManager.UpdateObjectByModel(activeContact, propertyPath, inputValue, model)

    if (userIndex > -1 && Manager.IsValid(updated)) {
      await DB.ReplaceEntireRecord(`${DB.tables.users}/${currentUser?.key}/${groupType}/${userIndex}`, updated)
      setState({...state, successAlertMessage: `${StringManager.GetFirstNameOnly(activeContact?.name)} updated!`})
      setShowModal(false)
    }
  }

  const RemoveContact = async () => {
    AlertManager.confirmAlert(
      `Are you sure you want to remove ${StringManager.GetFirstNameOnly(activeContact?.name)} as a contact? \n\n Doing so will <b>remove them from your contact list, along with any information stored about them and sharing permissions.</b>`,
      `I'm Sure`,
      true,
      async () => {
        // Remove coparent
        if (currentUser?.accountType === 'parent' && activeContact?.accountType === 'parent') {
          let toRemove = coparents.find((x) => x.id === activeContact?.id)

          if (Manager.IsValid(toRemove)) {
            const coparentIndex = DB.GetTableIndexById(coparents, activeContact?.id)
            await DB_UserScoped.DeleteCoparent(currentUser, coparentIndex, toRemove?.userKey)
          }
        }

        // Remove parent
        else if (currentUser?.accountType === 'child' && activeContact?.accountType === 'parent') {
          let toRemove = parents.find((x) => x.id === activeContact?.id)

          if (Manager.IsValid(toRemove)) {
            const parentIndex = DB.GetTableIndexById(parents, activeContact?.id)
            await DB_UserScoped.DeleteParent(currentUser, parentIndex, toRemove?.userKey)
          }
        }

        // Remove child
        else {
          let toRemove = children.find((x) => x.id === activeContact?.id)

          if (Manager.IsValid(toRemove)) {
            const childIndex = DB.GetChildIndex(children, activeContact?.id)
            await DB_UserScoped.DeleteChild(currentUser, childIndex, toRemove?.userKey)
          }
        }

        setShowNewChildCard(false)
        setShowNewParentCard(false)
        setShowNewCoparentCard(false)
        setShowModal(false)
      }
    )
  }

  const GetContactName = () => {
    let name = activeContact?.name
    if (!Manager.IsValid(activeContact?.name)) {
      name = activeContact?.general?.name
    }
    return StringManager.GetFirstNameOnly(name)
  }

  const GetContactEmail = () => {
    let email = activeContact?.email
    if (!Manager.IsValid(activeContact?.email)) {
      email = activeContact?.general?.email
    }
    return email
  }

  const GetContactPhone = () => {
    let phone = activeContact?.phone
    if (!Manager.IsValid(activeContact?.phone)) {
      phone = activeContact?.general?.phone
    }
    return phone
  }

  const GetAccountType = () => {
    // eslint-disable-next-line no-prototype-builtins
    if (activeContact?.hasOwnProperty('general')) {
      return 'child'
    } else {
      return 'parent'
    }
  }

  // Remove view from the active modal
  useEffect(() => {
    if (showNewCoparentCard || showNewParentCard || showNewChildCard) {
      const activeModal = document.querySelector('#modal-wrapper.active')
      if (Manager.IsValid(activeModal)) {
        const modalCard = activeModal.querySelector('#modal-card')
        if (Manager.IsValid(modalCard)) {
          modalCard.classList.remove('details')
        }
      }
    }
  }, [showNewCoparentCard, showNewParentCard, showNewChildCard])

  return (
    <>
      {/* NEW */}
      <NewCoparentForm showCard={showNewCoparentCard} hideCard={() => setShowNewCoparentCard(false)} />
      <NewChildForm showCard={showNewChildCard} hideCard={() => setShowNewChildCard(false)} />
      <NewParentForm showCard={showNewParentCard} hideCard={() => setShowNewParentCard(false)} />

      {/* INVITATION FORM */}
      <Modal
        submitText={'Send Invitation'}
        wrapperClass="invitation-card"
        title={`Invite ${GetContactName()}`}
        subtitle="Extend an invitation to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationCard(false)}
        showCard={showInvitationCard}
        onSubmit={() => {
          if (!Manager.IsValid(inviteeEmail) || !Manager.IsValid(inviteeName)) {
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', inviteeEmail, inviteeName)
          setState({...state, successAlertMessage: 'Invitation Sent!'})
          setShowInvitationCard(false)
        }}
        hideCard={() => setShowInvitationCard(false)}>
        <Spacer height={5} />
        <InputWrapper inputType={InputTypes.text} labelText={'Name'} required={true} onChange={(e) => setInviteeName(e.target.value)} />
        <InputWrapper inputType={InputTypes.email} labelText={'Email Address'} required={true} onChange={(e) => setInviteeEmail(e.target.value)} />
      </Modal>

      {/* MODAL */}
      <Modal
        onSubmit={UpdateContact}
        activeView={view}
        onClose={() => setShowModal(false)}
        hideCard={() => setShowModal(false)}
        wrapperClass="contact-modal-wrapper"
        hasSubmitButton={view === 'edit'}
        hasDelete={true}
        onDelete={RemoveContact}
        deleteButtonText={`Remove`}
        submitText={'Update'}
        viewSelector={
          <ViewSelector
            onloadState={showModal}
            key={refreshKey}
            labels={['details', 'edit']}
            updateState={(labelText) => {
              setView(labelText)
            }}
          />
        }
        subtitle={`${!users?.map((x) => x?.key).includes(activeContact?.userKey) ? `${GetContactName()} has not created an account with us yet. Invite them to create an account to begin sharing with and receiving information from them.` : ''}`}
        title={`${GetContactName()}`}
        showCard={showModal}>
        {view === 'details' && <Spacer height={10} />}

        {/* DETAILS */}
        <div id="details" className={view === 'details' ? 'view-wrapper details active' : 'view-wrapper'}>
          <div className="blocks">
            <DetailBlock isCustom={true} isFullWidth={true} valueToValidate={activeContact} text={''} title={''}>
              <p>
                Add custom information about {GetContactName()} at&nbsp; the&nbsp;
                <span className="link" onClick={() => setState({...state, currentScreen: ScreenNames.children})}>
                  {GetAccountType()}
                </span>
                &nbsp;page
              </p>
            </DetailBlock>
            <DetailBlock valueToValidate={activeContact?.relationshipToMe} text={activeContact?.relationshipToMe} title={'Relationship'} />
            <DetailBlock valueToValidate={activeContact?.parentType} text={activeContact?.parentType} title={'Parent Type'} />
          </div>
          <div className="blocks">
            <DetailBlock
              topSpacerMargin={10}
              bottomSpacerMargin={10}
              valueToValidate={GetContactPhone()}
              text={GetContactPhone()}
              isPhone={true}
              title={'Phone'}
            />
            <DetailBlock
              topSpacerMargin={10}
              bottomSpacerMargin={10}
              valueToValidate={GetContactEmail()}
              text={GetContactEmail()}
              isEmail={true}
              title={'Email'}
            />
            {!users?.map((x) => x?.key).includes(activeContact?.userKey) && (
              <DetailBlock
                topSpacerMargin={10}
                bottomSpacerMargin={10}
                valueToValidate={activeContact}
                text={''}
                isInviteButton={true}
                title={'Send Invite'}
                onClick={() => {
                  setShowInvitationCard(true)
                  setShowModal(false)
                }}
              />
            )}
          </div>
          {Manager.IsValid(activeContact?.address) && <Map locationString={activeContact?.address} />}
        </div>

        {/* EDIT */}
        <div id="edit" className={view === 'edit' ? 'view-wrapper edit active' : 'view-wrapper'}>
          <Spacer height={5} />
          {/* NAME */}

          <InputWrapper
            inputType={InputTypes.text}
            labelText={'Name'}
            defaultValue={GetContactName()}
            wrapperClasses="show-label"
            required={true}
            customDebounceDelay={2000}
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 1) {
                let propertyPath = GetAccountType() === 'parent' ? 'name' : 'general.name'
                let model = GetAccountType() === 'parent' ? new Coparent() : new Child()

                if (activeContact?.accountType === 'child') {
                  model = new Child()
                  propertyPath = 'general.name'
                }

                setActiveContact((prevState) => {
                  return {...prevState, name: inputValue}
                })
                setUpdateObject((prevState) => {
                  return {...prevState, model, propertyPath, inputValue}
                })
              }
            }}
          />

          {/* EMAIL */}
          {Manager.IsValid(GetContactEmail()) && (
            <InputWrapper
              inputType={InputTypes.email}
              labelText={'Email Address'}
              defaultValue={GetContactEmail()}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                let propertyPath = GetAccountType() === 'parent' ? 'email' : 'general.email'
                let model = GetAccountType() === 'parent' ? new Coparent() : new Child()

                if (inputValue.length > 1) {
                  setActiveContact((prevState) => {
                    return {...prevState, email: inputValue}
                  })
                  setUpdateObject((prevState) => {
                    return {...prevState, model, propertyPath, inputValue}
                  })
                }
              }}
            />
          )}

          {/* PHONE */}
          {Manager.IsValid(GetContactPhone()) && (
            <InputWrapper
              inputType={InputTypes.phone}
              labelText={'Phone Number'}
              defaultValue={GetContactPhone()}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                let propertyPath = GetAccountType() === 'parent' ? 'phone' : 'general.phone'
                let model = GetAccountType() === 'parent' ? new Coparent() : new Child()

                if (inputValue.length > 1) {
                  setActiveContact((prevState) => {
                    return {...prevState, phone: inputValue}
                  })
                  setUpdateObject((prevState) => {
                    return {...prevState, model, propertyPath, inputValue}
                  })
                }
              }}
            />
          )}
        </div>
      </Modal>

      {/* SCREEN ACTIONS */}
      <ScreenActionsMenu>
        {/* CREATE CONTACT */}
        {currentUser?.accountType === 'parent' && (
          <>
            {/* NEW CHILD CONTACT */}
            <div
              className="action-item"
              onClick={() => {
                setShowNewChildCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Create Child Contact</p>
              </div>
            </div>

            {/* NEW COPARENT CONTACT */}
            <div
              className="action-item"
              onClick={() => {
                setShowNewCoparentCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Create Co-Parent Contact</p>
              </div>
            </div>

            {/* MANAGE CHILDREN */}
            <div
              className="action-item"
              onClick={() => {
                setState({...state, currentScreen: ScreenNames.children, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Manage Children</p>
              </div>
            </div>

            {/* MANAGE COPARENTS */}
            <div
              className="action-item"
              onClick={() => {
                setState({...state, currentScreen: ScreenNames.coparents, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Manage Co-Parents</p>
              </div>
            </div>
          </>
        )}

        {/* NEW PARENT CONTACT */}
        {currentUser?.accountType === 'child' && (
          <>
            <div
              className="action-item"
              onClick={() => {
                setShowNewParentCard(true)
                setState({...state, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Create Parent Contact</p>
              </div>
            </div>
            {/* MANAGE COPARENTS */}
            <div
              className="action-item"
              onClick={() => {
                setState({...state, currentScreen: ScreenNames.parents, showScreenActions: false})
              }}>
              <div className="content align-center">
                <div className="svg-wrapper">
                  <IoPersonAdd className={'checklist'} />
                </div>
                <p>Manage Parents</p>
              </div>
            </div>
          </>
        )}

        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      {/* PAGE CONTAINER */}
      <div id="contacts-wrapper" className={`${theme} contacts page-container`}>
        <ScreenHeader
          title={'Contacts'}
          screenDescription="Access and manage all essential and personal contact details for each of your contacts."
        />
        <Spacer height={8} />
        <div className="screen-content">
          {/* COPARENTS */}
          {currentUser?.accountType === 'parent' && (
            <div id="contacts-wrapper">
              <Label text={'COPARENTS'} />
              <Spacer height={3} />
              {Manager.IsValid(coparents) &&
                coparents.map((contact, index) => {
                  return (
                    <div
                      onClick={() => {
                        contact.accountType = 'coparent'
                        setActiveContact(contact)
                        setShowModal(true)
                      }}
                      className={`contact-card ${DomManager.Animate.FadeInUp(contact, '.contact-card')}`}
                      style={DomManager.AnimateDelayStyle(index)}
                      key={index}>
                      <div className="header">
                        <div
                          className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? 'no-pic' : ''}`}
                          style={{backgroundImage: `url(${contact?.profilePic})`}}>
                          {!Manager.IsValid(contact?.profilePic) && <span>{StringManager.GetFirstNameOnly(contact?.name)[0]}</span>}
                        </div>
                        <p className="contact-card-name">
                          {contact?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <GrEdit />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* CHILDREN */}
          {currentUser?.accountType === 'parent' && (
            <div id="contacts-wrapper">
              <Spacer height={15} />
              <Label text={'CHILDREN'} />
              <Spacer height={3} />
              {Manager.IsValid(children) &&
                children.map((contact, index) => {
                  return (
                    <div
                      onClick={() => {
                        contact.accountType = 'child'
                        setActiveContact(contact)
                        setShowModal(true)
                      }}
                      className={`contact-card ${DomManager.Animate.FadeInUp(contact, '.contact-card')}`}
                      style={DomManager.AnimateDelayStyle(index)}
                      key={index}>
                      <div className="header">
                        <div
                          className={`contact-card-pic ${!Manager.IsValid(contact?.general?.profilePic) ? 'no-pic' : ''}`}
                          style={{backgroundImage: `url(${contact?.general?.profilePic})`}}>
                          {!Manager.IsValid(contact?.general?.profilePic) && (
                            <span>{StringManager.GetFirstNameOnly(contact?.general?.name)[0]} </span>
                          )}
                        </div>
                        <p className="contact-card-name">
                          {contact?.general?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <GrEdit />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* PARENTS */}
          {currentUser?.accountType === 'child' && (
            <div id="contacts-wrapper">
              <Spacer height={15} />
              <Label text={'PARENTS'} />
              <Spacer height={3} />
              {Manager.IsValid(parents) &&
                parents.map((contact, index) => {
                  return (
                    <div
                      onClick={() => {
                        contact.accountType = 'parent'
                        setActiveContact(contact)
                        setShowModal(true)
                      }}
                      className={`contact-card ${DomManager.Animate.FadeInUp(contact, '.contact-card')}`}
                      style={DomManager.AnimateDelayStyle(index)}
                      key={index}>
                      <div className="header">
                        <div
                          className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? 'no-pic' : ''}`}
                          style={{backgroundImage: `url(${contact?.profilePic})`}}>
                          {' '}
                          {!Manager.IsValid(contact?.profilePic) && <span>{StringManager.GetFirstNameOnly(contact?.name)[0]}</span>}
                        </div>
                        <p className="contact-card-name">
                          {contact?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <GrEdit />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
      <NavBar navbarClass={'actions'}>
        <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
          <HiOutlineChevronDoubleUp className={'screen-actions-menu-icon more'} />
          <p>More</p>
        </div>
      </NavBar>
    </>
  )
}

export default Contacts