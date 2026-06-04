import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Results } from "./components/Results";
import { Login } from "./components/Login";
import { DutchPay } from "./components/DutchPay";
import { SavedTrips } from "./components/SavedTrips";
import TravelMap from "./components/TravelMap";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "results", Component: Results },
      { path: "login", Component: Login },
      { path: "dutch-pay", Component: DutchPay },
      { path: "saved-trips", Component: SavedTrips },
      { path: "travel-map", Component: TravelMap },
    ],
  },
]);