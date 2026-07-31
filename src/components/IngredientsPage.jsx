import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const BLANK_FORM = {
  name: "",
  category: "Vegetables",
  calories: 0,
  protein: 0,
  fat: 0,
  sugar: 0,
  fiber: 0,
  pack_label: "1 kg",
  pack_size_g: 1000,
  price_sar: 0,
  price_source: "Market estimate",
};

export default function IngredientsPage({ ingredients, loading, onChanged }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingPrice, setEditingPrice] = useState({}); // { [id]: value }
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const categories = useMemo(() => {
    const set = new Set(ingredients.map((i) => i.category));
    return ["All", ...Array.from(set).sort()];
  }, [ingredients]);

  const filtered = useMemo(() => {
    return ingredients.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, search, categoryFilter]);

  const commitPrice = async (ing) => {
    const raw = editingPrice[ing.id];
    if (raw === undefined) return;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    if (value === ing.price_sar) return;

    const { error } = await supabase
      .from("ingredients")
      .update({ price_sar: value, price_source: "Manually updated", updated_at: new Date().toISOString() })
      .eq("id", ing.id);
    if (error) {
      alert("Couldn't update price: " + error.message);
      return;
    }
    onChanged();
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("ingredients").insert({
      ...form,
      calories: Number(form.calories),
      protein: Number(form.protein),
      fat: Number(form.fat),
      sugar: Number(form.sugar),
      fiber: Number(form.fiber),
      pack_size_g: Number(form.pack_size_g),
      price_sar: Number(form.price_sar),
    });
    if (error) {
      alert("Couldn't add ingredient: " + error.message);
      return;
    }
    setForm(BLANK_FORM);
    setShowAddForm(false);
    onChanged();
  };

  if (loading) return <div className="loading-state">Loading ingredients...</div>;

  return (
    <div>
      <div className="ingredients-toolbar">
        <input
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn-accent" onClick={() => setShowAddForm((s) => !s)}>
          {showAddForm ? "Cancel" : "+ Add ingredient"}
        </button>
      </div>

      {showAddForm && (
        <form className="card" style={{ padding: 18, marginBottom: 16 }} onSubmit={handleAddIngredient}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label>Calories /100g</label>
              <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
            </div>
            <div className="field">
              <label>Protein /100g</label>
              <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
            </div>
            <div className="field">
              <label>Fat /100g</label>
              <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
            </div>
            <div className="field">
              <label>Sugar /100g</label>
              <input type="number" value={form.sugar} onChange={(e) => setForm({ ...form, sugar: e.target.value })} />
            </div>
            <div className="field">
              <label>Fiber /100g</label>
              <input type="number" value={form.fiber} onChange={(e) => setForm({ ...form, fiber: e.target.value })} />
            </div>
            <div className="field">
              <label>Pack label</label>
              <input value={form.pack_label} onChange={(e) => setForm({ ...form, pack_label: e.target.value })} />
            </div>
            <div className="field">
              <label>Pack size (g/ml)</label>
              <input type="number" value={form.pack_size_g} onChange={(e) => setForm({ ...form, pack_size_g: e.target.value })} />
            </div>
            <div className="field">
              <label>Pack price (SAR)</label>
              <input type="number" value={form.price_sar} onChange={(e) => setForm({ ...form, price_sar: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 6 }}>
            Save ingredient
          </button>
        </form>
      )}

      <div className="ing-table-wrap">
        <table className="ing-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Category</th>
              <th>Kcal</th>
              <th>Protein</th>
              <th>Fat</th>
              <th>Sugar</th>
              <th>Fiber</th>
              <th>Pack</th>
              <th>Price (SAR)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => (
              <tr key={ing.id}>
                <td className="name-cell">{ing.name}</td>
                <td>
                  <span className="badge">{ing.category}</span>
                </td>
                <td>{ing.calories}</td>
                <td>{ing.protein}</td>
                <td>{ing.fat}</td>
                <td>{ing.sugar}</td>
                <td>{ing.fiber}</td>
                <td>{ing.pack_label}</td>
                <td>
                  <input
                    className="price-input"
                    type="number"
                    step="0.01"
                    defaultValue={ing.price_sar}
                    onChange={(e) => setEditingPrice((p) => ({ ...p, [ing.id]: e.target.value }))}
                    onBlur={() => commitPrice(ing)}
                  />
                </td>
                <td>
                  <span
                    className={`source-tag ${ing.price_source === "Carrefour KSA" ? "confirmed" : "estimate"}`}
                  >
                    {ing.price_source}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <div className="empty-state">No ingredients match your search.</div>}
    </div>
  );
}
