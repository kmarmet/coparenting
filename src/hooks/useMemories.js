import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useMemories = () => {
  const {state, setState} = useContext(globalState)
  const [memories, setMemories] = useState(null)
  const [memoriesAreLoading, setMemoriesAreLoading] = useState(true)
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
        const formattedMemories = DatasetManager.GetValidArray(snapshot.val())
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.memories)
        const formattedShared = DatasetManager.GetValidArray(shared)
        if (Manager.IsValid(formattedMemories) || Manager.IsValid(formattedShared)) {
          const combined = DatasetManager.CombineArrays(formattedMemories, formattedShared)
          setMemories(DatasetManager.GetValidArray(combined))
        } else {
          setMemories([])
        }
        setMemoriesAreLoading(false)
      },
      (err) => {
        setError(err)
        setMemoriesAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    memories,
    memoriesAreLoading,
    error,
    queryKey,
  }
}

export default useMemories