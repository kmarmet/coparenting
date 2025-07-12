import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useTransferRequests = () => {
    const {state, setState} = useContext(globalState)
    const {currentUser} = useCurrentUser()
    const [transferRequests, setTransferRequests] = useState(null)
    const [transferRequestsAreLoading, setTransferRequestsAreLoading] = useState(true)
    const [error, setError] = useState(null)
    const path = `${DB.tables.transferChangeRequests}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                const formattedRequests = DatasetManager.GetValidArray(snapshot.val()) || []
                const shared = await SecurityManager.getSharedItems(currentUser, DB.tables.transferRequests)
                const formattedShared = DatasetManager.GetValidArray(shared) || []
                if (Manager.IsValid(formattedRequests) || Manager.IsValid(formattedShared)) {
                    const combined = DatasetManager.CombineArrays(formattedRequests, formattedShared)
                    setTransferRequests(combined)
                } else {
                    setTransferRequests([])
                }
                setTransferRequestsAreLoading(false)
            },
            (err) => {
                setError(err)
                setTransferRequestsAreLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser])

    return {
        transferRequests,
        transferRequestsAreLoading,
        error,
        queryKey,
    }
}

export default useTransferRequests