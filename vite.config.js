import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change REPO_NAME below to match your GitHub repository name
// exactly (e.g. if your repo is github.com/you/recipe-book, use "/recipe-book/").
// This is what makes GitHub Pages find your JS/CSS assets correctly.
const REPO_NAME = "recipe-book";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? `/${REPO_NAME}/` : "/",
});
