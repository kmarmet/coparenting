import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'
import StringManager from '../managers/stringManager'

const useChildren = () => {
  const {currentUser} = useCurrentUser()
  const [childrenAreLoading, setChildrenAreLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [error, setError] = useState(null)
  const [childrenDropdownOptions, setChildrenDropdownOptions] = useState([])
  const path = `${DB.tables.users}/${currentUser?.key}/children`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        const formattedChildren = DatasetManager.GetValidArray(snapshot.val())
        if (Manager.IsValid(currentUser) && Manager.IsValid(formattedChildren)) {
          setChildren(formattedChildren)
          let keys = []
          for (let child of formattedChildren) {
            if (Manager.IsValid(child)) {
              keys.push({
                value: child?.id,
                label: StringManager.GetFirstNameAndLastInitial(child?.general?.name),
              })
            }
          }
          setChildrenDropdownOptions(keys)
        } else {
          setChildren([])
        }
        setChildrenAreLoading(false)
      },
      (err) => {
        setError(err)
        setChildrenAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path])

  return {
    childrenDropdownOptions,
    children,
    childrenAreLoading,
    error,
    queryKey,
  }
}

export default useChildren