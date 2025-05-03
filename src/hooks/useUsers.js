import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'

const useUsers = () => {
  const [users, setUsers] = useState(null)
  const [usersAreLoading, setUsersAreLoading] = useState(true)
  const [error, setError] = useState(null)
  const [path, setPath] = useState(DB.tables.users)

  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        if (Manager.isValid(snapshot.val())) {
          setUsers(DatasetManager.getValidArray(snapshot.val()))
        } else {
          setUsers([])
        }
        setUsersAreLoading(false)
      },
      (err) => {
        setError(err)
        setUsersAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path])

  return {
    users,
    usersAreLoading,
    error,
    queryKey,
  }
}

export default useUsers