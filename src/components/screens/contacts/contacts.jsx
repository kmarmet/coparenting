import React, {useContext, useEffect, useState} from 'react'
import {GrEdit} from 'react-icons/gr'
import {RiUserAddLine} from 'react-icons/ri'
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
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import EmailManager from '../../../managers/emailManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import Child from '../../../models/child/child'
import Contact from '../../../models/contact'
import User from '../../../models/user'
import NavBar from '../../navBar'
import DetailBlock from '../../shared/detailBlock'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import Map from '../../shared/map'
import Modal from '../../shared/modal'
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
  const [contactChildren, setContactChildren] = useState([])
  const [contactParents, setContactParents] = useState([])
  const [contactCoparents, setContactCoparents] = useState([])
  const [activeContact, setActiveContact] = useState()
  const [showNewCoparentCard, setShowNewCoparentCard] = useState(false)
  const [showNewParentCard, setShowNewParentCard] = useState(false)
  const [showNewChildCard, setShowNewChildCard] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteeName, setInviteeName] = useState('')
  const [view, setView] = useState('details')

  // CONTACT UPDATE STATE
  const [userName, setUserName] = useState()
  const [userEmail, setUserEmail] = useState()
  const [userPhone, setUserPhone] = useState()

  const UpdateContact = async () => {
    let userIndex = DB.GetChildIndex(children, activeContact?.id)
    let groupType = 'children'

    // Parents
    if (currentUser?.accountType === 'child' && activeContact?.accountType === 'parent') {
      userIndex = DB.GetTableIndexById(parents, activeContact?.id)
      groupType = 'parents'
    }

    // Coparents
    else if (currentUser?.accountType === 'parent' && activeContact?.accountType === 'parent') {
      userIndex = DB.GetTableIndexById(coparents, activeContact?.id)
      groupType = 'coparents'
    }

    // Database Update
    if (Manager.IsValid(userIndex) && Manager.IsValid(activeContact)) {
      let updated = ObjectManager.RemoveUnusedProperties(activeContact, groupType === 'children' ? Object.keys(new Child()) : Object.keys(new User()))
      // console.log(new Child())
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
          let toRemove = contactCoparents.find((x) => x.id === activeContact?.id)

          if (Manager.IsValid(toRemove)) {
            const coparentIndex = DB.GetTableIndexById(coparents, activeContact?.id)
            await DB_UserScoped.DeleteCoparent(currentUser, coparentIndex, toRemove?.userKey)
          }
        }

        // Remove parent
        else if (currentUser?.accountType === 'child' && activeContact?.accountType === 'parent') {
          let toRemove = contactParents.find((x) => x.id === activeContact?.id)

          if (Manager.IsValid(toRemove)) {
            const parentIndex = DB.GetTableIndexById(parents, activeContact?.id)
            await DB_UserScoped.DeleteParent(currentUser, parentIndex, toRemove?.userKey)
          }
        }

        // Remove child
        else {
          let toRemove = contactChildren.find((x) => x.id === activeContact?.id)

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

  useEffect(() => {
    let _contactChildren = []
    let _contactParents = []
    let _contactCoparents = []
    if (Manager.IsValid(currentUser)) {
      // Children
      if (Manager.IsValid(children) && currentUser?.accountType === 'parent') {
        for (let child of children) {
          let contact = new Contact()
          contact.id = child?.id
          contact.name = child.general.name
          contact.profilePic = child.general.profilePic
          contact.accountType = 'child'
          contact.phone = child.general.phone
          contact.userKey = child?.userKey
          contact.email = child.general.email
          _contactChildren.push(contact)
        }
      }

      // Coparents
      if (Manager.IsValid(coparents) && currentUser?.accountType === 'parent') {
        for (let coparent of coparents) {
          let contact = new Contact()
          contact.id = coparent?.id
          contact.name = coparent.name
          contact.profilePic = coparent.profilePic
          contact.accountType = 'parent'
          contact.phone = coparent.phone
          contact.email = coparent.email
          contact.userKey = coparent?.userKey
          _contactCoparents.push(contact)
        }
      }

      // Parents
      if (Manager.IsValid(parents) && currentUser?.accountType === 'children') {
        for (let parent of parents) {
          let contact = new Contact()
          contact.id = parent?.id
          contact.userKey = parent?.userKey
          contact.name = parent.name
          contact.profilePic = parent.profilePic
          contact.accountType = 'parent'
          contact.phone = parent.phone
          contact.email = parent.email
          _contactParents.push(contact)
        }
      }
      setContactParents(DatasetManager.sortByProperty(_contactParents, 'name', 'asc'))
      setContactChildren(DatasetManager.sortByProperty(_contactChildren, 'name', 'asc'))
      setContactCoparents(DatasetManager.sortByProperty(_contactCoparents, 'name', 'asc'))
    }
  }, [children, currentUser, coparents, parents])

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

  useEffect(() => {
    if (Manager.IsValid(activeContact)) {
      setUserName(activeContact?.name)
      setUserEmail(activeContact?.email)
      setUserPhone(activeContact?.phone)
    }
  }, [activeContact])

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
        title={`Invite ${activeContact?.name}`}
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
        showCard={showModal}
        onClose={() => setShowModal(false)}
        hideCard={() => setShowModal(false)}
        wrapperClass="contact-modal-wrapper"
        hasSubmitButton={view === 'edit'}
        hasDelete={true}
        onDelete={RemoveContact}
        deleteButtonText={`Remove Contact`}
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
        subtitle={`${!users?.map((x) => x?.key).includes(activeContact?.userKey) ? `${activeContact?.name} has not created an account with us yet. Invite them to create an account to begin sharing with and receiving information from them.` : ''}`}
        title={`${StringManager.GetFirstNameOnly(activeContact?.name)}`}>
        {view === 'details' && <Spacer height={10} />}
        {/* DETAILS */}
        <div id="details" className={view === 'details' ? 'view-wrapper details active' : 'view-wrapper'}>
          <div className="blocks">
            <DetailBlock valueToValidate={activeContact?.relationshipToMe} text={activeContact?.relationshipToMe} title={'Relationship'} />
            <DetailBlock valueToValidate={activeContact?.parentType} text={activeContact?.parentType} title={'Parent Type'} />
          </div>
          <div className="blocks">
            <DetailBlock valueToValidate={activeContact?.phone} text={activeContact?.phone} isPhone={true} title={'Phone'} />
            <DetailBlock valueToValidate={activeContact?.email} text={activeContact?.email} isEmail={true} title={'Email'} />
            {!users?.map((x) => x?.key).includes(activeContact?.userKey) && (
              <DetailBlock
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
            defaultValue={activeContact?.name}
            wrapperClasses="show-label"
            required={true}
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 1) {
                let propertyPath = 'name'

                if (activeContact?.accountType === 'child') {
                  propertyPath = 'general.name'
                }
                setUserName(ObjectManager.UpdateAndReturnObject(activeContact, propertyPath, inputValue))
              }
            }}
          />

          {/* EMAIL */}
          {Manager.IsValid(activeContact?.email) && (
            <InputWrapper
              inputType={InputTypes.email}
              labelText={'Email Address'}
              defaultValue={activeContact?.email}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  setUserEmail(ObjectManager.UpdateAndReturnObject(activeContact, 'email', inputValue))
                }
              }}
            />
          )}

          {/* PHONE */}
          {Manager.IsValid(activeContact?.phone) && (
            <InputWrapper
              inputType={InputTypes.phone}
              labelText={'Phone Number'}
              defaultValue={activeContact?.phone}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  setUserPhone(ObjectManager.UpdateAndReturnObject(activeContact, 'phone', inputValue))
                }
              }}
            />
          )}
        </div>
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="contacts-wrapper" className={`${theme} contacts page-container`}>
        <p className="screen-title">Contacts</p>
        <p className={`${theme} text-screen-intro`}>Access and manage all essential and personal contact details for each of your contacts.</p>
        <Spacer height={8} />
        <Label text={'Create Contact'} />
        <Spacer height={2} />

        {/* CREATION BUTTONS */}
        {currentUser?.accountType === 'parent' && (
          <div className="contact-create-buttons">
            <button className="button default accent smaller" onClick={() => setShowNewCoparentCard(true)}>
              Co-Parent <RiUserAddLine />
            </button>
            <button className="button default accent smaller" onClick={() => setShowNewChildCard(true)}>
              Child <RiUserAddLine />
            </button>
          </div>
        )}
        {currentUser?.accountType === 'child' && (
          <button className="button default accent smaller" onClick={() => setShowNewParentCard(true)}>
            Parent <RiUserAddLine />
          </button>
        )}
        <Spacer height={8} />

        {/* PAGE LINKS */}
        <Label text={'full details & management'} />
        <div id="page-links">
          {/* PARENT CURRENT USER */}
          {currentUser?.accountType === 'parent' && (
            <>
              <div className="page-link" onClick={() => setState({...state, currentScreen: ScreenNames.coparents})}>
                <p className="page-link-text">Co-Parents</p>
              </div>
              <span className="separator">|</span>
              <div className="page-link" onClick={() => setState({...state, currentScreen: ScreenNames.children})}>
                <p className="page-link-text">Children</p>
              </div>
            </>
          )}

          {/* CHILD CURRENT USER */}
          {currentUser?.accountType === 'child' && (
            <div className="page-link" onClick={() => setState({...state, currentScreen: ScreenNames.parents})}>
              <p className="page-link-text">Parents</p>
            </div>
          )}
        </div>
        <Spacer height={8} />

        {/* COPARENTS */}
        {currentUser?.accountType === 'parent' && (
          <div id="contacts-wrapper">
            <Label text={'COPARENTS'} />
            <Spacer height={3} />
            {Manager.IsValid(contactCoparents) &&
              contactCoparents.map((contact, index) => {
                return (
                  <div
                    onClick={() => {
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
            {Manager.IsValid(contactChildren) &&
              contactChildren.map((contact, index) => {
                return (
                  <div
                    onClick={() => {
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
                        {!Manager.IsValid(contact?.profilePic) && <span>{StringManager.GetFirstNameOnly(contact?.name)[0]} </span>}
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

        {/* PARENTS */}
        {currentUser?.accountType === 'child' && (
          <div id="contacts-wrapper">
            <Spacer height={15} />
            <Label text={'PARENTS'} />
            <Spacer height={3} />
            {Manager.IsValid(contactParents) &&
              contactParents.map((contact, index) => {
                return (
                  <div
                    onClick={() => {
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
      <NavBar />
    </>
  )
}

export default Contacts