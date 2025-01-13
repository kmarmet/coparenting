import { child, getDatabase, ref, set } from 'firebase/database'
import Manager from '../managers/manager'
import DB from '../database/DB'
import SecurityManager from './securityManager'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
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
} from '../globalFunctions'
import ChatBookmark from '../models/chat/chatBookmark'
import LogManager from './logManager'
import DB_UserScoped from '../database/db_userScoped'

const ChatManager = {
  getScopedChat: async (currentUser, messageToUserPhone) => {
    try {
      const securedChats = await SecurityManager.getChats(currentUser)
      const chatToReturn = await DB.find(securedChats, null, false, (chat) => {
        const members = chat.members
        const memberPhones = members.map((x) => x.phone)
        if (memberPhones.includes(currentUser.phone) && memberPhones.includes(messageToUserPhone)) {
          return chat
        }
      })
      return chatToReturn
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  getMessages: async (chatId) => {
    return await DB.getTable(`${DB.tables.chatMessages}/${chatId}`)
  },
  archiveChat: async (currentUser, coparent) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
    const key = await DB.getSnapshotKey(`${DB.tables.chats}/${currentUser.phone}`, securedChat, 'id')
    try {
      await DB.deleteByPath(`${DB.tables.chats}/${currentUser.phone}/${key}`)
      await DB.add(`${DB.tables.archivedChats}/${currentUser.phone}`, securedChat)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  toggleMute: async (currentUser, coparentPhone, muteOrUnmute = 'mute') => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparentPhone)
    const key = await DB.getSnapshotKey(`${DB.tables.chats}/${currentUser.phone}`, securedChat, 'id')
    let isMuted = muteOrUnmute === 'mute'
    try {
      await DB_UserScoped.updateByPath(`${DB.tables.chats}/${currentUser.phone}/${key}/isMuted`, isMuted)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  getBookmarks: async (chatId) => {
    const existingBookmarks = await DB.getTable(`${DB.tables.chatBookmarks}/${chatId}`)

    return existingBookmarks ?? []
  },
  toggleMessageBookmark: async (currentUser, messageToUser, messageId, chatId) => {
    const dbRef = ref(getDatabase())
    const existingBookmarks = await DB.getTable(`${DB.tables.chatBookmarks}/${chatId}`)
    let toAdd = []

    const newBookmark = new ChatBookmark()
    newBookmark.ownerPhone = currentUser.phone
    newBookmark.messageId = messageId

    // Bookmarks exist already
    if (Manager.isValid(existingBookmarks)) {
      const existingBookmark = await DB.find(existingBookmarks, ['messageId', messageId], false)
      if (Manager.isValid(existingBookmark)) {
        toAdd = existingBookmarks.filter((x) => x.messageId !== messageId)
      } else {
        toAdd = [...existingBookmarks, newBookmark]
      }
    } else {
      toAdd = [newBookmark]
    }

    try {
      await set(child(dbRef, `${DB.tables.chatBookmarks}/${chatId}`), toAdd).catch((error) => {})
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
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
    const chatKey = await DB.getSnapshotKey(`chats`, chat, 'id')
    if (chatKey) {
      set(child(dbRef, `chats/${chatKey}/messages`), Manager.getUniqueArray(allMessages).flat())
    }
  },
  addChat: async (path, chat) => {
    const dbRef = ref(getDatabase())
    const currentChats = await DB.getTable(path)
    let toAdd
    if (Manager.isValid(currentChats)) {
      toAdd = [...currentChats, chat]
    } else {
      toAdd = [chat]
    }
    try {
      set(child(dbRef, path), toAdd).catch((error) => {})
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  addChatMessage: async (path, message) => {
    const dbRef = ref(getDatabase())
    const currentMessages = await DB.getTable(path)
    let toAdd = []
    if (Manager.isValid(currentMessages)) {
      toAdd = [...currentMessages, message]
    } else {
      toAdd = [message]
    }
    try {
      set(child(dbRef, path), toAdd).catch((error) => {})
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
}

export default ChatManager