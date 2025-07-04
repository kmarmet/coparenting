import {useEffect} from 'react'

function useDetectElement(selector, callback) {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        callback(el)
        // Stop when element is found -> would need a parameter passed in
        // observer.disconnect()
      }
    })

    observer.observe(document.body, {childList: true, subtree: true})

    return () => observer.disconnect()
  }, [selector, callback])
}

export default useDetectElement