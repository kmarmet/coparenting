// Path: src\components\screens\chats\chats?.jsx
import React, {useContext, useState} from 'react'
import Manager from '/src/managers/manager'
import globalState from '../../../context.js'
import {Fade} from 'react-awesome-reveal'
import Modal from '../../shared/modal'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import AlertManager from '/src/managers/alertManager'
import ChatRow from './chatRow.jsx'
import Spacer from '../../shared/spacer'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import {LuMinus, LuPlus} from 'react-icons/lu'
import EmailManager from '../../../managers/emailManager'
import InputWrapper from '../../shared/inputWrapper'
import NavBar from '../../navBar'
import Label from '../../shared/label'
import InputTypes from '../../../constants/inputTypes'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useChat from '../../../hooks/useChat'

const Chats = () => {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  // const [chats, setChats] = useState([])
  const [showInfo, setShowInfo] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [inviteeName, setInviteeName] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const {currentUser} = useCurrentUser()
  const {chats} = useChat()

  return (
    <>
      {/* INVITATION FORM */}
      <Modal
        submitText={'Send Invitation'}
        wrapperClass="invite-coparent-card"
        title={'Invite Co-Parent'}
        subtitle="Extend an invitation to a co-parent sto facilitate the sharing of essential information with them"
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
        <InputWrapper inputType={InputTypes.text} labelText={'Co-Parent Name'} required={true} onChange={(e) => setInviteeName(e.target.value)} />
        <InputWrapper
          inputType={InputTypes.email}
          labelText={'Co-Parent Email Address'}
          required={true}
          onChange={(e) => setInviteeEmail(e.target.value)}
        />
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        {/*<VideoCall />*/}

        {chats?.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Chats</p>
        </div>
        <p className="screen-intro-text">
          Your space to peacefully chat with your co-parent and pass along any important info they need to know, or to seek clarification on
          information that is unfamiliar to you.
        </p>

        <Spacer height={8} />
        {/* INVITE BUTTON */}
        <Accordion expanded={showInfo} className={`${theme} invite-accordion accordion`}>
          <AccordionSummary>
            <button className="button default grey" onClick={() => setShowInfo(!showInfo)}>
              <div id="circle" className="circle"></div>
              <Label text={'Invite Co-Parent'} /> {showInfo ? <LuMinus /> : <LuPlus />}
            </button>
          </AccordionSummary>
          <Spacer height={5} />
          <AccordionDetails>
            <p>
              Currently, your account is linked to {currentUser?.coparents?.length} {currentUser?.coparents?.length > 1 ? 'co-parents' : 'co-parent'}.
              If you wish to communicate with another co-parent, feel free to Send them an invitation.
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
        {Manager.isValid(chats) && (
          <Fade direction={'right'} damping={0.2} duration={800} triggerOnce={true} cascade={true}>
            {/* CHAT ROWS */}
            {chats?.length > 0 &&
              chats?.map((chat, index) => {
                return <ChatRow chat={chat} key={index} />
              })}
          </Fade>
        )}
        <NavBar />
      </div>
    </>
  )
}

export default Chats