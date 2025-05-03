import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useDocuments = () => {
  const [documentsAreLoading, setDocumentsAreLoading] = useState(true)
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

        const formatted = DatasetManager.getValidArray(data)
        if (Manager.isValid(currentUser) && Manager.isValid(formatted)) {
          setDocuments(formatted.filter((x) => x))
          setDocumentsAreLoading(false)
        } else {
          setDocuments([])
        }
      },
      (err) => {
        console.log(`useDocuments Error: ${err}`)
        setError(err)
        setDocumentsAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    documents,
    documentsAreLoading,
    error,
    queryKey,
  }
}

export default useDocuments