import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import RecipesPage from "./components/RecipesPage.jsx";
import RecipeDetail from "./components/RecipeDetail.jsx";
import IngredientsPage from "./components/IngredientsPage.jsx";

const MEAL_CATEGORIES = ["Breakfast", "Lunch", "Dessert", "Ice Cream", "Snack"];
const TABS = [...MEAL_CATEGORIES, "Ingredients"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Breakfast");
  const [selectedRecipeId, setSelectedRecipeId] = useState(null); // "new" or an id or null
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const loadIngredients = useCallback(async () => {
    setLoadingIngredients(true);
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setIngredients(data || []);
    }
    setLoadingIngredients(false);
  }, []);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Recipe <span>Book</span>
          </h1>
          <div className="app-subtitle">Your recipes, macros, and cost -- all in one ledger.</div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setSelectedRecipeId(null);
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Ingredients" ? (
        <IngredientsPage
          ingredients={ingredients}
          loading={loadingIngredients}
          onChanged={loadIngredients}
        />
      ) : selectedRecipeId ? (
        <RecipeDetail
          recipeId={selectedRecipeId === "new" ? null : selectedRecipeId}
          mealCategory={activeTab}
          ingredients={ingredients}
          onBack={() => setSelectedRecipeId(null)}
        />
      ) : (
        <RecipesPage
          mealCategory={activeTab}
          onOpenRecipe={(id) => setSelectedRecipeId(id)}
          onNewRecipe={() => setSelectedRecipeId("new")}
        />
      )}
    </div>
  );
}
