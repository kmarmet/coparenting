import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useTransferRequests = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [transferRequests, setTransferRequests] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.transferChangeRequests}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedRequests = DatasetManager.getValidArray(snapshot.val()) || []
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.transferRequests)
        const formattedShared = DatasetManager.getValidArray(shared) || []
        if (Manager.isValid(formattedRequests) || Manager.isValid(formattedShared)) {
          setTransferRequests([...formattedRequests, ...formattedShared].filter((x) => x)?.flat())
        } else {
          setTransferRequests([])
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
    transferRequests,
    isLoading,
    error,
    queryKey,
  }
}

export default useTransferRequests