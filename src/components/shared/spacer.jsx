import { useState, useCallback, useMemo, useEffect, useContext } from 'react'

export default function Spacer({ height = 15 }) {
  return <div id="spacer" style={{ margin: `${height}px 0` }}></div>
}