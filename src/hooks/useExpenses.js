import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'
import useUsers from './useUsers'

const useExpenses = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [expenses, setExpenses] = useState(null)
  const [expensesAreLoading, setExpensesAreLoading] = useState(true)
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
        const formattedExpenses = DatasetManager.getValidArray(snapshot.val())
        let shared = await SecurityManager.getSharedItems(currentUser, DB.tables.expenses)
        shared = DatasetManager.getValidArray(shared)
        let localExpenses = []

        if (Manager.isValid(formattedExpenses)) {
          localExpenses = formattedExpenses?.flat()
        }
        if (Manager.isValid(shared)) {
          localExpenses = [...localExpenses, ...shared]?.flat()
        }
        if (Manager.isValid(localExpenses)) {
          setExpenses(localExpenses)
        } else {
          setExpenses([])
        }
        setExpensesAreLoading(false)
      },
      (err) => {
        setError(err)
        setExpensesAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    expenses,
    expensesAreLoading,
    error,
    queryKey,
  }
}

export default useExpenses