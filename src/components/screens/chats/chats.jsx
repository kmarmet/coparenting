// Path: src\components\screens\chats\chats?.jsx
import AlertManager from '/src/managers/alertManager'
import Manager from '/src/managers/manager'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useState} from 'react'
import {LuMinus, LuPlus} from 'react-icons/lu'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context.js'
import useChat from '../../../hooks/useChat'
import useCoparents from '../../../hooks/useCoparents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import EmailManager from '../../../managers/emailManager'
import NavBar from '../../navBar'
import Form from '../../shared/form'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import ChatRow from './chatRow.jsx'

const Chats = () => {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [showInfo, setShowInfo] = useState(false)
  const [showInvitationCard, setShowInvitationCard] = useState(false)
  const [inviteeName, setInviteeName] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {chats} = useChat()
  const {coparents} = useCoparents()

  return (
    <>
      {/* INVITATION FORM */}
      <Form
        submitText={'Send Invitation'}
        wrapperClass="invite-coparent-card"
        title={'Invite Co-Parent'}
        subtitle="Extend an invitation to a co-parent to facilitate the sharing of essential information with them"
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
        <InputWrapper inputType={InputTypes.text} placeholder={'Co-Parent Name'} required={true} onChange={(e) => setInviteeName(e.target.value)} />
        <InputWrapper
          inputType={InputTypes.email}
          placeholder={'Co-Parent Email Address'}
          required={true}
          onChange={(e) => setInviteeEmail(e.target.value)}
        />
      </Form>

      {/* NO DATA FALLBACK */}
      {chats?.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        <ScreenHeader
          screenName={ScreenNames.chats}
          title={'Chats'}
          screenDescription="Your space to peacefully chat with your co-parent and pass along any important info they need to know, or to seek clarification on
          information that is unfamiliar to you."
        />

        <Spacer height={8} />
        <div className="screen-content">
          {/* INVITE BUTTON */}
          <Accordion expanded={showInfo} className={`${theme} white-bg invite-accordion accordion`}>
            <AccordionSummary>
              <button className="button default grey" onClick={() => setShowInfo(!showInfo)}>
                <div id="circle" className="circle"></div>
                <Label text={'Invite Co-Parent'} classes="always-show" /> {showInfo ? <LuMinus /> : <LuPlus />}
              </button>
            </AccordionSummary>
            <AccordionDetails>
              <p>
                Currently, your account is linked to {coparents?.length} {coparents?.length > 1 ? 'co-parents' : 'co-parent'}. If you wish to
                communicate with another co-parent, feel free to Send them an invitation.
              </p>

              <button
                className="default smaller"
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
          {chats?.length > 0 &&
            chats?.map((chat, index) => {
              return <ChatRow key={index} chat={chat} index={index} />
            })}
        </div>
        <NavBar />
      </div>
    </>
  )
}

export default Chats