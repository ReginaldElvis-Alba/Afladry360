import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout";
import Dashboard from "./Pages/Dashboard";
import Landing from "./Pages/Landing";

const App = () => {
  return <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing/>} />
          <Route path="/dashboard" element={<Dashboard/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  </>
}

export default App;