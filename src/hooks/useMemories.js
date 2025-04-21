import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import globalState from '../context'
import DB from '../database/DB'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useMemories = () => {
  const {state, setState} = useContext(globalState)
  const [memories, setMemories] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const {currentUser} = useCurrentUser()
  const path = `${DB.tables.memories}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedMemories = Manager.convertToArray(snapshot.val()).flat()
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.memories)
        const formattedShared = Manager.convertToArray(shared).flat()
        if (Manager.isValid(formattedMemories) || Manager.isValid(formattedShared)) {
          setMemories([...formattedMemories, ...shared].filter((x) => x)?.flat())
        } else {
          setMemories([])
        }
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    memories,
    isLoading,
    error,
    queryKey,
  }
}

export default useMemories