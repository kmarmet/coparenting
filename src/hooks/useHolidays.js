import {useEffect, useState} from "react"
import AlertManager from "../managers/alertManager"
import DatasetManager from "../managers/datasetManager"
import DateManager from "../managers/dateManager"
import Manager from "../managers/manager"
import ObjectManager from "../managers/objectManager"

const useHolidays = (currentUser, returnType = "none") => {
      const [holidays, setHolidays] = useState(null)
      const [holidayRetrievalError, setHolidayRetrievalError] = useState(null)
      const [holidaysAreLoading, setHolidaysAreLoading] = useState(true)

      // Fetch from API
      const FetchApiHolidays = async () => {
            const res = await DateManager.GetHolidaysAsEvents()
            return res ?? []
      }

      // Filter visitation holidays
      const FetchVisitationHolidays = async () => {
            const apiData = await FetchApiHolidays()
            if (!Manager.IsValid(apiData)) return []

            const filtered = apiData
                  .filter((x) => x?.owner?.key === currentUser?.key)
                  .map((holiday) => {
                        const cleanHoliday = ObjectManager.CleanObject(holiday)
                        cleanHoliday.title += ` (${holiday.holidayName})`
                        return cleanHoliday
                  })

            if (Manager.IsValid(filtered)) {
                  return DatasetManager.GetValidArray(filtered, true)
            } else {
                  return []
            }
      }

      useEffect(() => {
            const loadData = async () => {
                  try {
                        let data = []
                        if (returnType === "all") {
                              data = await FetchApiHolidays()
                              setHolidays(data)
                        } else if (returnType === "visitation") {
                              data = await FetchVisitationHolidays()
                              if (!Manager.IsValid(data)) {
                                    AlertManager.confirmAlert({
                                          title: "No Visitation Holidays",
                                          html: "You have not selected any visitation holidays. Go to the <b>Visitation</b> page to select them to be added to your calendar.",
                                          confirmButtonText: "Okay",
                                          bg: "#fbd872",
                                          showDenyButton: false,
                                          denyButtonText: "",
                                    })
                                    setHolidays([])
                              } else {
                                    setHolidays(data)
                              }
                        } else {
                              setHolidays([])
                        }
                  } catch (err) {
                        if (err.name !== "AbortError") {
                              setHolidayRetrievalError(err.message || "Unknown Holiday Retrieval Error")
                        }
                  } finally {
                        setHolidaysAreLoading(false)
                  }
            }

            loadData().then((r) => r)

            return () => {
                  setHolidays([])
                  setHolidayRetrievalError(null)
                  setHolidaysAreLoading(true)
            }
      }, [returnType, currentUser]) // dependencies

      return {holidays, holidayRetrievalError, holidaysAreLoading}
}

export default useHolidays