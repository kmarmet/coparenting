import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import DB from '../database/DB'
import globalState from '../context'
import useCurrentUser from './useCurrentUser'

const useNotifications = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState(null)
  const path = `${DB.tables.notifications}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.log('Children Updated')
        const formattedNotifications = Manager.convertToArray(snapshot.val()?.filter((x) => x))
        if (Manager.isValid(currentUser) && Manager.isValid(formattedNotifications)) {
          setNotifications(formattedNotifications)
          setIsLoading(false)
        } else {
          setNotifications([])
        }
      },
      (err) => {
        console.log(`useNotifications Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    notifications,
    isLoading,
    error,
    queryKey,
  }
}

export default useNotifications