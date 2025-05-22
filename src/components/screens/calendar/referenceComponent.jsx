import React, {useEffect} from 'react'

export const ReferenceComponent = () => {
  // CAPTURE CLICK EVENT FOR ALL CLICKS IN APP
  useEffect(() => {
    const handleClick = (event) => {
      console.log('Clicked element:', event.target)
      // Perform actions with the captured click event here
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  return <></>
}