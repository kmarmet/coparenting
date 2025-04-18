import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import Manager from '../../managers/manager'
import DB from '../../database/DB'

const useChatMessages = (chatId) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [path, setPath] = useState(`${DB.tables.chatMessages}/${chatId}`)
  const queryKey = ['realtime', path]
  const [chatMessages, setChatMessages] = useState([])

  // Get current user and set path
  useEffect(() => {
    if (Manager.isValid(chatId)) {
      setPath(`${DB.tables.chatMessages}/${chatId}`)
    }
  }, [chatId])

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const messages = snapshot.val()
        if (Manager.isValid(messages)) {
          setChatMessages(messages)
        } else {
          setChatMessages([])
        }
      },
      (err) => {
        console.log(`useChatMessages Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path])

  return {
    chatMessages,
    isLoading,
    error,
    queryKey,
  }
}

export default useChatMessages