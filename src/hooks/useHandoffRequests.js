import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useHandoffRequests = () => {
    const {state, setState} = useContext(globalState)
    const {currentUser} = useCurrentUser()
    const [handoffRequests, setHandoffChangeRequests] = useState(null)
    const [handoffRequestsAreLoading, setHandoffChangeRequestsAreLoading] = useState(true)
    const [error, setError] = useState(null)
    const path = `${DB.tables.handoffChangeRequests}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                const formattedRequests = DatasetManager.GetValidArray(snapshot.val()) || []
                const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.pickupDropOff)
                const formattedShared = DatasetManager.GetValidArray(shared) || []
                if (Manager.IsValid(formattedRequests) || Manager.IsValid(formattedShared)) {
                    const combined = DatasetManager.CombineArrays(formattedRequests, formattedShared)
                    setHandoffChangeRequests(combined)
                } else {
                    setHandoffChangeRequests([])
                }
                setHandoffChangeRequestsAreLoading(false)
            },
            (err) => {
                setError(err)
                setHandoffChangeRequestsAreLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser])

    return {
        handoffRequests,
        handoffRequestsAreLoading,
        error,
        queryKey,
    }
}

export default useHandoffRequests