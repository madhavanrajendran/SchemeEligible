import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "/src/pages/Home";
import Schemes from "/src/pages/Schemes";
import Eligibility from "/src/pages/Eligibility";
import Result from "/src/pages/Result";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route
          path="/eligibility/:schemeId"
          element={<Eligibility />}
        />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;