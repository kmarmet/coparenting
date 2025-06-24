import React from 'react'
import {FaStar} from 'react-icons/fa'
import {IoIosBug} from 'react-icons/io'
import NavBar from '../../navBar'

const Changelog = () => {
  const embedUrl = `https://docs.google.com/document/d/1_ltXsDBzFg2-NwuPlzZM9-sao0iKi77wcPJ0x6PCMVA/preview`

  return (
    <>
      <div id={'changelog-wrapper'}>
        <div className={'content'}>
          <h1>Latest Changes</h1>
          <div className={'sections'}>
            <div className={'section'}>
              <h2>Version 1.0.1</h2>
              <h3>
                <FaStar className={'star'} /> New Features
              </h3>

              <h3>
                <IoIosBug className={'bug'} />
                Bugs Squashed (fixes)
              </h3>
            </div>
            <hr className={'hr'} />
            <div className={'section'}>
              <h2>Version 1.0.0</h2>
              <h3>Initial Release</h3>
            </div>
          </div>
        </div>
      </div>
      <NavBar navbarClass={'transparent'} />
    </>
  )
}

export default Changelog