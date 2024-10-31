import React, { useContext, useEffect, useState } from 'react'
import Manager from '@manager'
import globalState from '../../../context.js'
import 'rsuite/dist/rsuite.min.css'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import ChatManager from '@managers/chatManager.js'
import DB_UserScoped from '@userScoped'
import { BiSolidEdit, BiSolidMessageRoundedMinus } from 'react-icons/bi'

import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
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

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threads, setThreads] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeChatsMembers, setActiveChatsMembers] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setShowDeleteButton(true)
    },
    onSwipedRight: () => {
      setShowDeleteButton(false)
    },
  })

  const openMessageThread = async (coparentPhone) => {
    const userCoparent = await DB_UserScoped.getCoparentByPhone(coparentPhone, currentUser)
    setState({ ...state, currentScreen: ScreenNames.conversation, messageToUser: userCoparent })
  }

  const getChats = async () => {
    let securedChats = await SecurityManager.getChats(currentUser)
    const chatMembers = securedChats.flat().map((x) => x.members)
    const chatMemberPhones = chatMembers.flat().map((x) => x.phone)
    setActiveChatsMembers(chatMemberPhones)
    if (Manager.isValid(securedChats, true)) {
      setThreads(securedChats.flat())
    } else {
      setThreads([])
    }
  }

  const archive = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.deleteAndArchive(currentUser, coparent)
      await getChats()
      setSelectedCoparent(null)
    }
  }

  const setNavbarButton = (action, color, icon) => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            action()
          },
          color: color,
          icon: icon,
        },
      })
    }, 100)
  }

  useEffect(() => {
    if (!selectedCoparent) {
      setTimeout(() => {
        setState({
          ...state,
          showNavbar: true,
          navbarButton: {
            ...navbarButton,
            action: () => {
              setShowNewConvoCard(true)
            },
            color: 'green',
            icon: <BiSolidEdit className={'fs-26'} />,
          },
        })
      }, 300)
    } else {
    }

    if (currentUser.accountType === 'parent') {
      getChats().then((r) => r)
    }
    Manager.showPageContainer('show')
  }, [selectedCoparent])

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        {/* THREAD LINE ITEM */}
        {!showNewThreadForm &&
          threads.length > 0 &&
          threads.map((thread, index) => {
            const coparent = thread.members.filter((x) => x.phone !== currentUser.phone)[0]
            const coparentMessages = Manager.convertToArray(thread.messages).filter((x) => x.sender === coparent.name)
            const lastMessage = coparentMessages[coparentMessages.length - 1]?.message
            return (
              <div
                key={Manager.getUid()}
                className="flex thread-item"
                {...handlers}
                onClick={(e) => {
                  if (e.target.tagName !== 'SPAN' && e.target.tagName !== 'path') {
                    openMessageThread(coparent.phone).then((r) => r)
                  }
                }}>
                {/* COPARENT NAME */}
                <div className="flex">
                  <span className="fs-40 material-icons-round mr-5">account_circle</span>
                  <p data-coparent-phone={coparent.phone} className="coparent-name">
                    {formatNameFirstNameOnly(coparent.name)}
                    {/* Last Message */}
                    <span className="last-message">{lastMessage}</span>
                  </p>
                </div>
                <BiSolidMessageRoundedMinus
                  onClick={(e) =>
                    confirmAlert(
                      'Are you sure you would like to delete this conversation? You can recover it later.',
                      "I'm Sure",
                      true,
                      async (e) => {
                        await archive(coparent)
                      },
                      () => {
                        setShowDeleteButton(false)
                        setNavbarButton(() => setShowNewThreadForm(), 'green', <BiSolidEdit />)
                      }
                    )
                  }
                  className={`fs-24 delete-icon mr-10 ${showDeleteButton ? 'active' : ''}`}
                />
              </div>
            )
          })}

        {!showNewThreadForm && threads.length === 0 && <p className="instructions center">There are currently no conversations 🤷🏽‍♂️</p>}

        {/* NEW THREAD FORM */}
        <BottomCard
          className="new-conversation"
          onClose={() => {
            setShowNewConvoCard(false)
          }}
          showCard={showNewConvoCard}
          title={'New Conversation'}>
          {Manager.isValid(currentUser?.coparents, true) &&
            currentUser?.coparents
              .filter((x) => !activeChatsMembers.includes(x.phone))
              .map((coparent, index) => {
                return (
                  <p
                    key={index}
                    className="coparent-name new-thread-coparent-name"
                    onClick={() => {
                      openMessageThread(coparent.phone).then((r) => r)
                    }}>
                    {coparent.name}
                  </p>
                )
              })}
        </BottomCard>
      </div>
    </>
  )
}

export default Chats
