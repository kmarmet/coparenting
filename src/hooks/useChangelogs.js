import {getDatabase, off, onValue, ref} from "firebase/database"
import {useContext, useEffect, useState} from "react"
import globalState from "../context"
import DB from "../database/DB"
import DatasetManager from "../managers/datasetManager"
import Manager from "../managers/manager"

const useChangelogs = () => {
      const {state, setState} = useContext(globalState)
      const [changelogs, setChangelogs] = useState(null)
      const [changelogsAreLoading, setChangelogsAreLoading] = useState(true)
      const [error, setError] = useState(null)
      const path = `${DB.tables.changelogs}`
      const queryKey = ["realtime", path]

      useEffect(() => {
            const database = getDatabase()
            const dataRef = ref(database, path)

            const listener = onValue(
                  dataRef,
                  async (snapshot) => {
                        if (Manager.IsValid(snapshot.val())) {
                              const sorted = DatasetManager.sortByProperty(snapshot.val(), "updatedVersion", "desc")
                              setChangelogs(sorted)
                        } else {
                              setChangelogs(null)
                        }
                        setChangelogsAreLoading(false)
                  },
                  (err) => {
                        setError(err)
                        setChangelogsAreLoading(false)
                  }
            )

            return () => {
                  off(dataRef, "value", listener)
            }
      }, [path])

      return {
            changelogs,
            changelogsAreLoading,
            error,
            queryKey,
      }
}

export default useChangelogs