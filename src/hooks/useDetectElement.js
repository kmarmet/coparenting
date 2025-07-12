import {useEffect} from 'react'

function useDetectElement(selector, onDomEnter = () => {}, onDomExit = () => {}) {
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector)
            if (el) {
                onDomEnter(el)
                // Stop when element is found -> would need a parameter passed in
                observer.disconnect()
            } else {
                onDomExit(el)
            }
        })

        observer.observe(document.body, {childList: true, subtree: true})

        return () => observer.disconnect()
    }, [selector, onDomEnter])
}

export default useDetectElement