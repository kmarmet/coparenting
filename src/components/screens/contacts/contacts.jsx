import React, {useContext, useEffect, useRef, useState} from 'react'
import {FaUserEdit} from 'react-icons/fa'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoPersonAdd} from 'react-icons/io5'
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
import InvitationManager from '../../../managers/invitationManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import SmsManager from '../../../managers/smsManager'
import StringManager from '../../../managers/stringManager'
import Invitation from '../../../models/new/invitation'
import NavBar from '../../navBar'
import DetailBlock from '../../shared/detailBlock'
import Form from '../../shared/form'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import Map from '../../shared/map'
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
  const [view, setView] = useState('details')

  // REFS
  const updateObject = useRef({})

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

  // Remove view from the active form
  useEffect(() => {
    if (showNewCoparentCard || showNewParentCard || showNewChildCard) {
      const activeModal = document.querySelector('.form-wrapper.active')
      if (Manager.IsValid(activeModal)) {
        const modalCard = activeModal.querySelector('#form-card')
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
      <Form
        submitText={'Send'}
        wrapperClass="invitation-card"
        title={`Invite ${GetContactName()}`}
        subtitle="Extend an invitation to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationCard(false)}
        showCard={showInvitationCard}
        onSubmit={async () => {
          if (!Manager.IsValid(updateObject.current.email)) {
            AlertManager.throwError('Email is required')
            return false
          }
          const newInvitation = new Invitation({
            recipientPhone: updateObject.current.phone,
            sender: {
              key: currentUser?.key,
              name: currentUser?.name,
              email: currentUser?.email,
            }
          })
          await InvitationManager.AddInvitation(newInvitation, currentUser?.key)
          SmsManager.Send(updateObject.current.phone, SmsManager.Templates.Invitation(currentUser, activeContact?.name, updateObject.current.phone))
          setState({...state, successAlertMessage: 'Invitation Sent!'})
          setShowInvitationCard(false)
        }}
        hideCard={() => setShowInvitationCard(false)}>
        <Spacer height={5} />
        <InputWrapper
          inputType={InputTypes.phone}
          placeholder={'Phone Number'}
          required={true}
          onChange={(e) => (updateObject.current.phone = e.target.value)}
        />
      </Form>

      {/* UPDATE FORM */}
      <Form
        onSubmit={UpdateContact}
        activeView={view}
        onClose={() => setShowModal(false)}
        hideCard={() => setShowModal(false)}
        wrapperClass="contact-form-wrapper"
        hasSubmitButton={view === 'edit'}
        hasDelete={true}
        onDelete={RemoveContact}
        deleteButtonText={`Remove`}
        submitText={'Update'}
        viewSelector={
          <ViewSelector
            onloadState={showModal}
            key={refreshKey}
            labels={['Details', 'Edit']}
            updateState={(labelText) => {
              setView(labelText)
            }}
          />
        }
        subtitle={`${!users?.map((x) => x?.key).includes(activeContact?.userKey) ? `${GetContactName()} has not created an account with us yet. Invite them to create an account to begin sharing with and receiving information from them.` : ''}`}
        title={`${GetContactName()}`}
        showCard={showModal}>
        {/* DETAILS */}
        <div id="details" className={view.toLowerCase() === 'details' ? 'view-wrapper details active' : 'view-wrapper'}>
          <div className="blocks">
            <DetailBlock isCustom={true} isFullWidth={true} valueToValidate={activeContact} text={''} title={''}>
              <p className="custom-text">
                Add custom information about {GetContactName()} at the&nbsp;
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
        <div id="edit" className={view.toLowerCase() === 'edit' ? 'view-wrapper edit active' : 'view-wrapper'}>
          {/* NAME */}
          <InputWrapper
            inputType={InputTypes.text}
            placeholder={'Name'}
            defaultValue={GetContactName()}
            wrapperClasses="show-label"
            required={true}
            customDebounceDelay={2000}
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 1) {
                updateObject.current.recipientName = inputValue
              }
            }}
          />

          {/* EMAIL */}
          {Manager.IsValid(GetContactEmail()) && (
            <InputWrapper
              inputType={InputTypes.email}
              placeholder={'Email Address'}
              defaultValue={GetContactEmail()}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value

                if (inputValue.length > 1) {
                  updateObject.current.recipientEmail = inputValue
                }
              }}
            />
          )}

          {/* PHONE */}
          {Manager.IsValid(GetContactPhone()) && (
            <InputWrapper
              inputType={InputTypes.phone}
              placeholder={'Phone Number'}
              defaultValue={GetContactPhone()}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  updateObject.current.recipientPhone = inputValue
                }
              }}
            />
          )}
        </div>
      </Form>

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
              <Label classes={'black toggle always-show'} text={'COPARENTS'} />
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
                          style={{backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : ''}}>
                          {!Manager.IsValid(contact?.profilePic) && <span>{StringManager.GetFirstNameOnly(contact?.name)[0]}</span>}
                        </div>
                        <p className="contact-card-name">
                          {contact?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <FaUserEdit />
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
              <Label classes={'black toggle always-show'} text={'CHILDREN'} />
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
                          className={`contact-card-pic ${!Manager.IsValid(contact?.profilePic) ? 'no-pic' : ''}`}
                          style={{backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : ''}}>
                          {!Manager.IsValid(contact?.profilePic) && (
                            <span>{StringManager.GetFirstNameOnly(contact?.general?.name)[0]} </span>
                          )}
                        </div>
                        <p className="contact-card-name">
                          {contact?.general?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <FaUserEdit />
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
              <Label classes={'black toggle always-show'} text={'PARENTS'} />
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
                          style={{backgroundImage: Manager.IsValid(contact?.profilePic) ? `url(${contact?.profilePic})` : ''}}>
                          {' '}
                          {!Manager.IsValid(contact?.profilePic) && <span>{StringManager.GetFirstNameOnly(contact?.name)[0]}</span>}
                        </div>
                        <p className="contact-card-name">
                          {contact?.name}
                          {!users?.map((x) => x?.key).includes(contact?.userKey) && <span className="no-account">no account - invite them now</span>}
                        </p>

                        <FaUserEdit />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
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

export default Contacts