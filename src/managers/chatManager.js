// Path: src\managers\chatManager.js
import {child, getDatabase, ref, set} from 'firebase/database'
import DB from '../database/DB'
import Manager from '../managers/manager'
import ChatBookmark from '../models/chat/chatBookmark'
import DatasetManager from './datasetManager.coffee'
import LogManager from './logManager'
import SecurityManager from './securityManager'

const ChatManager = {
  getToneAndSentiment: async (message) => {
    let tone = await ChatManager.getTone(message)
    let sentiment = await ChatManager.getSentiment(message)

    if (!Manager.IsValid(tone) || !Manager.IsValid(sentiment)) {
      return false
    }
    let warningSentiments = ['sad']

    const returnTone = tone?.overall[0][1]
    const returnSentiment = sentiment?.overall[0][1]
    let icon = tone?.overall[0][2]
    let color = returnSentiment === 'NEGATIVE' ? 'red' : 'green'

    if (warningSentiments.includes(returnTone)) {
      color = 'yellow'
    }

    return {
      tone: returnTone,
      sentiment: returnSentiment,
      color: color,
      icon,
    }
  },
  getSentiment: (message) =>
    new Promise((resolve, reject) => {
      fetch('https://api.sapling.ai/api/v1/sentiment', {
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
        .catch((error) => {
          console.log(error.message)
          reject(error)
        })
    }),
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
        .catch((error) => {
          console.log(error)
          reject(error)
        })
    }),
  getScopedChat: async (currentUser, messageToUserKey) => {
    try {
      const securedChats = await SecurityManager.getChats(currentUser)
      let chatToReturn = null
      for (let chat of securedChats) {
        const memberKeys = chat.members.map((x) => x.key)
        if (memberKeys.includes(currentUser.key) && memberKeys.includes(messageToUserKey)) {
          chatToReturn = chat
        }
      }
      return chatToReturn
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
  getMessages: async (chatId) => {
    return await DB.getTable(`${DB.tables.chatMessages}/${chatId}`)
  },
  pauseChat: async (currentUser, coparentKey) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparentKey)
    try {
      let isPausedFor = securedChat.isPausedFor

      if (!Manager.IsValid(isPausedFor)) {
        isPausedFor = [currentUser?.key]
      } else {
        isPausedFor = [...isPausedFor, currentUser?.key]
      }
      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      securedChat.isPausedFor = isPausedFor
      // Set chat inactive
      await DB.updateEntireRecord(`${DB.tables.chats}/${currentUser?.key}`, securedChat, securedChat.id)
      await DB.updateEntireRecord(`${DB.tables.chats}/${coparentKey}`, securedChat, securedChat.id)
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
  unpauseChat: async (currentUser, coparentKey) => {
    const securedChat = await ChatManager.getScopedChat(currentUser, coparentKey)
    try {
      let isPausedFor = securedChat?.isPausedFor?.filter((x) => x !== currentUser?.key)
      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      securedChat.isPausedFor = isPausedFor
      // Set chat inactive
      await DB.updateEntireRecord(`${DB.tables.chats}/${currentUser?.key}`, securedChat, securedChat.id)
      await DB.updateEntireRecord(`${DB.tables.chats}/${coparentKey}`, securedChat, securedChat.id)
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
  getBookmarks: async (chatId) => {
    let existingBookmarks = await DB.getTable(`${DB.tables.chatBookmarks}/${chatId}`)
    existingBookmarks = DatasetManager.GetValidArray(existingBookmarks)

    return existingBookmarks
  },
  ToggleMessageBookmark: async (currentUser, messageToUser, messageId, chatId, existingBookmarks) => {
    try {
      const dbRef = ref(getDatabase())
      let updated = []

      const newBookmark = new ChatBookmark()
      newBookmark.ownerKey = currentUser?.key
      newBookmark.messageId = messageId
      const existsAlready = existingBookmarks.find((x) => x?.messageId === messageId)
      if (Manager.IsValid(existsAlready)) {
        updated = existingBookmarks.filter((x) => x?.messageId !== messageId)
      } else {
        updated = DatasetManager.AddToArray(existingBookmarks, newBookmark)
      }

      set(child(dbRef, `${DB.tables.chatBookmarks}/${chatId}`), updated)
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
  CreateChat: async (path, chat) => {
    const dbRef = ref(getDatabase())
    const currentChats = await DB.getTable(path)
    let toAdd
    if (Manager.IsValid(currentChats)) {
      toAdd = DatasetManager.AddToArray(currentChats, chat)
    } else {
      toAdd = [chat]
    }
    try {
      set(child(dbRef, path), toAdd).catch((error) => {
        console.log(error)
      })
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
  AddChatMessage: async (path, message) => {
    const dbRef = ref(getDatabase())
    const currentMessages = await DB.getTable(path)
    let toAdd = []
    console.log(path, message)
    if (Manager.IsValid(currentMessages)) {
      toAdd = DatasetManager.AddToArray(currentMessages, message)
    } else {
      toAdd = [message]
    }
    try {
      set(child(dbRef, path), toAdd).catch((error) => {
        console.log(error)
      })
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error)
    }
  },
}

export default ChatManager