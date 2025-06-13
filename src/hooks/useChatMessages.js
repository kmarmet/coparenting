import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'

const useChatMessages = (chatId) => {
  const [chatMessagesAreLoading, setChatMessagesAreLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.chatMessages}/${chatId}`
  const queryKey = ['realtime', path]
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)
    console.log('ChatID: ', chatId)
    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const messages = snapshot.val()
        if (Manager.IsValid(messages)) {
          setChatMessages(DatasetManager.GetValidArray(messages))
        } else {
          setChatMessages([])
        }
      },
      (err) => {
        setError(err)
        setChatMessagesAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, chatId])

  return {
    chatMessages,
    chatMessagesAreLoading,
    error,
    queryKey,
  }
}

export default useChatMessages