import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useChildren = () => {
  const {currentUser} = useCurrentUser()
  const [childrenAreLoading, setChildrenAreLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [error, setError] = useState(null)
  const path = `${DB.tables.users}/${currentUser?.key}/children`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.Log('Children Updated')
        const formattedChildren = DatasetManager.GetValidArray(snapshot.val()?.filter((x) => x))
        if (Manager.IsValid(currentUser) && Manager.IsValid(formattedChildren)) {
          setChildren(formattedChildren)
          setChildrenAreLoading(false)
        } else {
          setChildren([])
        }
      },
      (err) => {
        console.log(`useChildren Error: ${err}`)
        setError(err)
        setChildrenAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path])

  return {
    children,
    childrenAreLoading,
    error,
    queryKey,
  }
}

export default useChildren