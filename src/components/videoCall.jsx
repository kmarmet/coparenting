import { StreamCall, StreamVideo, StreamVideoClient, generateUserToken } from '@stream-io/video-react-sdk'
import { useCallStateHooks, ParticipantView } from '@stream-io/video-react-sdk'

// const userId = 'Kevin'
// // const client = new StreamVideoClient({ process.env.REACT_STREAM_VIDEO_API_KEY, user, token })
// // const token = client.generateUserToken({ user_id: userId });
// const user = { id: userId }
// const call = client.call('default', 'my-first-call')
// call.join({ create: true })
//
// export default function VideoCall() {
//   const { useParticipants } = useCallStateHooks();
//   const participants = useParticipants();
//   return (
//     <StreamVideo client={client}>
//       <StreamCall call={call}>
//         <>
//           {participants.map((p) => (
//             <ParticipantView participant={p} key={p.sessionId} />
//           ))}
//         </>
//       </StreamCall>
//     </StreamVideo>
//   )
// }