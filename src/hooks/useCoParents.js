import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useCoParents = () => {
    const {state, setState} = useContext(globalState)
    const {authUser} = state
    const {currentUser} = useCurrentUser()
    const [coParentsAreLoading, setCoParentsAreLoading] = useState(true)
    const [coParents, setCoParents] = useState([])
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
                const formattedCoParents = DatasetManager.GetValidArray(snapshot.val())
                if (Manager.IsValid(currentUser) && Manager.IsValid(formattedCoParents)) {
                    setCoParents(formattedCoParents)
                } else {
                    setCoParents([])
                }
                setCoParentsAreLoading(false)
            },
            (err) => {
                setError(err)
                setCoParentsAreLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser])

    return {
        coParents,
        coParentsAreLoading,
        error,
        queryKey,
    }
}

export default useCoParents