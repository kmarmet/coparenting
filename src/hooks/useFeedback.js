import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import useCurrentUser from './useCurrentUser'

const useFeedback = () => {
    const {state, setState} = useContext(globalState)
    const {authUser} = state
    const [feedback, setFeedback] = useState(null)
    const [feedbackIsLoading, setFeedbackIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const {currentUser} = useCurrentUser()
    const path = `${DB.tables.feedbackEmotionsTracker}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                if (Manager.IsValid(snapshot.val())) {
                    setFeedback(snapshot.val())
                } else {
                    setFeedback(null)
                }
                setFeedbackIsLoading(false)
            },
            (err) => {
                setError(err)
                setFeedbackIsLoading(false)
            }
        )

        return () => {
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser])

    return {
        feedback,
        feedbackIsLoading,
        error,
        queryKey,
    }
}

export default useFeedback