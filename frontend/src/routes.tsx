import { Route } from "wouter"
import { Root } from './routes/+page'
import { Home } from './routes/home/+page'

function App() {
  return <>
    <Route path="/"><Root /></Route>
    <Route path="/home"><Home /></Route>
  </>
}

export default App
