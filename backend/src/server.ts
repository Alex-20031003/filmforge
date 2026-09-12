import { app } from './app.js'

const PORT = 4200

app.listen(PORT, () => {
  console.log(`Server working on port:${PORT}`)
})