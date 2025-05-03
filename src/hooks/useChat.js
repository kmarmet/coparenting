import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import useUsers from './useUsers'

const useChat = (chatIdInput) => {
  const {state, setState} = useContext(globalState)
  const {messageRecipient, authUser} = state
  const {users} = useUsers()
  const [currentUser, setCurrentUser] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [path, setPath] = useState(`${DB.tables.chats}/${currentUser?.key}`)
  const queryKey = ['realtime', path]
  const [chats, setChats] = useState([])
  const [chat, setChat] = useState()

  // Get current user and set path
  useEffect(() => {
    if (Manager.isValid(users)) {
      const user = users?.find((u) => u?.email === authUser?.email)
      setPath(`${DB.tables.chats}/${user?.key}`)
      setCurrentUser(user)
    }
  }, [users])

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const chats = snapshot.val()
        setChats(chats)
        if (Manager.isValid(chats)) {
          for (let _chat of chats) {
            const memberKeys = _chat?.members?.map((x) => x?.key)
            if (Manager.isValid(memberKeys) && memberKeys.includes(messageRecipient?.key) && memberKeys.includes(currentUser?.key)) {
              setChat(_chat)
            }
          }
        } else {
          setChat(null)
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
  }, [path, currentUser, messageRecipient])

  return {
    chat,
    chats,
    isLoading,
    error,
    queryKey,
  }
}

export default useChat