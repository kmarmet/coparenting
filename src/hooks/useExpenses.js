import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import globalState from '../context'
import DB from '../database/DB'
import useUsers from './useUsers'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useExpenses = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [expenses, setExpenses] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const dbUser = users?.find((u) => u?.email === authUser?.email)
  const path = `${DB.tables.expenses}/${dbUser?.key}`
  const queryKey = ['realtime', path]
  const {currentUser} = useCurrentUser()

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedExpenses = Manager.convertToArray(snapshot.val()).flat()
        const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.expenses)
        const formattedShared = Manager.convertToArray(shared).flat()
        if (Manager.isValid(formattedExpenses) || Manager.isValid(formattedShared)) {
          setExpenses([...formattedExpenses, ...formattedShared].filter((x) => x)?.flat())
        } else {
          setExpenses([])
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
    expenses,
    isLoading,
    error,
    queryKey,
  }
}

export default useExpenses