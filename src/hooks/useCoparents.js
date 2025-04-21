import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import DB from '../database/DB'
import useUsers from './useUsers'
import globalState from '../context'

const useCoparents = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [isLoading, setIsLoading] = useState(true)
  const [coparents, setCoparents] = useState([])
  const [error, setError] = useState(null)
  const dbUser = users?.find((u) => u?.email === authUser?.email)
  const path = `${DB.tables.users}/${dbUser?.key}/coparents`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.log('Children Updated')
        const formattedCoparents = Manager.convertToArray(snapshot.val()?.filter((x) => x))
        if (Manager.isValid(dbUser) && Manager.isValid(formattedCoparents)) {
          setCoparents(formattedCoparents)
          setIsLoading(false)
        } else {
          setCoparents([])
        }
      },
      (err) => {
        console.log(`useCoparents Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, dbUser])

  return {
    coparents,
    isLoading,
    error,
    queryKey,
  }
}

export default useCoparents