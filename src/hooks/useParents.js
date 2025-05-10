import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useParents = () => {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {currentUser} = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [parents, setParents] = useState([])
  const [error, setError] = useState(null)
  const path = `${DB.tables.users}/${currentUser?.key}/parents`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        // console.Log('Children Updated')
        const formattedParents = DatasetManager.GetValidArray(snapshot.val())
        if (Manager.IsValid(currentUser) && Manager.IsValid(formattedParents)) {
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
  }, [path, currentUser])

  return {
    parents,
    isLoading,
    error,
    queryKey,
  }
}

export default useParents