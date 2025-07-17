import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useVisitationRequests = () => {
    const {state, setState} = useContext(globalState)
    const {currentUser} = useCurrentUser()
    const [visitationRequests, setVisitationRequests] = useState(null)
    const [visitationRequestsAreLoading, setVisitationRequestsAreLoading] = useState(true)
    const [error, setError] = useState(null)
    const path = `${DB.tables.visitationRequests}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                const formattedRequests = DatasetManager.GetValidArray(snapshot.val())
                const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.visitationRequests)
                const formattedShared = DatasetManager.GetValidArray(shared)
                console.log(formattedRequests, formattedShared)
                if (Manager.IsValid(formattedRequests) || Manager.IsValid(formattedShared)) {
                    const combined = DatasetManager.CombineArrays(formattedRequests, formattedShared)
                    setVisitationRequests(DatasetManager.GetValidArray(combined))
                } else {
                    setVisitationRequests([])
                }
                setVisitationRequestsAreLoading(false)
            },
            (err) => {
                setError(err)
                setVisitationRequestsAreLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser])

    return {
        visitationRequests,
        visitationRequestsAreLoading,
        error,
        queryKey,
    }
}

export default useVisitationRequests