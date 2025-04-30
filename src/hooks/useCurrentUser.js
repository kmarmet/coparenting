import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import useUsers from './useUsers'

const useCurrentUser = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserIsLoading, setCurrentUserIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const dbUser = users?.find((u) => u?.email === authUser?.email)
  const path = `${DB.tables.users}/${dbUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        if (Manager.isValid(snapshot.val())) {
          setCurrentUser(snapshot.val())
        } else {
          setCurrentUser(null)
        }
        setCurrentUserIsLoading(false)
      },
      (err) => {
        setError(err)
        setCurrentUserIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, authUser])

  return {
    currentUser,
    currentUserIsLoading,
    error,
    queryKey,
  }
}

export default useCurrentUser