import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'

import useCurrentUser from './useCurrentUser'

const useSharedChildInfo = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [sharedChildInfo, setSharedChildInfo] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.sharedChildInfo}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formatted = DatasetManager.GetValidArray(snapshot.val())
        if (Manager.IsValid(formatted)) {
          setSharedChildInfo(formatted)
        } else {
          setSharedChildInfo([])
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
    sharedChildInfo,
    isLoading,
    error,
    queryKey,
  }
}

export default useSharedChildInfo