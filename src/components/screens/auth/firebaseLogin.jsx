import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'

export default function FirebaseLogin() {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  function signIn() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in successfully
        const user = userCredential.user
        console.log('Signed in as:', user.email)
      })
      .catch((error) => {
        console.error('Sign in error:', error.message)
      })
  }

  function signUp() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up successfully
        const user = userCredential.user
        console.log('Signed up as:', user.email)
      })
      .catch((error) => {
        console.error('Sign up error:', error.message)
      })
  }

  return (
    <div style={{ flexWrap: 'wrap' }} className="flex">
      <input id="email" type="email" />
      <input type="text" id="password" />
      <button className="w-100" onClick={() => signIn()}>
        Login
      </button>
      <button className="w-100" onClick={() => signUp()}>
        Register
      </button>
    </div>
  )
}
