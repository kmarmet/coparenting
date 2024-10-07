import moment from 'moment'
import Manager from '@manager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from './firebaseStorage'
import DB from '@db'

const DB_DocumentScoped = {
  getAllDocs: () =>
    new Promise(async (resolve, reject) => {
      const docs = await DB.getTable(DB.tables.documents)
      resolve(docs || [])
    }),
}

export default DB_DocumentScoped
