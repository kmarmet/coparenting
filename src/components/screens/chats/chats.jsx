import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import Modal from '@shared/modal.jsx'
import Manager from '@manager'
import globalState from '../../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import AddNewButton from '@shared/addNewButton.jsx'
import ScreenNames from '@screenNames'
import { getDatabase, ref, set, get, child, onValue, push, remove } from 'firebase/database'
import NotificationManager from '@managers/notificationManager.js'
import { useSwipeable } from 'react-swipeable'
import ChatManager from '@managers/chatManager.js'
import DB_UserScoped from '@userScoped'
import Confirm from 'components/shared/confirm.jsx'
import DateFormats from '../../../constants/dateFormats'
import manager from '@manager'
import BottomButton from '../../shared/bottomButton'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  confirmAlert,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import SecurityManager from '../../../managers/securityManager'
import Swal from 'sweetalert2'

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threads, setThreads] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeChatsMembers, setActiveChatsMembers] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)

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
      setNavbarButton(setShowNewConvoCard(true), 'green', 'add')
      setSelectedCoparent(null)
    }
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
            icon: 'add',
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

  const showDeleteIcon = async (coparent) => {
    setState({
      ...state,
      navbarButton: {
        ...navbarButton,
        action: () => {
          confirmAlert(
            'Are you sure? If you delete this message, it will be archived. \n However, you can submit a request to recover it.',
            "I'm Sure",
            true,
            () => archive(coparent)
          )
        },
        color: 'red',
        icon: 'delete',
      },
    })
  }

  const hideDeleteIcon = () => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {},
          color: 'green',
          icon: 'add',
        },
      })
    }, 300)
    setConfirmTitle('')
    setSelectedCoparent(null)
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
              <div key={Manager.getUid()} className="flex thread-item">
                {/* COPARENT NAME */}
                <div className="flex">
                  <span className="fs-40 material-icons-round mr-5">account_circle</span>
                  <p
                    onClick={(e) => {
                      if (!e.target.classList.contains('delete-button')) {
                        openMessageThread(coparent.phone).then((r) => r)
                      }
                    }}
                    data-coparent-phone={coparent.phone}
                    className="coparent-name">
                    {formatNameFirstNameOnly(coparent.name)}
                    {/* Last Message */}
                    <span className="last-message">{lastMessage}</span>
                  </p>
                </div>
                <span
                  className="material-icons-round"
                  id="thread-action-button"
                  onClick={(e) => {
                    if (e.target.textContent === 'close') {
                      setSelectedCoparent(null)
                    } else {
                      showDeleteIcon(coparent).then((r) => r)
                    }
                  }}>
                  {selectedCoparent ? 'close' : 'more_vert'}
                </span>
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
