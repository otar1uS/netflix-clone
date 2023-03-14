import { useEffect, useState } from "react";
import logo from "./images/netflix-logo.png";
import avatar from "./images/netflix-avatar.png";
import "./Nav.css";
import { useNavigate } from "react-router-dom";

const Nav = () => {
  const [show, handleShow] = useState(false);
  const navigate = useNavigate();

  const transitionNavBar = () => {
    if (window.scrollY > 100) {
      handleShow(true);
    } else {
      handleShow(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", transitionNavBar);
    return () => window.removeEventListener("scroll", transitionNavBar);
  }, []);

  return (
    <div className={`nav ${show && "nav__black"}`}>
      <div className="nav__contents">
        <img
          onClick={() => navigate("/")}
          className="nav__logo"
          src={logo}
          alt="netflix logo"
        />
        <img
          className="nav__avatar"
          src={avatar}
          alt="netflix avatar"
          onClick={() => navigate("/profile")}
        />
      </div>
    </div>
  );
};

export default Nav;
