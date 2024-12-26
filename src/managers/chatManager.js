import { child, getDatabase, ref, set } from 'firebase/database'
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
import ConversationMessageBookmark from '../models/conversationMessageBookmark'
import LogManager from './logManager'
import DB_UserScoped from '@userScoped'
import DatasetManager from './datasetManager'

const ChatManager = {
  getScopedChat: async (currentUser, messageToUserPhone) =>
    await new Promise(async (resolve, reject) => {
      try {
        const securedChats = await SecurityManager.getChats(currentUser)
        const returnChat = securedChats.filter(
          (x) => x.members.map((x) => x.phone).includes(currentUser.phone) && x.members.map((x) => x.phone).includes(messageToUserPhone)
        )[0]
        const key = await DB.getSnapshotKey(DB.tables.chats, returnChat, 'id')
        resolve({
          chat: returnChat,
          key: key,
        })
      } catch (error) {
        LogManager.log(error.message, LogManager.logTypes.error)
      }
    }),
  hideAndArchive: async (currentUser, coparent) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
    const { chat, key, hideFrom } = securedChat
    if (Manager.isValid(securedChat?.hideFrom, true)) {
      securedChat.hideFrom = [...hideFrom, currentUser.phone]
    } else {
      securedChat.hideFrom = [currentUser.phone]
    }
    try {
      await DB_UserScoped.updateByPath(`${DB.tables.chats}/${key}/hideFrom`, securedChat.hideFrom)
      await DB.add(`${DB.tables.archivedChats}/${currentUser.phone}`, securedChat)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  toggleMute: async (currentUser, coparentPhone, muteOrUnmute = 'mute') => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparentPhone)
    const { chat, key, hideFrom } = securedChat
    if (Manager.isValid(securedChat?.mutedFor, true)) {
      if (muteOrUnmute === 'mute') {
        securedChat.mutedFor = [...securedChat.mutedFor, currentUser.phone]
      } else {
        securedChat.mutedFor = securedChat.mutedFor.filter((x) => x !== currentUser.phone)
      }
    } else {
      if (muteOrUnmute === 'mute') {
        securedChat.mutedFor = [currentUser.phone]
      }
    }
    // Get flat/unique
    securedChat.mutedFor = DatasetManager.getUniqueArray(securedChat.mutedFor, true)
    console.log(securedChat.mutedFor)
    try {
      await DB_UserScoped.updateByPath(`${DB.tables.chats}/${key}/mutedFor`, securedChat.mutedFor)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  toggleMessageBookmark: async (currentUser, messageToUser, messageId) => {
    const dbRef = ref(getDatabase())

    let scopedChatObject = await ChatManager.getScopedChat(currentUser, messageToUser.phone)
    const { key, chat } = scopedChatObject
    const { bookmarks } = chat

    // Check for already existing bookmark
    const bookmarkAlreadyExists = bookmarks?.filter((x) => x.messageId === messageId).length > 0
    // Set bookmarks property if it is not defined
    if (!Manager.isValid(chat.bookmarks)) {
      chat.bookmarks = []
    }

    // Add Bookmark
    if (!bookmarkAlreadyExists) {
      // Create Bookmark
      const newBookmark = new ConversationMessageBookmark()
      newBookmark.ownerPhone = currentUser.phone
      newBookmark.messageId = messageId
      chat.bookmarks = [...chat.bookmarks, newBookmark]
    }

    // Remove Bookmark
    else {
      chat.bookmarks = chat.bookmarks.filter((x) => x.messageId !== messageId)
    }

    try {
      await set(child(dbRef, `${DB.tables.chats}/${key}`), chat).catch((error) => {})
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
  addConvoOrMessageByPath: async (path, data, convoOrMessage) => {
    const dbRef = ref(getDatabase())
    if (!Array.isArray(data)) {
      data = [data]
    }
    const currentConversations = await DB.getTable(path)
    const toAdd = [...currentConversations, [...data]].filter((x) => x !== undefined).flat()
    try {
      set(child(dbRef, path), toAdd).catch((error) => {})
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
}

export default ChatManager