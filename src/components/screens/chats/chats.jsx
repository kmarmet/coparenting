import React, { useContext, useEffect, useState } from 'react'
import Manager from '../../../managers/manager'
import globalState from '../../../context.js'
import 'rsuite/dist/rsuite.min.css'
import ChatManager from '../../../managers/chatManager.js'
import DB_UserScoped from '../../../database/db_userScoped'
import { BiDotsVerticalRounded, BiMessageRoundedAdd, BiMessageRoundedDetail, BiSolidEdit, BiSolidMessageRoundedMinus } from 'react-icons/bi'
import { IoNotificationsOffCircle } from 'react-icons/io5'
import { HiMiniBellAlert } from 'react-icons/hi2'
import { Fade } from 'react-awesome-reveal'
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
import ScreenNames from '../../../constants/screenNames'

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [chats, setChats] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeChatPhones, setActiveChatPhones] = useState([])
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
    let chatPhones = []
    for (let chat of securedChats) {
      const chatMemberPhones = chat.members.map((x) => x.phone)
      const hideFrom = chat?.hideFrom
      if (Manager.isValid(hideFrom)) {
        if (!hideFrom.includes(currentUser.phone)) {
          chatMemberPhones.push(currentUser.phone)
        }
      } else {
        chatMemberPhones.push(currentUser.phone)
      }
    }
    setActiveChatPhones(chatPhones)
    setChats(securedChats)
  }

  const archiveChat = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.archiveChat(currentUser, coparent)
      AlertManager.successAlert('Chat Archived')
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
        title={'New Chat'}>
        {currentUser?.accountType === 'parent' &&
          Manager.isValid(currentUser?.coparents) &&
          currentUser?.coparents?.map((coparent, index) => {
            return (
              <div key={index}>
                {!activeChatPhones.includes(coparent?.phone) && (
                  <div className="flex" id="users-wrapper">
                    <div className="user-wrapper">
                      <BiMessageRoundedAdd />
                      <p
                        className="coparent-name new-thread-coparent-name"
                        onClick={() => {
                          openMessageThread(coparent).then((r) => r)
                        }}>
                        {formatNameFirstNameOnly(coparent?.name)}
                      </p>
                    </div>
                  </div>
                )}
                {activeChatPhones.includes(coparent?.phone) && <p>All available co-parents already have an open conversation with you </p>}
              </div>
            )
          })}
        {currentUser?.accountType === 'child' &&
          Manager.isValid(currentUser?.parents) &&
          currentUser?.parents?.map((parent, index) => {
            return (
              <div key={index} className="flex" id="users-wrapper">
                {!activeChatPhones.includes(parent?.phone) && (
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
                {activeChatPhones.includes(parent?.phone) && <p>All available co-parents already have an open conversation with you. </p>}
              </div>
            )
          })}
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        {!showNewThreadForm && chats.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'visitation-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Chats</p>
            {!DomManager.isMobile() && <BiSolidEdit id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
          </div>
          {/* THREAD ITEMS */}
          {!showNewThreadForm &&
            chats.length > 0 &&
            chats.map((thread, index) => {
              const coparent = thread?.members?.filter((x) => x.phone !== currentUser?.phone)[0]
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
                  className="chats"
                  key={index}>
                  {/* THREAD ITEM */}
                  <div className={`flex thread-item`}>
                    {/* COPARENT NAME */}
                    <div className="flex">
                      <div id="user-initial-wrapper">
                        <BiMessageRoundedDetail />
                      </div>
                      <p data-coparent-phone={coparent.phone} className="coparent-name">
                        {formatNameFirstNameOnly(coparent.name)}
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
                    <div id="delete-wrapper">
                      <BiSolidMessageRoundedMinus
                        onClick={(e) => {
                          e.stopPropagation()
                          AlertManager.confirmAlert(
                            'Once deleted, you can visit Account -> Chat Recovery to recover the messages. Are you sure?',
                            "I'm Sure",
                            true,
                            async (e) => {
                              await archiveChat(coparent)
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

                    {!thread.isMuted && (
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
                    {thread.isMuted && (
                      <div id="unmute-wrapper">
                        <HiMiniBellAlert id={'unmute-icon'} onClick={() => toggleMute(coparent.phone, 'unmute', thread.id)} />
                        <span>UNMUTE</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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