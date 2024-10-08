import React, { useState, useEffect, useContext } from 'react'
import ToggleButton from 'react-toggle-button'
import ThemeManager from '@managers/themeManager'
import globalState from '../../../context'
import DB_UserScoped from '@userScoped'
import DB from '@db'
import '@theme-toggles/react/css/Within.css'
import { Within } from '@theme-toggles/react'
export default function ThemeToggle() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [isToggled, setToggle] = useState(currentUser?.settings?.theme !== 'dark')

  const changeTheme = async (themeColor) => {
    await DB_UserScoped.updateUserRecord(currentUser.phone, `settings/theme`, themeColor).finally(() => {
      window.location.reload()
    })
  }

  return (
    <div id="theme-toggle">
      <p className={isToggled === true ? 'moon' : 'sun'}>Theme</p>
      <Within
        className={isToggled === true ? 'moon' : 'sun'}
        duration={750}
        toggled={isToggled}
        toggle={setToggle}
        onToggle={async (e) => {
          await changeTheme(e === true ? 'light' : 'dark')
          setState({ ...state, theme: e === true ? 'light' : 'dark' })
        }}
      />
    </div>
  )
}
