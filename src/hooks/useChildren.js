import {getDatabase, off, onValue, ref} from "firebase/database"
import {useEffect, useState} from "react"
import DB from "../database/DB"
import DB_UserScoped from "../database/db_userScoped"
import DatasetManager from "../managers/datasetManager"
import Manager from "../managers/manager"
import useCurrentUser from "./useCurrentUser"

const useChildren = () => {
    const {currentUser} = useCurrentUser()
    const [childrenAreLoading, setChildrenAreLoading] = useState(true)
    const [children, setChildren] = useState([])
    const [error, setError] = useState(null)
    const [childrenDropdownOptions, setChildrenDropdownOptions] = useState([])
    const path = `${DB.tables.users}/${currentUser?.key}/children`
    const queryKey = ["realtime", path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            (snapshot) => {
                const formattedChildren = DatasetManager.GetValidArray(snapshot.val())
                if (Manager.IsValid(currentUser) && Manager.IsValid(formattedChildren)) {
                    setChildren(formattedChildren)
                    let options = []
                    for (let child of formattedChildren) {
                        if (Manager.IsValid(child)) {
                            options.push({
                                value: child?.id,
                                label: DB_UserScoped.GetChildName(formattedChildren, child?.id, true),
                            })
                        }
                    }
                    setChildrenDropdownOptions(options)
                } else {
                    setChildren([])
                }
                setChildrenAreLoading(false)
            },
            (err) => {
                setError(err)
                setChildrenAreLoading(false)
            }
        )

        return () => {
            off(dataRef, "value", listener)
        }
    }, [path])

    return {
        childrenDropdownOptions,
        children,
        childrenAreLoading,
        error,
        queryKey,
    }
}

export default useChildren