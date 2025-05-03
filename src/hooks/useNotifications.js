import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useNotifications = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const path = `${DB.tables.notifications}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.Log('Children Updated')
        const formattedNotifications = DatasetManager.getValidArray(snapshot.val())
        if (Manager.isValid(currentUser) && Manager.isValid(formattedNotifications)) {
          setNotifications(formattedNotifications)
          setNotificationCount(formattedNotifications?.length)
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
    notificationCount,
    isLoading,
    error,
    queryKey,
  }
}

export default useNotifications