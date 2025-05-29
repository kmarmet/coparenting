import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useCoparents = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {currentUser} = useCurrentUser()
  const [coparentsAreLoading, setCoparentsAreLoading] = useState(true)
  const [coparents, setCoparents] = useState([])
  const [error, setError] = useState(null)
  const path = `${DB.tables.users}/${currentUser?.key}/coparents`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.Log('Children Updated')
        const formattedCoparents = DatasetManager.GetValidArray(snapshot.val())
        if (Manager.IsValid(currentUser) && Manager.IsValid(formattedCoparents)) {
          setCoparents(formattedCoparents)
        } else {
          setCoparents([])
        }
        setCoparentsAreLoading(false)
      },
      (err) => {
        setError(err)
        setCoparentsAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    coparents,
    coparentsAreLoading,
    error,
    queryKey,
  }
}

export default useCoparents