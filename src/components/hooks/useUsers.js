import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import Manager from '../../managers/manager'
import DB from '../../database/DB'

const useUsers = () => {
  const [users, setUsers] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
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
          setUsers(Manager.convertToArray(snapshot.val()))
        } else {
          setUsers([])
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
  }, [path])

  return {
    users,
    isLoading,
    error,
    queryKey,
  }
}

export default useUsers