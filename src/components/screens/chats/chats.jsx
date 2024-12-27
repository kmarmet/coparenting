import React, { useContext, useEffect, useState } from 'react'
import Manager from '@manager'
import globalState from '../../../context.js'
import 'rsuite/dist/rsuite.min.css'
import ChatManager from '@managers/chatManager.js'
import DB_UserScoped from '@userScoped'
import { BiDotsVerticalRounded, BiMessageRoundedAdd, BiMessageRoundedDetail, BiSolidEdit, BiSolidMessageRoundedMinus } from 'react-icons/bi'
import { IoNotificationsOffCircle } from 'react-icons/io5'
import { HiMiniBellAlert } from 'react-icons/hi2'
import { Fade } from 'react-awesome-reveal'
import { MdArchive } from 'react-icons/md'
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
import ScreenNames from '@screenNames'
import DB from '@db'

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threads, setThreads] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeThreadPhones, setActiveThreadPhones] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)
  const [threadActionToShow, setThreadActionToShow] = useState(false)

  const openMessageThread = async (coparent) => {
    // Check if thread member (coparent) account exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByPhone(coparent?.phone, currentUser)
    if (!Manager.isValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Account not Found',
        'This co-parent may have closed their account, however, you can still view the messages',
        null,
        () => {
          setState({ ...state, currentScreen: ScreenNames.conversation, messageRecipient: coparent })
        }
      )
    } else {
      setState({ ...state, currentScreen: ScreenNames.conversation, messageRecipient: userCoparent })
    }
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

  const archiveOrDelete = async (coparent, archiveOrDelete) => {
    if (Manager.isValid(coparent) && archiveOrDelete === 'archive') {
      await ChatManager.hideAndArchive(currentUser, coparent)
      AlertManager.successAlert('Conversation Archived')
      await getSecuredChats()
      setSelectedCoparent(null)
    } else {
      const scopedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
      const key = scopedChat.key
      await DB.deleteByPath(`${DB.tables.chats}/${key}`)
      AlertManager.successAlert('Conversation Deleted Permanently')
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
    if (Manager.isValid(threadAction)) {
      if (threadAction.classList.contains('active')) {
        threadAction.classList.remove('active')
        setThreadActionToShow(null)
      } else {
        setThreadActionToShow(threadId)
        threadAction.classList.add('active')
      }
    }
  }

  useEffect(() => {
    if (currentUser?.accountType === 'parent') {
      getSecuredChats().then((r) => r)
    }
  }, [selectedCoparent])

  return (
    <>
      {/* NEW THREAD FORM */}
      <BottomCard
        hasSubmitButton={false}
        className="new-conversation"
        wrapperClass="new-conversation"
        onClose={() => setShowNewConvoCard(false)}
        showCard={showNewConvoCard}
        title={'New Conversation'}>
        {currentUser?.accountType === 'parent' &&
          Manager.isValid(currentUser?.coparents, true) &&
          currentUser?.coparents?.map((coparent, index) => {
            return (
              <div key={index} className="flex" id="users-wrapper">
                {!activeThreadPhones.includes(coparent?.phone) && (
                  <div className="user-wrapper">
                    <BiMessageRoundedAdd />
                    <p
                      className="coparent-name new-thread-coparent-name"
                      onClick={() => {
                        openMessageThread(coparent).then((r) => r)
                      }}>
                      {getFirstWord(coparent?.name)}
                    </p>
                  </div>
                )}
                {activeThreadPhones.includes(coparent?.phone) && <p>All available co-parents already have an open conversation with you </p>}
              </div>
            )
          })}
        {currentUser?.accountType === 'child' &&
          Manager.isValid(currentUser?.parents, true) &&
          currentUser?.parents?.map((parent, index) => {
            return (
              <div key={index} className="flex" id="users-wrapper">
                {!activeThreadPhones.includes(parent?.phone) && (
                  <div className="user-wrapper">
                    <BiMessageRoundedAdd />
                    <p
                      className="coparent-name new-thread-coparent-name"
                      onClick={() => {
                        openMessageThread(parent?.phone).then((r) => r)
                      }}>
                      {parent?.name}
                    </p>
                  </div>
                )}
                {activeThreadPhones.includes(parent?.phone) && <p>All available co-parents already have an open conversation with you. </p>}
              </div>
            )
          })}
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'visitation-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Chats </p>
            {!DomManager.isMobile() && <BiSolidEdit id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
          </div>
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
                      openMessageThread(coparent).then((r) => r)
                    }
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
                    {/* ARCHIVE CHAT BUTTON */}
                    <div id="archive-wrapper">
                      <MdArchive
                        onClick={(e) => {
                          e.stopPropagation()
                          AlertManager.confirmAlert(
                            'Are you sure you would like to archive this conversation? You can recover it later.',
                            "I'm Sure",
                            true,
                            async (e) => {
                              await archiveOrDelete(coparent, 'archive')
                            },
                            () => {
                              setThreadActionToShow(false)
                              const threadAction = document.querySelector(`.thread-actions[data-thread-id='${thread.id}']`)
                              threadAction.classList.remove('active')
                            }
                          )
                        }}
                        className={`archive-icon ${threadActionToShow ? 'active' : ''}`}
                      />
                      <span>ARCHIVE</span>
                    </div>
                    {/* DELETE CHAT BUTTON */}
                    <div id="delete-wrapper">
                      <BiSolidMessageRoundedMinus
                        onClick={(e) => {
                          e.stopPropagation()
                          AlertManager.confirmAlert(
                            'Are you sure you would like to delete this conversation? It will be permanently removed.',
                            "I'm Sure",
                            true,
                            async (e) => {
                              await archiveOrDelete(coparent, 'delete')
                            },
                            () => {
                              setThreadActionToShow(false)
                              const threadAction = document.querySelector(`.thread-actions[data-thread-id='${thread.id}']`)
                              threadAction.classList.remove('active')
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
        </Fade>
      </div>
      {!showNewConvoCard && (
        <NavBar navbarClass={'calendar'}>
          {DomManager.isMobile() && <BiMessageRoundedAdd id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
        </NavBar>
      )}
    </>
  )
}

export default Chats