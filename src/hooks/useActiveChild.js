import {getDatabase, off, onValue, ref} from "firebase/database"
import {useContext, useEffect, useState} from "react"
import globalState from "../context"
import DB from "../database/DB"
import Manager from "../managers/manager"
import useChildren from "./useChildren"

const useActiveChild = (activeChildId) => {
    const {state, setState} = useContext(globalState)
    const {currentUser} = state
    const {children, childrenAreLoading} = useChildren()
    const [activeChild, setActiveChild] = useState(children?.[0])
    const [activeChildIsLoading, setActiveChildIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeChildIndex, setActiveChildIndex] = useState(null)
    const path = `${DB.tables.users}/${currentUser?.key}/children/${activeChildIndex}`
    const queryKey = ["realtime", path]

    useEffect(() => {
        const index = DB.GetChildIndex(children, activeChildId)

        // Failure to find child
        if (!Manager.IsValid(index)) {
            setActiveChild(null)
            setActiveChildIsLoading(false)
        }

        setActiveChildIndex(index)
    }, [activeChild])

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)
        const listener = onValue(
            dataRef,
            (snapshot) => {
                if (!Manager.IsValid(activeChildId) || !Manager.IsValid(children)) {
                    setActiveChild(null)
                    setActiveChildIsLoading(false)
                }
                if (!Manager.IsValid(activeChildId) && Manager.IsValid(children)) {
                    setActiveChild(children?.[0])
                    setActiveChildIsLoading(false)
                }
                const child = children?.[activeChildIndex]
                if (Manager.IsValid(child)) {
                    setActiveChild(child)
                } else {
                    setActiveChild(null)
                }

                setActiveChildIsLoading(false)
            },
            (err) => {
                setError(err)
                setActiveChildIsLoading(false)
            }
        )

        return () => {
            off(dataRef, "value", listener)
        }
    }, [path, children, currentUser, activeChildId])

    return {
        activeChildIndex,
        activeChild,
        activeChildIsLoading,
        error,
        queryKey,
    }
}

export default useActiveChild