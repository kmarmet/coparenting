import {useCallback, useEffect, useRef, useState} from "react"

export default function useApi({
      auto = false, // auto-fetch on mount?
      retryCount = 0, // how many retries on failure
      method = "GET", // default HTTP method
      headers = {}, // default headers
      body = null, // default body,
} = {}) {
      const [apiResults, setApiResults] = useState(null)
      const [error, setError] = useState(null)
      const [apiRequestIsLoading, setApiRequestIsLoading] = useState(auto)
      const abortControllerRef = useRef(null)
      const retriesLeftRef = useRef(retryCount)

      const executeApiRequest = useCallback(
            async (url, customOptions = {}) => {
                  if (!url) throw new Error("URL is required!")

                  setApiRequestIsLoading(true)
                  setError(null)

                  // Cancel any previous request
                  if (abortControllerRef.current) {
                        abortControllerRef.current.abort()
                  }

                  const controller = new AbortController()
                  abortControllerRef.current = controller

                  const mergedOptions = {
                        method,
                        headers,
                        body,
                        signal: controller.signal,
                        ...customOptions,
                  }

                  try {
                        // Send the request
                        const res = await fetch(url, mergedOptions)

                        if (!res.ok) {
                              throw new Error(`Request failed: ${res.status} ${res.statusText}`)
                        }

                        const json = await res.json()

                        if (!controller.signal.aborted) {
                              setApiResults(json)
                              setError(null)
                        }

                        return json
                  } catch (err) {
                        if (controller.signal.aborted) return // ignore aborts

                        if (retriesLeftRef.current > 0) {
                              retriesLeftRef.current -= 1
                              console.warn(`Retrying API call... attempts left: ${retriesLeftRef.current}`)
                              // retry
                              return executeApiRequest(url, customOptions)
                        }

                        setError(err)
                        setApiResults(null)
                        throw err
                  } finally {
                        if (!controller.signal.aborted) {
                              setApiRequestIsLoading(false)
                        }
                  }
            },
            [method, headers, body]
      )

      // Cleanup on unmount
      useEffect(() => {
            return () => {
                  if (abortControllerRef.current) {
                        abortControllerRef.current.abort()
                  }
            }
      }, [])

      return {apiResults, error, apiRequestIsLoading, executeApiRequest}
}