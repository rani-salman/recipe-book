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

const EDITABLE_NUMERIC_FIELDS = ["calories", "protein", "fat", "sugar", "fiber", "pack_size_g", "price_sar"];

function toDraft(ing) {
  return {
    name: ing.name,
    category: ing.category,
    calories: ing.calories,
    protein: ing.protein,
    fat: ing.fat,
    sugar: ing.sugar,
    fiber: ing.fiber,
    pack_label: ing.pack_label,
    pack_size_g: ing.pack_size_g,
    price_sar: ing.price_sar,
    price_source: ing.price_source,
  };
}

export default function IngredientsPage({ ingredients, loading, onChanged }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const startEdit = (ing) => {
    setEditingId(ing.id);
    setDraft(toDraft(ing));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const updateDraft = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const saveEdit = async (ing) => {
    if (!draft.name.trim() || !draft.category.trim()) {
      alert("Name and category can't be empty.");
      return;
    }
    setSavingId(ing.id);
    const payload = { ...draft, price_source: "Manually updated", updated_at: new Date().toISOString() };
    for (const f of EDITABLE_NUMERIC_FIELDS) {
      payload[f] = Number(payload[f]);
      if (Number.isNaN(payload[f])) {
        alert(`"${f}" must be a number.`);
        setSavingId(null);
        return;
      }
    }
    const { error } = await supabase.from("ingredients").update(payload).eq("id", ing.id);
    setSavingId(null);
    if (error) {
      alert("Couldn't save changes: " + error.message);
      return;
    }
    setEditingId(null);
    setDraft(null);
    onChanged();
  };

  const deleteIngredient = async (ing) => {
    if (
      !confirm(
        `Delete "${ing.name}"? Recipes that already use it will keep their saved totals, but you won't be able to select it in new recipes, and the recipe row referencing it will fail to load unless removed first.`
      )
    )
      return;
    setDeletingId(ing.id);
    const { error } = await supabase.from("ingredients").delete().eq("id", ing.id);
    setDeletingId(null);
    if (error) {
      alert(
        "Couldn't delete: " +
        error.message +
        "\n\nThis usually means a recipe still uses this ingredient -- remove it from those recipes first."
      );
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
              <th>Pack label</th>
              <th>Pack size (g/ml)</th>
              <th>Price (SAR)</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => {
              const isEditing = editingId === ing.id;
              const isSaving = savingId === ing.id;
              const isDeleting = deletingId === ing.id;

              if (!isEditing) {
                return (
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
                    <td>{ing.pack_size_g}</td>
                    <td>{Number(ing.price_sar).toFixed(2)}</td>
                    <td>
                      <span
                        className={`source-tag ${ing.price_source === "Carrefour KSA" ? "confirmed" : "estimate"}`}
                      >
                        {ing.price_source}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost" onClick={() => startEdit(ing)}>
                        Edit
                      </button>{" "}
                      <button className="btn btn-danger" onClick={() => deleteIngredient(ing)} disabled={isDeleting}>
                        {isDeleting ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={ing.id} style={{ background: "var(--accent-soft)" }}>
                  <td className="name-cell">
                    <input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} style={{ width: 160 }} />
                  </td>
                  <td>
                    <input value={draft.category} onChange={(e) => updateDraft("category", e.target.value)} style={{ width: 110 }} />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.calories}
                      onChange={(e) => updateDraft("calories", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.protein}
                      onChange={(e) => updateDraft("protein", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.fat}
                      onChange={(e) => updateDraft("fat", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.sugar}
                      onChange={(e) => updateDraft("sugar", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.fiber}
                      onChange={(e) => updateDraft("fiber", e.target.value)}
                    />
                  </td>
                  <td>
                    <input value={draft.pack_label} onChange={(e) => updateDraft("pack_label", e.target.value)} style={{ width: 110 }} />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      value={draft.pack_size_g}
                      onChange={(e) => updateDraft("pack_size_g", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="price-input"
                      type="number"
                      step="0.01"
                      value={draft.price_sar}
                      onChange={(e) => updateDraft("price_sar", e.target.value)}
                    />
                  </td>
                  <td>
                    <span className="source-tag estimate">will become "Manually updated"</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-accent" onClick={() => saveEdit(ing)} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </button>{" "}
                    <button className="btn btn-ghost" onClick={cancelEdit} disabled={isSaving}>
                      Cancel
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <div className="empty-state">No ingredients match your search.</div>}
    </div>
  );
}
