import { createBrowserRouter } from "react-router";
import App from "../App";
import TerraEarthGame from "../sections/TerraEarthGame";
import { element } from "three/tsl";
import Book from "../sections/Book";
import About from "../sections/About/About";
import Contact from "../sections/About/Contact";
import AboutUs from "../sections/About/AboutUs";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />
    },
    {
        path: '/terra-game',
        element: <TerraEarthGame />
    },
    {
        path: '/about',
        element: <AboutUs />
    },
    // {
    //     path:'/contact',
    //     element:<Contact/>
    // }
])