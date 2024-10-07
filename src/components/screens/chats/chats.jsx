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

const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threads, setThreads] = useState([])
  const [confirmTitle, setConfirmTitle] = useState('')
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeChatsMembers, setActiveChatsMembers] = useState([])

  const openMessageThread = async (coparentPhone) => {
    const userCoparent = await DB_UserScoped.getCoparent(coparentPhone, currentUser)
    setState({ ...state, currentScreen: ScreenNames.conversation, messageToUser: userCoparent })
  }

  const getChats = async () => {
    let scopedChats = await ChatManager.getChats(currentUser)
    if (Manager.isValid(scopedChats, true)) {
      setThreads(scopedChats.flat())

      // SET LAST MESSAGE
      setTimeout(async () => {
        const threadItems = document.querySelectorAll('.thread-item')
        for (const item of threadItems) {
          const parWithPhone = item.querySelector('.coparent-name')
          if (parWithPhone) {
            const coparentPhoneNumber = parWithPhone.getAttribute('data-coparent-phone')
            const coparent = currentUser.coparents.filter((x) => x.phone === coparentPhoneNumber)[0]
            const scopedChat = await ChatManager.getExistingMessages(currentUser, coparent)
            const { messages } = scopedChat
            let scopedMessages = messages.filter((x) => x.sender.formatNameFirstNameOnly() === coparent.name)
            const lastScopedMessage = scopedMessages[scopedMessages.length - 1]?.message
            const existingLastMessage = document.querySelector('.last-message')
            const existingTimestamp = document.querySelector('.timestamp')
            if (existingTimestamp && existingLastMessage) {
              existingTimestamp.remove()
              existingLastMessage.remove()
            }
            if (Manager.isValid(lastScopedMessage)) {
              const timestamp = scopedMessages[scopedMessages.length - 1].timestamp
              parWithPhone.insertAdjacentHTML(
                'beforeend',
                `<p class="timestamp ml-auto">${moment(timestamp, DateFormats.fullDatetime).format(DateFormats.readableDatetime)}</p>`
              )
              parWithPhone.insertAdjacentHTML('beforeend', `<p class="last-message mt-0">${lastScopedMessage}</p>`)
            }
          }
        }
      }, 200)
    } else {
      setThreads([])
    }
  }

  const setInboxUnreadCount = async () => {
    const coparentElements = document.querySelectorAll('[data-coparent-phone]')
    const dbRef = ref(getDatabase())

    await get(child(dbRef, `${DB.tables.users}`)).then((users) => {
      const usersVal = users.val()
      const usersWithInbox = DB.convertKeyObjectToArray(usersVal).filter((x) => x.chats !== undefined)
      coparentElements.forEach(async (el, elIndex) => {
        const coparentPhone = el.getAttribute('data-coparent-phone')

        usersWithInbox.forEach((userWithInbox, index) => {
          const threads = DB.convertKeyObjectToArray(userWithInbox.chats)
            .filter((x) => x.hasOwnProperty('members'))
            .flat()
          let threadToUse
          threads.forEach((thread) => {
            const members = thread.members
            const currentUserIsValidMember = members.filter((x) => x.phone === currentUser.phone)
            const coparentIsValidMember = members.filter((x) => x.phone === coparentPhone)
            if (currentUserIsValidMember.length > 0 && coparentIsValidMember.length > 0) {
              threadToUse = thread
            }
          })
          if (Manager.isValid(threadToUse, false, true) && Manager.isValid(threadToUse.messages, true)) {
            let messages = threadToUse.messages.filter(
              (x) => x.readState === 'delivered' && x.toName === currentUser.name && x.fromName !== currentUser.name
            )
            const countSpan = el.nextSibling
            if (messages.length > 0) {
              if (countSpan && messages.length > 0) {
                el.nextSibling.innerText = messages.length
                countSpan.classList.add('active')
              }
            } else {
              countSpan.style.display = 'none'
            }
            setState({ ...state, unreadMessages: messages.length })
          }
        })
      })
    })
  }

  const archive = async () => {
    if (Manager.isValid(selectedCoparent)) {
      await ChatManager.deleteAndArchive(currentUser, selectedCoparent)
      setConfirmTitle('')
      await getChats()
      setSelectedCoparent(null)
    }
  }

  const getSetActiveChats = async () => {
    const activeChats = await ChatManager.getActiveChats(currentUser)
    const activeChatsMembers = activeChats.map((x) => x.memberPhones).flat()
    setActiveChatsMembers(activeChatsMembers || [])
  }

  useEffect(() => {
    getSetActiveChats().then((r) => r)

    setState({
      ...state,
      currentScreen: ScreenNames.chats,
      menuIsOpen: false,
      showMenuButton: true,
      showBackButton: false,
    })
    if (currentUser.accountType === 'parent') {
      getChats().then((r) => r)
    }
    Manager.toggleForModalOrNewForm('show')
  }, [])

  useEffect(() => {
    Manager.toggleForModalOrNewForm('show')
    getChats().then((r) => r)
  }, [showNewThreadForm])

  return (
    <>
      {/* SCREEN TITLES */}
      {showNewThreadForm && <p className="screen-title pl-10">New Conversation</p>}
      {!showNewThreadForm && <p className="screen-title pl-10">Chats</p>}

      {/* DELETE CONFIRMATION */}
      <Confirm
        onAccept={archive}
        onCancel={async () => {
          await getChats()
          setConfirmTitle('')
          setSelectedCoparent(null)
        }}
        onReject={async () => {
          await getChats()
          setSelectedCoparent(null)
          setConfirmTitle('')
        }}
        title={confirmTitle}
        message={'Are you sure? If you delete this message, it will be archived. However, you can submit a request to view it.'}
      />

      {/* ADD NEW BUTTON */}
      {!showNewThreadForm && (
        <AddNewButton
          scopedClass={'chats'}
          onClick={() => {
            setShowNewThreadForm(true)
            setState({ ...state, currentScreenTitle: 'New Message' })
          }}
          icon={'add_comment'}
        />
      )}

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${currentUser?.settings?.theme} page-container`}>
        {/* THREAD LINE ITEM */}
        {!showNewThreadForm &&
          threads.length > 0 &&
          threads.map((thread, index) => {
            const coparent = thread.members.filter((x) => x.phone !== currentUser.phone)[0]
            return (
              <div key={Manager.getUid()} className="flex thread-item">
                {/* COPARENT NAME */}
                <p
                  onClick={(e) => {
                    if (!e.target.classList.contains('delete-button')) {
                      openMessageThread(coparent.phone).then((r) => r)
                    }
                  }}
                  data-coparent-phone={coparent.phone}
                  className="coparent-name">
                  {coparent.name.formatNameFirstNameOnly()}
                </p>
                <span
                  className="material-icons-round"
                  id="thread-action-button"
                  onClick={async () => {
                    selectedCoparent ? setSelectedCoparent(false) : setSelectedCoparent(coparent)
                    await getChats()
                  }}>
                  {selectedCoparent ? 'close' : 'more_vert'}
                </span>
                {selectedCoparent && (
                  <BottomButton
                    phoneDataAttribute={coparent.phone}
                    bottom="162"
                    type="delete"
                    iconName="delete"
                    elClass={'visible'}
                    onClick={() => {
                      setConfirmTitle(`DELETING CONVERSATION WITH ${selectedCoparent.name.getFirstWord()}`)
                      // setSelectedCoparent(coparent)
                    }}
                  />
                )}
              </div>
            )
          })}

        {!showNewThreadForm && threads.length === 0 && <p className="instructions center">There are currently no conversations 🤷🏽‍♂️</p>}

        {/* NEW THREAD FORM */}
        {showNewThreadForm &&
          Manager.isValid(currentUser.coparents, true) &&
          currentUser.coparents
            .filter((x) => !activeChatsMembers.includes(x.phone))
            .map((coparent, index) => {
              return (
                <p key={index} className="coparent-name thread-item blue" onClick={() => openMessageThread(coparent.phone)}>
                  {coparent.name} <span className="material-icons">arrow_forward_ios</span>
                </p>
              )
            })}
        {showNewThreadForm && (
          <button
            onClick={() => {
              setShowNewThreadForm(false)
              setSelectedCoparent(null)
            }}
            id="close-new-conversation-button">
            <span className="material-icons-round">arrow_back</span>
          </button>
        )}
      </div>
    </>
  )
}

export default Chats
