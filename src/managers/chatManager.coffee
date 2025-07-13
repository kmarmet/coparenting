# Path: src/managers/chatManager.coffee
import {child, getDatabase, ref, set} from 'firebase/database'
import DB from '../database/DB'
import Manager from '../managers/manager'
import ChatBookmark from '../models/chat/chatBookmark'
import DatasetManager from './datasetManager.coffee'
import LogManager from './logManager'
import SecurityManager from './securityManager'
import Chat from "../models/chat/chat"
import DB_UserScoped from "../database/db_userScoped"
import Apis from "../api/apis"

ChatManager =
  CreateAndInsertChat:  (sender,recipient) ->
    dbRef = ref(getDatabase())
    newChat = new Chat()
    newChat.id = Manager.GetUid()
    newChat.members = [{recipient...}, {sender...}]
    newChat.ownerKey = sender?.key
    existingChats = await DB.getTable("#{DB.tables.chats}/#{sender?.key}")
    updatedChats = DatasetManager.AddToArray(existingChats, newChat)

    try
      await set(child(dbRef, "#{DB.tables.chats}/#{recipient?.key}"), updatedChats)
      await set(child(dbRef, "#{DB.tables.chats}/#{sender?.key}"), updatedChats)

      return newChat.id
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)

  InsertChatMessage:  (chatId, message) ->
    try
      dbRef = ref(getDatabase())
      currentMessages = await DB.getTable("#{DB.tables.chatMessages}/#{chatId}")
      console.log("#{DB.tables.chatMessages}/#{chatId}", message)
      toAdd = DatasetManager.AddToArray(currentMessages, message)
      await set(child(dbRef, "#{DB.tables.chatMessages}/#{chatId}"), toAdd)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)

  GetInactiveChatKeys: (currentUser, chats = []) ->
    inactive = []
    validAccounts = await DB_UserScoped.getCoparentAccounts(currentUser)
    validAccounts = validAccounts?.filter (x) => x.accountType == 'parent'
    validAccountKeys = validAccounts?.map((x) => x?.key)
    members = chats?.map (x) => x?.members
    activeChatKeys = members?.flat()?.map (x) => x?.key
    activeChatKeys = activeChatKeys?.filter (x) => x != currentUser?.key

    if Manager.IsValid(validAccounts)
      for key in validAccountKeys
        if !activeChatKeys?.includes(key)
          inactive.push(key)

    return inactive

  GetToneAndSentiment: (message) ->
    tone = await Apis.Sapler.GetToneOrSentiment('tone', message)
    sentiment = await Apis.Sapler.GetToneOrSentiment('sentiment', message)

    if !Manager.IsValid(tone) or !Manager.IsValid(sentiment)
      return false

    warningSentiments = ['sad']
    returnTone = tone?.overall?[0]?[1]
    returnSentiment = sentiment?.overall?[0]?[1]
    icon = tone?.overall?[0]?[2]
    color = if returnSentiment is 'NEGATIVE' then 'red' else 'green'

    if returnTone in warningSentiments
      color = 'yellow'

    tone: returnTone
    sentiment: returnSentiment
    color: color
    icon: icon

  GetScopedChat:  (currentUser, messageToUserKey) ->
    try
      securedChats = await SecurityManager.getChats(currentUser)
      console.log("Secured: " , securedChats)
      chatToReturn = null
      for chat in securedChats
        memberKeys = chat.members.map (x) -> x.key
        if memberKeys.includes(currentUser.key) and memberKeys.includes(messageToUserKey)
          chatToReturn = chat
      return chatToReturn
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)

  GetMessages:  (chatId) ->
    return await DB.getTable("#{DB.tables.chatMessages}/#{chatId}")

  PauseChat:  (currentUser, coParentKey, chat) ->
    try
      isPausedFor = chat.isPausedFor

      if !Manager.IsValid(isPausedFor)
        isPausedFor = [currentUser?.key]
      else
        isPausedFor = [isPausedFor..., currentUser?.key]

      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      chat.isPausedFor = isPausedFor
      # Set chat inactive
      await DB.updateEntireRecord("#{DB.tables.chats}/#{currentUser?.key}", chat, chat.id)
      await DB.updateEntireRecord("#{DB.tables.chats}/#{coParentKey}", chat, chat.id)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)

  ResumeChat:  (currentUser, coParentKey, chat) ->
    try
      isPausedFor = chat?.isPausedFor?.filter (x) -> x isnt currentUser?.key
      isPausedFor = DatasetManager.getUniqueArray(isPausedFor, true)
      chat.isPausedFor = isPausedFor
      # Set chat inactive
      await DB.updateEntireRecord("#{DB.tables.chats}/#{currentUser?.key}", chat, chat.id)
      await DB.updateEntireRecord("#{DB.tables.chats}/#{coParentKey}", chat, chat.id)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)

  GetBookmarks:  (chatId) ->
    existingBookmarks = await DB.getTable("#{DB.tables.chatBookmarks}/#{chatId}")
    existingBookmarks = DatasetManager.GetValidArray(existingBookmarks)

    return existingBookmarks

  ToggleMessageBookmark:  (currentUser, messageToUser, messageId, chatId, existingBookmarks) ->
    try
      dbRef = ref(getDatabase())
      updated = []

      newBookmark = new ChatBookmark()
      newBookmark.ownerKey = currentUser?.key
      newBookmark.messageId = messageId
      existsAlready = existingBookmarks.find (x) -> x?.messageId is messageId
      if Manager.IsValid(existsAlready)
        updated = existingBookmarks.filter (x) -> x?.messageId isnt messageId
      else
        updated = DatasetManager.AddToArray(existingBookmarks, newBookmark)

      set(child(dbRef, "#{DB.tables.chatBookmarks}/#{chatId}"), updated)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error)



export default ChatManager