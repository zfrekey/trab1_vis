import "./shared/styles/style.css";
import { mountBigMacCase } from "./cases/big-mac/index.js";
import { mountRawAdjustedExplorer } from "./cases/big-mac/redesign2.js";

const app = document.getElementById("app");

const redesign1Root = document.createElement("section");
redesign1Root.className = "case-section";
app.appendChild(redesign1Root);
mountBigMacCase(redesign1Root);

const redesign2Root = document.createElement("section");
redesign2Root.className = "case-section case-section--divider";
app.appendChild(redesign2Root);
mountRawAdjustedExplorer(redesign2Root);
