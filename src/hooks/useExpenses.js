import {getDatabase, off, onValue, ref} from "firebase/database"
import {useContext, useEffect, useState} from "react"
import globalState from "../context"
import DB from "../database/DB"
import DatasetManager from "../managers/datasetManager"
import Manager from "../managers/manager"
import SecurityManager from "../managers/securityManager"
import useCurrentUser from "./useCurrentUser"

const useExpenses = () => {
      const {state, setState} = useContext(globalState)
      const {authUser} = state
      const {currentUser} = useCurrentUser()
      const [expenses, setExpenses] = useState(null)
      const [expensesAreLoading, setExpensesAreLoading] = useState(true)
      const [error, setError] = useState(null)
      const path = `${DB.tables.expenses}/${currentUser?.key}`
      const queryKey = ["realtime", path]

      useEffect(() => {
            const database = getDatabase()
            const dataRef = ref(database, path)

            const listener = onValue(
                  dataRef,
                  async (snapshot) => {
                        const formattedExpenses = DatasetManager.GetValidArray(snapshot.val())
                        let shared = await SecurityManager.getSharedItems(currentUser, DB.tables.expenses)
                        shared = DatasetManager.GetValidArray(shared)

                        let localExpenses = []

                        if (Manager.IsValid(formattedExpenses)) {
                              localExpenses = formattedExpenses?.flat()
                        }
                        if (Manager.IsValid(shared)) {
                              localExpenses = DatasetManager.CombineArrays(localExpenses, shared)
                        }
                        if (Manager.IsValid(localExpenses)) {
                              setExpenses(DatasetManager.GetValidArray(localExpenses))
                        } else {
                              setExpenses([])
                        }
                        setExpensesAreLoading(false)
                  },
                  (err) => {
                        setError(err)
                        setExpensesAreLoading(false)
                  }
            )

            return () => {
                  off(dataRef, "value", listener)
            }
      }, [path, currentUser])

      return {
            expenses,
            expensesAreLoading,
            error,
            queryKey,
      }
}

export default useExpenses