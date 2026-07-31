import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

let tempIdCounter = 0;
const newTempId = () => `temp-${++tempIdCounter}`;

export default function RecipeDetail({ recipeId, mealCategory, ingredients, onBack }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([]); // { rowId, ingredient_id, quantity_g }
  const [loading, setLoading] = useState(!!recipeId);
  const [saving, setSaving] = useState(false);

  const ingredientsById = useMemo(() => {
    const map = {};
    for (const ing of ingredients) map[ing.id] = ing;
    return map;
  }, [ingredients]);

  useEffect(() => {
    if (!recipeId) return;
    (async () => {
      setLoading(true);
      const { data: recipe, error: recipeErr } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();
      const { data: ris, error: riErr } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeId);

      if (recipeErr) console.error(recipeErr);
      if (riErr) console.error(riErr);

      if (recipe) {
        setName(recipe.name);
        setRating(recipe.rating || 0);
        setNotes(recipe.notes || "");
      }
      setRows(
        (ris || []).map((ri) => ({
          rowId: ri.id,
          ingredient_id: ri.ingredient_id,
          quantity_g: ri.quantity_g,
        }))
      );
      setLoading(false);
    })();
  }, [recipeId]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { rowId: newTempId(), ingredient_id: ingredients[0]?.id || "", quantity_g: 100 },
    ]);
  };

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  };

  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const ing = ingredientsById[row.ingredient_id];
        const qty = Number(row.quantity_g) || 0;
        if (!ing) return acc;
        const factor = qty / 100;
        const pricePer100g = ing.price_sar / ing.pack_size_g * 100;
        return {
          calories: acc.calories + ing.calories * factor,
          protein: acc.protein + ing.protein * factor,
          fat: acc.fat + ing.fat * factor,
          sugar: acc.sugar + ing.sugar * factor,
          fiber: acc.fiber + ing.fiber * factor,
          price: acc.price + (pricePer100g * factor),
        };
      },
      { calories: 0, protein: 0, fat: 0, sugar: 0, fiber: 0, price: 0 }
    );
  }, [rows, ingredientsById]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Give the recipe a name first.");
      return;
    }
    setSaving(true);
    try {
      let currentId = recipeId;

      if (currentId) {
        const { error } = await supabase
          .from("recipes")
          .update({ name, meal_category: mealCategory, rating: rating || null, notes })
          .eq("id", currentId);
        if (error) throw error;

        // Simplest sync strategy for a personal-scale app: wipe and re-insert.
        const { error: delErr } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("recipe_id", currentId);
        if (delErr) throw delErr;
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert({ name, meal_category: mealCategory, rating: rating || null, notes })
          .select()
          .single();
        if (error) throw error;
        currentId = data.id;
      }

      const validRows = rows.filter((r) => r.ingredient_id && Number(r.quantity_g) > 0);
      if (validRows.length > 0) {
        const { error: insErr } = await supabase.from("recipe_ingredients").insert(
          validRows.map((r) => ({
            recipe_id: currentId,
            ingredient_id: r.ingredient_id,
            quantity_g: Number(r.quantity_g),
          }))
        );
        if (insErr) throw insErr;
      }

      onBack();
    } catch (err) {
      console.error(err);
      alert("Couldn't save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) {
      alert("Couldn't delete: " + error.message);
      return;
    }
    onBack();
  };

  if (loading) return <div className="loading-state">Loading recipe...</div>;

  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="detail-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          {recipeId && (
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save recipe"}
          </button>
        </div>
      </div>

      <div className="field">
        <label>Recipe name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. ${mealCategory} bowl`} />
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            <option value={0}>Unrated</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cooking notes, tips..." />
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th style={{ width: "45%" }}>Ingredient</th>
            <th>Quantity (g)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowId}>
              <td className="name-cell">
                <select
                  value={row.ingredient_id}
                  onChange={(e) => updateRow(row.rowId, { ingredient_id: e.target.value })}
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className="qty-input"
                  type="number"
                  min="0"
                  value={row.quantity_g}
                  onChange={(e) => updateRow(row.rowId, { quantity_g: e.target.value })}
                />
              </td>
              <td>
                <button className="btn btn-ghost" onClick={() => removeRow(row.rowId)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={addRow}>
          + Add ingredient
        </button>
      </div>

      <div className="totals-strip">
        <div className="item">
          <span className="label">Calories</span>
          <span className="value">{Math.round(totals.calories)} kcal</span>
        </div>
        <div className="item">
          <span className="label">Protein</span>
          <span className="value">{totals.protein.toFixed(1)} g</span>
        </div>
        <div className="item">
          <span className="label">Fat</span>
          <span className="value">{totals.fat.toFixed(1)} g</span>
        </div>
        <div className="item">
          <span className="label">Sugar</span>
          <span className="value">{totals.sugar.toFixed(1)} g</span>
        </div>
        <div className="item">
          <span className="label">Fiber</span>
          <span className="value">{totals.fiber.toFixed(1)} g</span>
        </div>
        <div className="item price">
          <span className="label">Total cost</span>
          <span className="value">{totals.price.toFixed(2)} SAR</span>
        </div>
      </div>
    </div>
  );
}
