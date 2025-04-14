// Path: src\components\screens\chats\chats.jsx
import React, {useContext, useEffect, useState} from 'react'
import Manager from '/src/managers/manager'
import globalState from '../../../context.js'
import {Fade} from 'react-awesome-reveal'
import Modal from '../../shared/modal'
import SecurityManager from '/src/managers/securityManager'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import AlertManager from '/src/managers/alertManager'
import ChatRow from './chatRow.jsx'
import Spacer from '../../shared/spacer'
import DB from '../../../database/DB'
import {child, getDatabase, onValue, ref} from 'firebase/database'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import {LuMinus, LuPlus} from 'react-icons/lu'
import EmailManager from '../../../managers/emailManager'
import InputWrapper from '../../shared/inputWrapper'
import NavBar from '../../navBar'
import Label from '../../shared/label'
import ChatManager from '../../../managers/chatManager'

const Chats = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, creationFormToShow} = state
  const [chats, setChats] = useState([])
  const [showInfo, setShowInfo] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [inviteeName, setInviteeName] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')

  const getSecuredChats = async () => {
    const chats = await SecurityManager.getChats(currentUser)
    const iterableChats = []
    if (Manager.isValid(chats)) {
      for (let chat of chats) {
        const chatMessages = await ChatManager.getMessages(chat.id)
        const otherMemberMessages = chatMessages.filter((message) => message?.senderKey !== currentUser?.key)
        let lastMessage = ''
        if (Manager.isValid(chatMessages)) {
          if (Manager.isValid(otherMemberMessages)) {
            lastMessage = otherMemberMessages[otherMemberMessages.length - 1]['message']
          }
        }
        iterableChats.push({
          lastMessage: lastMessage,
          member: chat.members.find((member) => member?.key !== currentUser.key),
          id: chat.id,
          isPausedFor: chat?.isPausedFor,
        })
      }
    }
    setChats(iterableChats)
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
            AlertManager.throwError('Please fill out all fields')
            return false
          }
          EmailManager.SendEmailToUser(EmailManager.Templates.coparentInvitation, '', inviteeEmail, inviteeName)
          setState({...state, successAlertMessage: 'Invitation Sent!'})
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
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Chats</p>
        </div>
        <p>
          Your space to peacefully chat with your co-parent and pass along any important info they need to know, or to seek clarification on
          information that is unfamiliar to you.
        </p>

        <Spacer height={8} />
        {/* INVITE BUTTON */}
        <Accordion expanded={showInfo} className={'invite-accordion'}>
          <AccordionSummary>
            <button className="button default grey" onClick={() => setShowInfo(!showInfo)}>
              <div id="circle" className="circle"></div>
              <Label text={'Invite Co-Parent or Child'} /> {showInfo ? <LuMinus /> : <LuPlus />}
            </button>
          </AccordionSummary>
          <Spacer height={5} />
          <AccordionDetails>
            <p>
              Right now, your account is connected to {currentUser?.coparents?.length} {currentUser?.coparents?.length > 1 ? 'members' : 'member'}{' '}
              (children with accounts and co-parents are both considered members). If you’d like to chat with another co-parent or child, go ahead and
              send them an invite.
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
        <Spacer height={8} />
        <Fade direction={'right'} damping={0.2} duration={800} triggerOnce={true} cascade={true}>
          <></>
          {/* CHAT ROWS */}
          {chats.length > 0 &&
            chats.map((chat, index) => {
              return <ChatRow key={index} chat={chat} index={index} />
            })}
        </Fade>
        <NavBar />
      </div>
    </>
  )
}

export default Chats