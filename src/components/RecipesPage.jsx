import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

function Stars({ rating }) {
  if (!rating) return <span className="stars">unrated</span>;
  return <span className="stars">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

export default function RecipesPage({ mealCategory, onOpenRecipe, onNewRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipe_totals")
      .select("*")
      .eq("meal_category", mealCategory)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setRecipes(data || []);
    setLoading(false);
  }, [mealCategory]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="loading-state">Loading {mealCategory.toLowerCase()} recipes...</div>;

  return (
    <div>
      <div className="recipe-grid">
        {recipes.map((r) => (
          <div key={r.recipe_id} className="card recipe-card" onClick={() => onOpenRecipe(r.recipe_id)}>
            <h3>{r.name}</h3>
            <Stars rating={r.rating} />
            <div className="meta-row">
              <span>{Math.round(r.total_calories)} kcal</span>
              <span className="price-tag">{r.total_price_sar.toFixed(2)} SAR</span>
            </div>
          </div>
        ))}
        <button className="card new-recipe-card" onClick={onNewRecipe}>
          + New {mealCategory.toLowerCase()} recipe
        </button>
      </div>

      {recipes.length === 0 && (
        <div className="empty-state">
          No {mealCategory.toLowerCase()} recipes yet. Add your first one above.
        </div>
      )}
    </div>
  );
}
