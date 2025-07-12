import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'

const useAppUpdates = () => {
    const {state, setState} = useContext(globalState)
    const [appUpdates, setAppUpdates] = useState([])
    const [appUpdatesAreLoading, setAppUpdatesAreLoading] = useState(true)
    const [error, setError] = useState(null)
    const path = `${DB.tables.appUpdates}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                const valid = DatasetManager.GetValidArray(snapshot.val())
                if (Manager.IsValid(valid)) {
                    setAppUpdates(valid)
                } else {
                    setAppUpdates([])
                }
                setAppUpdatesAreLoading(false)
            },
            (err) => {
                setError(err)
                setAppUpdatesAreLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path])

    return {
        appUpdates,
        appUpdatesAreLoading,
        error,
        queryKey,
    }
}

export default useAppUpdates