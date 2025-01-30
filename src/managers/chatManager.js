import { child, getDatabase, ref, set } from 'firebase/database'
import Manager from '../managers/manager'
import DB from '../database/DB'
import SecurityManager from './securityManager'
import ChatBookmark from '../models/chat/chatBookmark'
import LogManager from './logManager'
import DatasetManager from './datasetManager.coffee'
import StringManager from './stringManager.coffee'

const ChatManager = {
  getToneRating: (toneObject) => {
    const overallToneArray = toneObject?.overall
    let tone = 'Great/Neutral'
    if (overallToneArray) {
      const primaryTone = toneObject?.overall[0][1]
      const badWords = ['angry', 'disapproving', 'repulsed', 'annoyed', 'disappointed']
      if (badWords.includes(primaryTone)) {
        tone = `${StringManager.uppercaseFirstLetterOfAllWords(primaryTone)} (Revision Suggested)`
      }
    }
    return {
      tone,
      color: tone === 'Great/Neutral' ? 'green' : 'red',
    }
  },
  getTone: (message) =>
    new Promise((resolve, reject) => {
      fetch('https://api.sapling.ai/api/v1/tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: '7E3IFZEMEKYEHVIMJHENF9ETHHTKARA4',
          text: message,
        }),
      })
        .then((response) => response)
        .then((result) => {
          resolve(result.json())
        })
        .catch((error) => reject(error))
    }),
  getScopedChat: async (currentUser, messageToUserPhone) => {
    try {
      const securedChats = await SecurityManager.getChats(currentUser)
      let chatToReturn = null
      for (let chat of securedChats) {
        const memberPhones = chat.members.map((x) => x.phone)
        if (memberPhones.includes(currentUser.phone) && memberPhones.includes(messageToUserPhone)) {
          chatToReturn = chat
        }
      }
      return chatToReturn
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  getMessages: async (chatId) => {
    return await DB.getTable(`${DB.tables.chatMessages}/${chatId}`)
  },
  pauseChat: async (currentUser, coparent) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
    try {
      let isPausedFor = securedChat.isPausedFor

      if (!Manager.isValid(isPausedFor)) {
        isPausedFor = [currentUser.phone]
      } else {
        isPausedFor = [...isPausedFor, currentUser.phone]
      }
      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      securedChat.isPausedFor = isPausedFor
      // Set chat inactive
      await DB.updateEntireRecord(`${DB.tables.chats}/${currentUser.phone}`, securedChat, securedChat.id)
      await DB.updateEntireRecord(`${DB.tables.chats}/${coparent.phone}`, securedChat, securedChat.id)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error)
    }
  },
  unpauseChat: async (currentUser, coparent) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparent.phone)
    try {
      let isPausedFor = securedChat?.isPausedFor?.filter((x) => x !== currentUser.phone)
      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      securedChat.isPausedFor = isPausedFor
      // Set chat inactive
      await DB.updateEntireRecord(`${DB.tables.chats}/${currentUser.phone}`, securedChat, securedChat.id)
      await DB.updateEntireRecord(`${DB.tables.chats}/${coparent.phone}`, securedChat, securedChat.id)
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