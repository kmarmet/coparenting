import React from 'react'

export default function Spacer({height = 15}) {
    return <div className="spacer" style={{margin: `${height}px 0`}}></div>
}