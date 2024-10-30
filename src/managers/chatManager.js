import { child, get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import { getStorage, getDownloadURL, listAll, uploadBytes, deleteObject, put, firebase, bucket } from 'firebase/storage'
import moment from 'moment'
import Manager from '@manager'
import FirebaseStorage from '@firebaseStorage'
import DB from '@db'
import AppManager from '@managers/appManager'
import SecurityManager from './securityManager'

const ChatManager = {
  getChats: async (currentUser) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `chats`)).then(async (dbChats) => {
        let scopedChats = []
        const allChats = Manager.convertToArray(dbChats.val())
        const coparentPhones = currentUser?.coparents.map((x) => x.phone)
        let coparents = currentUser?.coparents.filter((x) => coparentPhones.includes(x.phone))
        allChats.forEach((thisChat) => {
          if (thisChat !== undefined && thisChat.members !== undefined) {
            const threadMembers = thisChat.members.map((x) => x.phone)
            coparents.forEach((coparent) => {
              // Ensure currentUser/coparent are in thread before passing it
              if (threadMembers.includes(coparent.phone) && threadMembers.includes(currentUser.phone)) {
                scopedChats.push(thisChat)
              }
            })
          }
        })
        resolve(scopedChats)
      })
    }),
  getExistingMessages: async (currentUser, messageToUser) => {
    const existingThread = await ChatManager.getScopedChat(currentUser, messageToUser.phone)
    if (existingThread) {
      const { key, chats } = existingThread
      let messages = chats.messages
      if (!Array.isArray(messages)) {
        messages = Manager.convertToArray(messages)
      }
      if (!Manager.isValid(messages, true)) {
        return false
      }
      const sortedArray = messages.sort((a, b) => moment(a.timestamp, 'MM/DD/yyyy hh:mma').unix() - moment(b.timestamp, 'MM/DD/yyyy hh:mma').unix())
      const bookmarkedMessages = messages.filter((x) => x.bookmarked === true)
      return { messages: sortedArray, bookmarkedMessages, key, chats }
    }
  },
  getActiveChats: async (currentUser) => {
    const chats = await SecurityManager.getChats(currentUser)
    let activeChats = []
    if (Manager.isValid(chats, true)) {
      for (let chat of chats) {
        const memberPhones = chat.members.map((x) => x.phone)
        if (memberPhones.includes(currentUser.phone)) {
          activeChats.push({
            memberPhones,
            chat,
          })
        }
      }
    }
    return activeChats
  },
  getScopedChat: async (currentUser, messageToUserPhone) =>
    await new Promise(async (resolve, reject) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `chats`))
        .then(async (snapshot) => {
          if (snapshot.exists()) {
            snapshot.forEach((shot) => {
              const memberPhones = shot.val().members.map((x) => x.phone)
              if (memberPhones.includes(currentUser.phone) && memberPhones.includes(messageToUserPhone)) {
                resolve({
                  chats: shot.val(),
                  key: shot.key,
                })
              }
            })
          }
        })
        .catch(() => {
          reject(null)
        })
    }),
  deleteAndArchive: async (currentUser, coparent) => {
    const dbRef = ref(getDatabase())
    const scopedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
    const { chats } = scopedChat
    await DB.add(DB.tables.archivedChats, chats).finally(async () => {
      const idToDelete = await DB.getSnapshotKey(DB.tables.chats, chats, 'id')
      console.log(idToDelete)
      remove(child(dbRef, `${DB.tables.chats}/${idToDelete}/`))
    })
  },
  toggleMessageBookmark: async (currentUser, messageToUser, messageId, bookmarkState) => {
    const database = getDatabase()
    const scopedChat = await ChatManager.getScopedChat(currentUser, messageToUser.phone)
    const { key } = scopedChat
    let chatMessages = Manager.convertToArray(scopedChat.chats.messages)
    const messageToToggleBookmarkState = chatMessages.filter((x) => x.id === messageId)[0]
    const messageKey = await DB.getSnapshotKey(`${DB.tables.chats}/${key}/messages`, messageToToggleBookmarkState, 'id')
    const dbRef = ref(database, `${DB.tables.chats}/${key}/messages/${messageKey}`)
    const messageBookmarkState = messageToToggleBookmarkState.bookmarked
    await update(dbRef, { ['bookmarked']: !messageBookmarkState })
  },
  markMessagesRead: async (currentUser, messageToUser) => {
    const dbRef = ref(getDatabase())

    const execute = async () =>
      new Promise(async (resolve) => {
        // Get threads where currentUser is a member
        let currentUserChats = await ChatManager.getScopedChat(currentUser, messageToUser.phone)
        const { key, chats } = currentUserChats
        if (!Manager.isValid(currentUserChats, false, true) || Object.keys(currentUserChats).length === 0) {
          return false
        }

        let membersMessages = chats.messages
        let allMessages = []

        // Mark unread messages as read
        if (Manager.isValid(membersMessages, true)) {
          membersMessages.forEach((message) => {
            if (message.readState === 'delivered' && message.fromName === messageToUser.name) {
              message.readState = 'read'
              allMessages.push(message)
            } else {
              allMessages.push(message)
            }
          })
        }

        if (allMessages.length === 0) {
          return false
        }

        resolve({ allMessages, key })
      })
    const results = await execute()
    const { key, allMessages } = results
    set(child(dbRef, `chats/${key}/messages`), Manager.getUniqueArray(allMessages).flat())
    // AppManager.clearAppBadge()
  },
  addMessage: (chatKey, newMessage) => {
    const db = getDatabase()
    const postListRef = ref(db, `chats/${chatKey}/messages`)
    const newPostRef = push(postListRef)
    set(newPostRef, newMessage)
  },
}

export default ChatManager
