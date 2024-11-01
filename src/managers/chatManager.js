import { child, get, getDatabase, ref, set, update } from 'firebase/database'
import Manager from '@manager'
import DB from '@db'
import SecurityManager from './securityManager'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
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
} from '../globalFunctions'

const ChatManager = {
  getScopedChat: async (currentUser, messageToUserPhone) =>
    await new Promise(async (resolve, reject) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `${DB.tables.chats}/${currentUser.phone}`))
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
    const securedChats = await SecurityManager.getChats(currentUser)
    const securedChat = securedChats.filter(
      (x) => x.members.map((x) => x.phone).includes(currentUser.phone) && x.members.map((x) => x.phone).includes(coparent.phone)
    )[0]
    const chatKey = await DB.getNestedSnapshotKey(`${DB.tables.chats}`, securedChat, 'id')
    const visMembersWithoutCurrentUser = securedChat.threadVisibilityMembers.filter((x) => x.phone !== currentUser.phone)
    // console.log(visMembersWithoutCurrentUser)
    // await DB_UserScoped.updateByPath(`${DB.tables.chats}/${securedChat.threadOwner}/${chatKey}/threadVisibilityMembers`, visMembersWithoutCurrentUser)
    // const idToDelete = await DB.getSnapshotKey(`${DB.tables.chats}/${currentUser.phone}`, securedChat, 'id')
    // remove(child(dbRef, `${DB.tables.chats}/${currentUser.phone}/${idToDelete}/`))
    // await DB.add(DB.tables.archivedChats, securedChat).finally(async () => {
    //   remove(child(dbRef, `${DB.tables.chats}/${securedChat.threadOwner}/${chatKey}/`))
    // })
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
  markMessagesRead: async (currentUser, messageToUser, chat) => {
    const dbRef = ref(getDatabase())
    let messages = Manager.convertToArray(chat.messages)
    let allMessages = []

    // Mark unread messages as read
    if (Manager.isValid(messages, true)) {
      messages.forEach((message) => {
        if (message.readState === 'delivered' && formatNameFirstNameOnly(message.recipient) === formatNameFirstNameOnly(currentUser.name)) {
          message.readState = 'read'
          allMessages.push(message)
        } else {
          allMessages.push(message)
        }
      })
    }
    const chatKey = await DB.getSnapshotKey(`chats/${currentUser.phone}`, chat, 'id')
    if (chatKey) {
      set(child(dbRef, `chats/${currentUser.phone}/${chatKey}/messages`), Manager.getUniqueArray(allMessages).flat())
    }
  },
  addConvoOrMessageByPath: async (path, data) => {
    const dbRef = ref(getDatabase())
    if (!Array.isArray(data)) {
      data = [data]
    }
    const currentConversations = await DB.getTable(path)
    const toAdd = [...currentConversations, [...data]].filter((x) => x !== undefined).flat()
    set(child(dbRef, path), toAdd).catch((error) => {})
  },
}

export default ChatManager
