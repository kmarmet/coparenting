import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import useCurrentUser from './useCurrentUser'

const useChats = () => {
  const {state, setState} = useContext(globalState)
  const {messageRecipient, authUser} = state
  const {currentUser} = useCurrentUser()
  const [chatsAreLoading, setChatsAreLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chats, setChats] = useState([])
  const path = `${DB.tables.chats}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const chats = snapshot.val()
        setChats(chats)
      },
      (err) => {
        // console.log(`useChatMessages Error: ${err}`)
        setError(err)
        setChatsAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser, messageRecipient])

  return {
    chats,
    chatsAreLoading,
    error,
    queryKey,
  }
}

export default useChats