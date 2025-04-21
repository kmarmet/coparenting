import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import DB from '../database/DB'
import useUsers from './useUsers'
import globalState from '../context'

const useParents = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [isLoading, setIsLoading] = useState(true)
  const [parents, setParents] = useState([])
  const [error, setError] = useState(null)
  const dbUser = users?.find((u) => u?.email === authUser?.email)
  const path = `${DB.tables.users}/${dbUser?.key}/parents`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.log('Children Updated')
        const formattedParents = Manager.convertToArray(snapshot.val()?.filter((x) => x))
        if (Manager.isValid(dbUser) && Manager.isValid(formattedParents)) {
          setParents(formattedParents)
          setIsLoading(false)
        } else {
          setParents([])
        }
      },
      (err) => {
        console.log(`useParents Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, dbUser])

  return {
    parents,
    isLoading,
    error,
    queryKey,
  }
}

export default useParents