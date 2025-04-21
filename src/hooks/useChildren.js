import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import DB from '../database/DB'
import useUsers from './useUsers'
import globalState from '../context'

const useChildren = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {users} = useUsers()
  const [isLoading, setIsLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [error, setError] = useState(null)
  const dbUser = users?.find((u) => u?.email === authUser?.email)
  const path = `${DB.tables.users}/${dbUser?.key}/children`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        console.log('Children Updated')
        const formattedChildren = Manager.convertToArray(snapshot.val()?.filter((x) => x))
        if (Manager.isValid(dbUser) && Manager.isValid(formattedChildren)) {
          setChildren(formattedChildren)
          setIsLoading(false)
        } else {
          setChildren([])
        }
      },
      (err) => {
        console.log(`useChildren Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path])

  return {
    children,
    isLoading,
    error,
    queryKey,
  }
}

export default useChildren