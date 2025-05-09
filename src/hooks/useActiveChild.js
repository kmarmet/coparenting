import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import useChildren from './useChildren'

const useActiveChild = (activeChildId) => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = state
  const {children, childrenAreLoading} = useChildren()
  const [activeChild, setActiveChild] = useState(children?.[0])
  const [activeChildIsLoading, setActiveChildIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [childIndex, setChildIndex] = useState(null)
  const path = `${DB.tables.users}/${currentUser?.key}/children/${childIndex}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        const index = DB.GetChildIndex(children, activeChildId)

        // Failure to find child
        if (!Manager.IsValid(index)) {
          setActiveChild(null)
          setActiveChildIsLoading(false)
        }

        setChildIndex(index)

        if (Manager.IsValid(currentUser) && Manager.IsValid(children) && Manager.IsValid(activeChildId)) {
          if (Manager.IsValid(snapshot.val())) {
            setActiveChild(snapshot.val())
          }
        } else {
          setActiveChild(null)
        }

        setActiveChildIsLoading(false)
      },
      (err) => {
        setError(err)
        setActiveChildIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, children, currentUser, activeChildId])

  return {
    activeChild,
    activeChildIsLoading,
    error,
    queryKey,
  }
}

export default useActiveChild