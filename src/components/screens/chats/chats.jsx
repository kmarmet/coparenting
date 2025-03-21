// Path: src\components\screens\chats\chats.jsx
import React, { useContext, useEffect, useState } from 'react'
import Manager from '/src/managers/manager'
import globalState from '../../../context.js'
import DB_UserScoped from '../../../database/db_userScoped.js'
import { BiMessageRoundedAdd } from 'react-icons/bi'
import { Fade } from 'react-awesome-reveal'
import Modal from '../../shared/modal'
import SecurityManager from '/src/managers/securityManager'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import NavBar from '../../navBar'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import ScreenNames from '/src/constants/screenNames'
import StringManager from '/src/managers/stringManager.coffee'
import ChatRow from './chatRow.jsx'
import { TbMessageCirclePlus } from 'react-icons/tb'
import Spacer from '../../shared/spacer'
import DB from '../../../database/DB'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { LuPlus, LuMinus } from 'react-icons/lu'
import EmailManager from '../../../managers/emailManager'
import InputWrapper from '../../shared/inputWrapper'

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, authUser } = state
  const [chats, setChats] = useState([])
  const [activeChatKeys, setActiveChatKeys] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)
  const [showNewChatButton, setShowNewChatButton] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [inviteeName, setInviteeName] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const openMessageThread = async (coparent) => {
    // Check if thread member (coparent) account exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByKey(coparent?.key, currentUser)
    if (!Manager.isValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Account not Found',
        'This co-parent may have closed their account, however, you can still view the messages',
        null,
        () => {
          setState({ ...state, currentScreen: ScreenNames.chats, messageRecipient: coparent })
        }
      )
    } else {
      setState({ ...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent })
    }
  }

  const getSecuredChats = async () => {
    let securedChats = await SecurityManager.getChats(currentUser)
    const members = securedChats.map((x) => x.members).flat()
    const activeChats = members.filter((x) => x?.key && x?.key !== currentUser?.key)
    const activeChatKeys = activeChats.map((x) => x?.key)
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    console.log(validAccounts)
    if (activeChatKeys.length === validAccounts) {
      setShowNewChatButton(false)
    }
    setChats(securedChats)
    setActiveChatKeys(activeChatKeys)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, `${DB.tables.chats}/${currentUser?.key}`), async () => {
      getSecuredChats().then((r) => r)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      {/* NEW THREAD FORM */}
      <Modal
        hasSubmitButton={false}
        className="new-conversation"
        wrapperClass="new-conversation"
        onClose={() => setShowNewConvoCard(false)}
        showCard={showNewConvoCard}
        title={'New Chats'}>
        {/* COPARENTS */}
        {currentUser?.accountType === 'parent' &&
          Manager.isValid(currentUser?.coparents) &&
          currentUser?.coparents?.map((coparent, index) => {
            return (
              <div key={index}>
                {!activeChatKeys.includes(coparent?.key) && (
                  <div id="users-wrapper">
                    <div className="user-wrapper">
                      <TbMessageCirclePlus />
                      <p
                        className="coparent-name new-thread-coparent-name"
                        onClick={() => {
                          openMessageThread(coparent).then((r) => r)
                        }}>
                        {StringManager.getFirstNameOnly(coparent?.name)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

        {/* CHILDREN */}
        {currentUser?.accountType === 'child' &&
          Manager.isValid(currentUser?.parents) &&
          currentUser?.parents?.map((parent, index) => {
            return (
              <div key={index} className="flex" id="users-wrapper">
                {!activeChatKeys.includes(parent?.key) && (
                  <div className="user-wrapper">
                    <BiMessageRoundedAdd />
                    <p
                      className="coparent-name new-thread-coparent-name"
                      onClick={() => {
                        openMessageThread(parent?.key).then((r) => r)
                      }}>
                      {parent?.name}
                    </p>
                  </div>
                )}
                {activeChatKeys.includes(parent?.key) && <p>All available co-parents already have an open conversation with you. </p>}
              </div>
            )
          })}
      </Modal>

      {/* INVITATION FORM */}
      <Modal
        submitText={'Send Invitation'}
        wrapperClass="invite-coparent-card"
        title={'Invite Co-Parent or Child'}
        subtitle="Extend an invitation to a co-parent or child to facilitate the sharing of essential information with them"
        onClose={() => setShowInvitationCard(false)}
        showCard={showInvitationCard}
        onSubmit={() => {
          if (!Manager.isValid(inviteeEmail) || !Manager.isValid(inviteeName)) {
            AlertManager.throwError('Please field out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', inviteeEmail, inviteeName)
          AlertManager.successAlert('Invitation Sent!')
          setShowInvitationCard(false)
        }}
        hideCard={() => setShowInvitationCard(false)}>
        <Spacer height={5} />
        <InputWrapper labelText={'Name'} required={true} onChange={(e) => setInviteeName(e.target.value)} />
        <InputWrapper labelText={'Email Address'} required={true} onChange={(e) => setInviteeEmail(e.target.value)} />
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        {/*<VideoCall />*/}
        {chats.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'chats-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Chats</p>
            {!DomManager.isMobile() && <TbMessageCirclePlus id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
          </div>
          <p>
            Your space to peacefully chat with your co-parent and pass along any important info they need to know, or to seek clarification on
            information that is unfamiliar to you.
          </p>

          {/* INFO BUTTON */}
          <Accordion expanded={showInfo}>
            <AccordionSummary>
              <p id="info-button" onClick={() => setShowInfo(!showInfo)}>
                Info {showInfo ? <LuMinus /> : <LuPlus />}
              </p>
            </AccordionSummary>
            <AccordionDetails>
              <p>
                Right now, your account is connected to {currentUser?.coparents?.length} members (children and co-parents). If you’d like to chat with
                another co-parent or child, go ahead and send them an invite.
              </p>

              <button
                className="default"
                id="send-invite-button"
                onClick={() => {
                  setShowInvitationCard(true)
                  setShowInfo(false)
                }}>
                Send Invite
              </button>
            </AccordionDetails>
          </Accordion>

          {/* CHAT ROWS */}
          {chats.length > 0 &&
            chats.map((chat, index) => {
              const coparent = chat?.members?.filter((x) => x.key !== currentUser?.key)[0]
              return <ChatRow key={index} coparent={coparent} chat={chat} index={index} />
            })}
        </Fade>
      </div>
      {!showNewConvoCard && (
        <NavBar navbarClass={`chats ${!showNewChatButton ? 'no-add-new-button' : ''}`}>
          {DomManager.isMobile() && <TbMessageCirclePlus id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
        </NavBar>
      )}
    </>
  )
}

export default Chats