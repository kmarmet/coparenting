import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import globalState from '../context'
import DB from '../database/DB'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useSwapRequests = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [swapRequests, setSwapRequests] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.swapRequests}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedRequests = Manager.convertToArray(snapshot.val()).flat()
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.swapRequests)
        const formattedShared = Manager.convertToArray(shared).flat()
        if (Manager.isValid(formattedRequests) || Manager.isValid(formattedShared)) {
          setSwapRequests([...formattedRequests, ...formattedShared].filter((x) => x)?.flat())
        } else {
          setSwapRequests([])
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
    swapRequests,
    isLoading,
    error,
    queryKey,
  }
}

export default useSwapRequests