import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useSwapRequests = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [swapRequests, setSwapRequests] = useState(null)
  const [swapRequestsAreLoading, setSwapRequestsAreLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.swapRequests}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedRequests = DatasetManager.GetValidArray(snapshot.val())
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.swapRequests)
        const formattedShared = DatasetManager.GetValidArray(shared)
        console.log(formattedRequests, formattedShared)
        if (Manager.IsValid(formattedRequests) || Manager.IsValid(formattedShared)) {
          const combined = DatasetManager.CombineArrays(formattedRequests, formattedShared)
          setSwapRequests(DatasetManager.GetValidArray(combined))
        } else {
          setSwapRequests([])
        }
        setSwapRequestsAreLoading(false)
      },
      (err) => {
        setError(err)
        setSwapRequestsAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    swapRequests,
    swapRequestsAreLoading,
    error,
    queryKey,
  }
}

export default useSwapRequests