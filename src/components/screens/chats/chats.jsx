import React, { useContext, useEffect, useState } from 'react'
import Manager from '@manager'
import globalState from '../../../context.js'
import 'rsuite/dist/rsuite.min.css'
import ScreenNames from '@screenNames'
import ChatManager from '@managers/chatManager.js'
import DB_UserScoped from '@userScoped'
import { BiDotsVerticalRounded, BiMessageRoundedDetail, BiSolidEdit, BiSolidMessageRoundedMinus } from 'react-icons/bi'
import { IoNotificationsOffCircle } from 'react-icons/io5'
import { HiMiniBellAlert } from 'react-icons/hi2'
import { IoMdCloseCircleOutline } from 'react-icons/io'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import SecurityManager from '../../../managers/securityManager'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threads, setThreads] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeThreadPhones, setActiveThreadPhones] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)
  const [threadActionToShow, setThreadActionToShow] = useState(false)

  const openMessageThread = async (coparentPhone) => {
    const userCoparent = await DB_UserScoped.getCoparentByPhone(coparentPhone, currentUser)
    setState({ ...state, currentScreen: ScreenNames.conversation, messageRecipient: userCoparent })
  }

  const getSecuredChats = async () => {
    let securedChats = await SecurityManager.getChats(currentUser)
    let threadPhones = []
    for (let chat of securedChats) {
      const threadMemberPhones = chat.members.map((x) => x.phone)
      threadMemberPhones.forEach((phone) => threadPhones.push(phone))
    }
    setActiveThreadPhones(threadPhones)
    setThreads(securedChats)
  }

  const archive = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.hideAndArchive(currentUser, coparent)
      await getSecuredChats()
      setSelectedCoparent(null)
    }
  }

  const toggleMute = async (coparentPhone, muteOrUnmute, threadId) => {
    await ChatManager.toggleMute(currentUser, coparentPhone, muteOrUnmute)
    await getSecuredChats()
    toggleThreadActions(threadId)
  }

  const toggleThreadActions = (threadId) => {
    const threadAction = document.querySelector(`.thread-actions[data-thread-id='${threadId}']`)

    if (DomManager.hasClass(threadAction, 'active')) {
      threadAction.classList.remove('active')
      setThreadActionToShow(null)
    } else {
      setThreadActionToShow(threadId)
      threadAction.classList.add('active')
    }
  }

  useEffect(() => {
    if (currentUser?.accountType === 'parent') {
      getSecuredChats().then((r) => r)
    }
    Manager.showPageContainer('show')
  }, [selectedCoparent])

  return (
    <>
      {/* NEW THREAD FORM */}
      <BottomCard
        hasSubmitButton={false}
        className="new-conversation"
        onClose={() => setShowNewConvoCard(false)}
        showCard={showNewConvoCard}
        title={'New Conversation'}>
        {currentUser?.accountType === 'parent' &&
          Manager.isValid(currentUser?.coparents, true) &&
          currentUser?.coparents?.map((coparent, index) => {
            return (
              <div key={index}>
                {!activeThreadPhones.includes(coparent.phone) && (
                  <p
                    className="coparent-name new-thread-coparent-name"
                    onClick={() => {
                      openMessageThread(coparent.phone).then((r) => r)
                    }}>
                    {coparent.name}
                  </p>
                )}
                {activeThreadPhones.includes(coparent.phone) && <p>All available co-parents aleady have an open conversation with you. </p>}
              </div>
            )
          })}
        {currentUser?.accountType === 'child' &&
          Manager.isValid(currentUser?.parents, true) &&
          currentUser?.parents?.map((parent, index) => {
            console.log(parent)
            return (
              <div key={index}>
                {!activeThreadPhones.includes(parent.phone) && (
                  <p
                    className="coparent-name new-thread-coparent-name"
                    onClick={() => {
                      openMessageThread(parent.phone).then((r) => r)
                    }}>
                    {parent.name}
                  </p>
                )}
                {activeThreadPhones.includes(parent.phone) && <p>All available co-parents aleady have an open conversation with you. </p>}
              </div>
            )
          })}
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        <p className="screen-title">Chats</p>
        {/* THREAD ITEMS */}
        {!showNewThreadForm &&
          threads.length > 0 &&
          threads.map((thread, index) => {
            const coparent = thread?.members?.filter((x) => x.phone !== currentUser?.phone)[0]
            const coparentMessages = Manager.convertToArray(thread.messages)?.filter((x) => x.sender === coparent.name)
            const lastMessage = coparentMessages[coparentMessages?.length - 1]?.message
            const threadIsMuted = thread?.mutedFor?.includes(currentUser.phone)
            return (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  if (e.currentTarget.id === 'row') {
                    openMessageThread(coparent.phone).then((r) => r)
                  }
                  console.log(e.currentTarget)
                  if (e.target !== e.currentTarget) return
                }}
                data-thread-id={thread.id}
                id="row"
                key={index}>
                {/* THREAD ITEM */}
                <div className={`flex thread-item ${threadIsMuted ? 'muted' : ''}`}>
                  {/* COPARENT NAME */}
                  <div className="flex">
                    <div id="user-initial-wrapper">
                      <BiMessageRoundedDetail />
                    </div>
                    <p data-coparent-phone={coparent.phone} className="coparent-name">
                      {formatNameFirstNameOnly(coparent.name)}
                      {/* Last Message */}
                      <span className="last-message">{lastMessage}</span>
                    </p>
                  </div>

                  {threadActionToShow === thread.id && (
                    <IoMdCloseCircleOutline
                      id={'close-thread-actions-icon'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleThreadActions(thread.id)
                      }}
                    />
                  )}
                  {threadActionToShow !== thread.id && (
                    <BiDotsVerticalRounded
                      id={'edit-icon'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleThreadActions(thread.id)
                      }}
                    />
                  )}
                </div>
                {/* THREAD ACTIONS */}
                <div data-thread-id={thread.id} className={'flex thread-actions'}>
                  {/* DELETE CHAT BUTTON */}
                  <div id="archive-wrapper">
                    <BiSolidMessageRoundedMinus
                      onClick={(e) => {
                        e.stopPropagation()
                        AlertManager.confirmAlert(
                          'Are you sure you would like to delete this conversation? You can recover it later.',
                          "I'm Sure",
                          true,
                          async (e) => {
                            await archive(coparent)
                          },
                          () => {
                            setThreadActionToShow(false)
                          }
                        )
                      }}
                      className={`delete-icon ${threadActionToShow ? 'active' : ''}`}
                    />
                    <span>DELETE</span>
                  </div>

                  {!threadIsMuted && (
                    <div id="mute-wrapper">
                      <IoNotificationsOffCircle
                        onClick={async (e) => {
                          e.stopPropagation()
                          await toggleMute(coparent.phone, 'mute', thread.id)
                        }}
                        className={'mute-icon '}
                      />
                      <span>MUTE</span>
                    </div>
                  )}
                  {/* UNMUTE BUTTON */}
                  {threadIsMuted && (
                    <div id="unmute-wrapper">
                      <HiMiniBellAlert id={'unmute-icon'} onClick={() => toggleMute(coparent.phone, 'unmute', thread.id)} />
                      <span>UNMUTE</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        {!showNewThreadForm && threads.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}
      </div>
      {!showNewConvoCard && (
        <NavBar navbarClass={'calendar'}>
          <BiSolidEdit id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />
        </NavBar>
      )}
    </>
  )
}

export default Chats