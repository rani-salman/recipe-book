# Recipe Book

A personal recipe tracker: recipes grouped by meal category (Breakfast, Lunch,
Dessert, Ice Cream, Snack), each with ingredients pulled from a shared
Common Ingredients reference table. Calories, macros, and cost are
calculated automatically from the ingredient quantities you enter.

**Stack:** React + Vite (static frontend, hosted free on GitHub Pages) +
Supabase (free Postgres database + auto-generated API).

---

## 1. Create your Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project**. Pick any name and a database password (save the
   password somewhere -- you won't need it day-to-day, but keep it safe).
   Choose a region close to you.
3. Wait ~2 minutes for the project to finish provisioning.
4. In the left sidebar, open **SQL Editor** -> **New query**.
5. Paste the contents of `supabase/schema.sql` (in this project) and click
   **Run**. This creates the `ingredients`, `recipes`, and
   `recipe_ingredients` tables, the `recipe_totals` view, and opens access
   with the public API key (see the security note in that file).
6. Open a second **New query**, paste the contents of `supabase/seed.sql`,
   and click **Run**. This loads the 73 ingredients (with their nutrition
   data and Carrefour KSA prices) you already had in your spreadsheet.
7. Go to **Project Settings -> API**. You'll need two values from this
   page in the next steps:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

---

## 2. Run it locally first (recommended)

Make sure you have [Node.js](https://nodejs.org) installed (v18+), then:

```bash
cd recipe-app
npm install
cp .env.example .env.local
```

Open `.env.local` and paste in your Supabase URL and anon key from step 1.7.

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You should see
your ingredients under the "Ingredients" tab and be able to add recipes.
If the page loads but shows no ingredients, double check `.env.local` and
that you ran both SQL files in step 1.

---

## 3. Put it on GitHub

1. Create a new **public** repository on GitHub (private repos can also use
   GitHub Pages, but only on paid plans -- public is free either way).
   Name it whatever you like, e.g. `recipe-book`.
2. In `vite.config.js`, change the `REPO_NAME` constant at the top to match
   your repository's exact name.
3. Push this project to that repository:

```bash
git init
git add .
git commit -m "Initial recipe book"
git branch -M main
git remote add origin https://github.com/rani-salman/recipe-book
git push -u origin main
```

---

## 4. Turn on GitHub Pages + connect Supabase secrets

1. In your GitHub repo, go to **Settings -> Pages**. Under "Build and
   deployment", set **Source** to **GitHub Actions**.
2. Go to **Settings -> Secrets and variables -> Actions -> New repository
   secret**. Add two secrets (same values as your `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Go to the **Actions** tab and re-run the "Deploy to GitHub Pages"
   workflow (it should have already triggered from your push in step 3;
   if it failed because the secrets weren't set yet, click **Re-run all
   jobs** now that they are).
4. When it finishes (green check), your site is live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`

Every time you `git push` to `main`, the site rebuilds and redeploys
automatically.

---

## About the free tiers

- **GitHub Pages**: free and unlimited for public repos.
- **Supabase free tier**: 500 MB database, 1 GB file storage, 50,000
  monthly active users, unlimited API requests -- far more than a personal
  recipe tracker needs. The one thing to know: a free project **pauses
  after 7 days with no activity**. If you haven't opened the site in a
  while, the first load may take a few extra seconds while it wakes up,
  or you may need to click "Restore" in the Supabase dashboard.

## Security note

This app has no login screen -- it's built for one person (you) to use via
a link only you know. The database's row-level-security policies allow
anyone holding the public API key (which is embedded in the deployed
site's code, so technically visible to anyone who inspects it) to read
and write your data. That's an acceptable tradeoff for a private personal
tool. If you ever want to make this a multi-user or public-facing app,
add [Supabase Auth](https://supabase.com/docs/guides/auth) and change the
policies in `supabase/schema.sql` to check `auth.uid()`.

## Project structure

```
recipe-app/
  supabase/
    schema.sql       # tables, view, security policies -- run first
    seed.sql          # your 73 ingredients -- run second
  src/
    App.jsx            # tab navigation + top-level state
    supabaseClient.js   # Supabase connection
    components/
      RecipesPage.jsx    # recipe grid for the active meal category
      RecipeDetail.jsx   # add/edit a recipe, live macro & price totals
      IngredientsPage.jsx # browse/search/edit the shared ingredient list
  .github/workflows/deploy.yml  # auto-deploy to GitHub Pages on push
```

## Extending it

- **Add more ingredients**: use the "+ Add ingredient" button on the
  Ingredients tab, or insert rows directly in Supabase's Table Editor.
- **Update a price**: click into any price cell on the Ingredients tab and
  edit it -- it saves automatically when you click away.
- **New meal category**: add it to the `MEAL_CATEGORIES` array in
  `App.jsx` and to the `check` constraint on `recipes.meal_category` in
  `schema.sql` (re-run that `alter table` statement in the SQL editor).
