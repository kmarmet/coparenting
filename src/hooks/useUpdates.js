import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useUpdates = () => {
    const {state, setState} = useContext(globalState)
    const {currentUser} = useCurrentUser()
    const [isLoading, setIsLoading] = useState(true)
    const [updates, setUpdates] = useState([])
    const [error, setError] = useState(null)
    const path = `${DB.tables.updates}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    const ClearAppBadge = () => {
        if (window.navigator.clearAppBadge && typeof window.navigator.clearAppBadge === 'function') {
            window.navigator.clearAppBadge().then((r) => r)
        }
    }

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            (snapshot) => {
                // console.Log('Children Updated')
                const formattedNotifications = DatasetManager.GetValidArray(snapshot.val())
                if (Manager.IsValid(currentUser) && Manager.IsValid(formattedNotifications)) {
                    setUpdates(formattedNotifications)
                    setIsLoading(false)
                } else {
                    ClearAppBadge()

                    setUpdates([])
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
        updates,
        isLoading,
        error,
        queryKey,
    }
}

export default useUpdates