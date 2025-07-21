import {useEffect, useState} from "react"
import AlertManager from "../managers/alertManager"
import DatasetManager from "../managers/datasetManager"
import DateManager from "../managers/dateManager"
import LogManager from "../managers/logManager"
import Manager from "../managers/manager"
import ObjectManager from "../managers/objectManager"

const useHolidays = (currentUser, returnType = "none") => {
      const [rawHolidays, setRawHolidays] = useState([]) // store all API data
      const [holidays, setHolidays] = useState([])
      const [holidayRetrievalError, setHolidayRetrievalError] = useState(null)
      const [holidaysAreLoading, setHolidaysAreLoading] = useState(true)

      // ✅ Fetch holidays from API only ONCE per user (if needed)
      useEffect(() => {
            let isMounted = true
            setHolidaysAreLoading(true)

            const fetchApiData = async () => {
                  try {
                        const data = await DateManager.GetHolidaysAsEvents()
                        if (!isMounted) return

                        setRawHolidays(data ?? [])
                  } catch (err) {
                        if (err.name !== "AbortError") {
                              setHolidayRetrievalError(err.message || "Unknown Holiday Retrieval Error")
                        }
                  } finally {
                        if (isMounted) setHolidaysAreLoading(false)
                  }
            }

            if (returnType !== "none") {
                  void fetchApiData().catch((err) => {
                        console.error("Fetching holidays error:", err)
                        if (isMounted) {
                              setHolidayRetrievalError(err.message || "Unknown Holiday Retrieval Error")
                              setHolidaysAreLoading(false)
                              LogManager.Log(`Fetching holidays error: ${err.message}`, LogManager.LogTypes.error, err.stack)
                        }
                  })
            } else {
                  // If no returnType, just reset
                  setRawHolidays([])
                  setHolidays([])
                  setHolidaysAreLoading(false)
            }

            return () => {
                  isMounted = false
            }
      }, [returnType, currentUser])

      // ✅ Filter holidays based on returnType (no extra API call)
      useEffect(() => {
            if (!Manager.IsValid(rawHolidays)) {
                  setHolidays([])
                  return
            }

            if (returnType === "all") {
                  // Just take them all
                  setHolidays(rawHolidays)
            } else if (returnType === "visitation") {
                  const filtered = rawHolidays
                        .filter((x) => x?.owner?.key === currentUser?.key)
                        .map((holiday) => {
                              const cleanHoliday = ObjectManager.CleanObject(holiday)
                              cleanHoliday.title += ` (${holiday.holidayName})`
                              return cleanHoliday
                        })

                  if (!Manager.IsValid(filtered)) {
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
                        setHolidays(DatasetManager.GetValidArray(filtered, true))
                  }
            } else {
                  // Unknown returnType → empty
                  setHolidays([])
            }
      }, [returnType, currentUser, rawHolidays])

      return {holidays, holidayRetrievalError, holidaysAreLoading}
}

export default useHolidays