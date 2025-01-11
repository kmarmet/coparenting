import DB from 'database/DB'

const DB_DocumentScoped = {
  getAllDocs: () =>
    new Promise(async (resolve, reject) => {
      const docs = await DB.getTable(DB.tables.documents)
      resolve(docs || [])
    }),
}

export default DB_DocumentScoped
