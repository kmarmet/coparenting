import {StreamCall, StreamVideo, StreamVideoClient, useCall, useCallStateHooks} from '@stream-io/video-react-sdk'
import {useEffect} from 'react'
import Manager from './managers/manager.js'

const apiKey = 'mzwp8k4jeyqn'
const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0phaW5hX1NvbG8iLCJ1c2VyX2lkIjoiSmFpbmFfU29sbyIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiaWF0IjoxNzM4ODQyNjcyLCJleHAiOjE3Mzk0NDc0NzJ9.4CFB_byVYEPBY6_EEvzXIj4eh24_xR7vL0klnNtlVt4'
const userId = Manager.GetUid()
const callId = '1234'

const newUser = {
    id: userId,
    name: 'Lindsay',
}

const client = new StreamVideoClient({apiKey, newUser, token})
const call = client.call('default', callId)

function VideoCall() {
    const call = useCall()
    const {useCallCallingState, useParticipantCount} = useCallStateHooks()
    const callingState = useCallCallingState()
    const participantCount = useParticipantCount()

    if (callingState !== callingState.JOINED) {
        return <div>Loading...</div>
    }

    useEffect(() => {
        console.log(true)
        console.log(callingState)
    }, [])

    return (
        <div>
            Call {call?.id} has {participantCount} participants
            <Video />
        </div>
    )
}

export default function Video() {
    console.log(true)
    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <VideoCall />
                {/*<SpeakerLayout />*/}
                {/*<CallControls />*/}
            </StreamCall>
        </StreamVideo>
    )
}