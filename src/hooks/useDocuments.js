import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import Manager from '../managers/manager'
import DB from '../database/DB'
import useCurrentUser from './useCurrentUser'

const useDocuments = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState(null)
  const {currentUser} = useCurrentUser()
  const path = `${DB.tables.documents}/${currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      (snapshot) => {
        const data = snapshot.val()

        const formatted = Manager.convertToArray(data)
        if (Manager.isValid(currentUser) && Manager.isValid(formatted)) {
          setDocuments(formatted.filter((x) => x))
          setIsLoading(false)
        } else {
          setDocuments([])
        }
      },
      (err) => {
        console.log(`useDocuments Error: ${err}`)
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    documents,
    isLoading,
    error,
    queryKey,
  }
}

export default useDocuments