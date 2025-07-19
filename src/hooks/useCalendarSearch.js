import {useMemo, useState} from "react"
import Manager from "../managers/manager"

function useCalendarSearch(calendarEvents) {
      const [query, setQuery] = useState("")

      const searchResults = useMemo(() => {
            if (!Manager.IsValid(query, true)) return []
            if (!Manager.IsValid(calendarEvents)) return []
            if (query.length > 2) {
                  return calendarEvents?.filter((x) => x?.title?.toLowerCase().includes(query?.toLowerCase()))
            }
            return []
      }, [calendarEvents, query])

      return {query, setQuery, searchResults}
}

export default useCalendarSearch