import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useChat = () => {
  const {state, setState} = useContext(globalState)
  const {messageRecipient, authUser} = state
  const {currentUser} = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chats, setChats] = useState([])
  const [chat, setChat] = useState()
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
        if (Manager.IsValid(chats) && Manager.IsValid(currentUser) && Manager.IsValid(messageRecipient)) {
          for (let _chat of chats) {
            const memberKeys = _chat?.members?.map((x) => x?.key)
            if (Manager.IsValid(memberKeys) && memberKeys.includes(messageRecipient?.key) && memberKeys.includes(currentUser?.key)) {
              setChat(_chat)
              break
            }
          }
        } else {
          setChat(null)
        }
      },
      (err) => {
        // console.log(`useChatMessages Error: ${err}`)
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