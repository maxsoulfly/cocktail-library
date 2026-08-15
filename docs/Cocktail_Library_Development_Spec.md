# Cocktail Library Web App — Development Specification

## 1. Document status

- Product stage: planned MVP
- Primary use: personal and invite-only use
- Client: responsive mobile-first web application
- Frontend: React + Vite + JavaScript
- Backend: Supabase (PostgreSQL, Auth, Data API, Row Level Security, Edge Functions where required)
- Images: not required
- AI integration: none

The working product name **Cocktail Library** is a placeholder and can be changed without affecting the product model.

## 2. Product vision

Cocktail Library is a private, mobile-first bar and cocktail manager. It remembers which ingredients each user owns and answers four practical questions:

1. What can I make perfectly right now?
2. What can I make well enough without a garnish or optional ingredient?
3. Which cocktails am I only one ingredient away from making?
4. Which useful, common ingredient should I buy next?

The experience should be fast enough to use while standing beside a home bar. It should feel like a neon cocktail bar—playful and atmospheric—but remain readable and practical in both dark and light themes.

## 3. Product goals

- Maintain a shared catalog of classic cocktails and universal ingredients/products.
- Give each user a private inventory of owned ingredients and bottles.
- Match generic recipe requirements to specific owned products.
- Support required, optional, and garnish ingredients.
- Support both ingredient substitutions and linked recipe variations.
- Let users create private recipes and deliberately publish them to the registered community.
- Let the administrator unpublish a community recipe without deleting its owner's private copy.
- Recommend useful purchases without promoting obscure bottles merely because they unlock a niche recipe.
- Support safe, validated batch imports generated outside the app.
- Keep the backend reusable by a future native mobile client.

## 4. Roles and permissions

| Capability | Administrator | Invited member |
| --- | --- | --- |
| View shared recipes | Yes | Yes |
| Manage own inventory | Yes | Yes |
| Create private recipes | Yes | Yes |
| Edit own private recipes | Yes | Yes |
| Publish own recipe to shared library | Yes | Yes |
| Unpublish own recipe | Yes | Yes |
| Unpublish another user's shared recipe | Yes | No |
| Edit another user's recipe | No by default | No |
| Manage classic shared recipes | Yes | No |
| Manage ingredient types and taxonomies | Yes | No |
| Add a product mapped to an existing type | Yes | Yes |
| Generate invitation links | Yes | No |
| Use batch import for shared data | Yes | No |

Unpublishing a user's recipe changes its visibility back to private. It must not delete the recipe or remove it from its owner's account.

## 5. Access and authentication

- The application is invite-only.
- The administrator generates an expiring, single-use invitation URL.
- An invited person follows the URL and creates an account using either:
  - email and password; or
  - Google login.
- Authentication alone does not grant application access. A valid application membership created by redeeming an invitation is required.
- An authenticated user without membership sees no application data.
- Invitations record creator, creation time, expiry, redemption time, and redeemed user.
- The administrator can revoke an unused invitation.

Recommended implementation: Supabase Auth plus an application membership table protected by Row Level Security. Invitation creation and redemption should run in protected backend logic. Never expose an admin/service key in the browser.

## 6. Core navigation

Recommended mobile navigation:

1. **Home**
2. **Cocktails**
3. **My Bar**
4. **Lists**
5. **More**

The primary mobile action can be a prominent **Add** action opening options for a private recipe or a catalog-mapped product.

Desktop and tablet may use a side navigation while keeping the same information architecture.

## 7. MVP features

### 7.1 Home dashboard

Show compact, actionable sections:

- Perfect matches
- Good-enough matches
- Missing one ingredient
- Recommended next purchases
- Recently added or updated recipes
- Shortcut to Favorites
- Shortcut to Want to Make

The dashboard should prioritize useful results over statistics.

### 7.2 Cocktail library

- Browse shared classic recipes.
- Browse published community recipes.
- Browse the user's private recipes.
- Search by cocktail name or ingredient.
- Filter by:
  - availability state;
  - taste tags;
  - base spirit or ingredient type;
  - cocktail family;
  - glass;
  - classic/community/private source;
  - Favorites;
  - Want to Make.
- Sort by name, availability, recently added, or number of missing ingredients.

The source of a recipe must always be visible: **Classic**, **Community**, or **Private**.

### 7.3 Cocktail details

Each recipe supports:

- name;
- optional short description;
- source and author attribution;
- canonical serving quantities;
- user-selectable display in ml or oz;
- glass;
- short preparation instructions;
- optional garnish instructions;
- fixed taste tags;
- required, optional, and garnish ingredients;
- substitution groups;
- cocktail family;
- linked variations and related recipes;
- Favorite toggle;
- Want to Make toggle;
- availability result and missing items;
- owner editing and sharing controls where allowed.

### 7.4 My Bar

The inventory tracks presence only—not volume, bottle size, remaining quantity, or expiry.

Users can:

- search the universal catalog;
- mark an ingredient or product as owned/not owned;
- filter owned and unowned items;
- browse by category;
- add a new product through a controlled form;
- map that product to an existing ingredient type.

Example: a homemade coffee liqueur may be registered as a product/alternative under the existing **coffee liqueur** ingredient type. A member cannot create a new ingredient type. This prevents user-created data from breaking recipe matching.

Although the feature is called My Bar, the inventory covers every tracked recipe item, including spirits, liqueurs, bitters, syrups, juices, citrus, soda, mixers, and garnishes.

### 7.5 Recipe creation and editing

Members can:

- create a private recipe;
- select existing ingredient types;
- set quantity and unit;
- mark each component required, optional, or garnish;
- create substitution groups;
- select a glass;
- add taste tags;
- link the recipe to a cocktail family;
- link it as a variation of another recipe;
- preview its availability behavior;
- publish it to all registered users;
- return it to private status.

Only the administrator manages the canonical classic catalog.

### 7.6 Personal lists

- **Favorites:** cocktails the user likes or wants quick access to.
- **Want to Make:** cocktails the user intends to try, even if ingredients are missing.

These lists are private and should influence the usefulness of search and shopping recommendations.

### 7.7 Admin area

- Manage shared classic recipes.
- Manage ingredient types, categories, aliases, and commonness.
- Manage universal products and their type mappings.
- Manage glasses and taste tags.
- Manage cocktail families and recipe relationships.
- Generate and revoke invitations.
- View registered members.
- Unpublish community recipes.
- Run batch imports with validation and preview.

## 8. Domain model

### 8.1 Ingredient type versus product

These concepts must remain separate:

- **Ingredient type:** the generic item required by a recipe, such as gin, tequila, lime juice, or coffee liqueur.
- **Product:** a branded, homemade, or otherwise specific option mapped to an ingredient type, such as Tanqueray mapped to gin.
- **User inventory item:** a user's ownership record for an ingredient type or specific product.

Owning a valid product satisfies its mapped generic ingredient type. A generic ownership entry can also satisfy the type when the user does not care to record the exact product.

Ingredient types may optionally have a parent hierarchy, for example:

`Spirit → Gin → London Dry Gin`

Matching must use explicit ancestry rules rather than text similarity. Do not infer equivalence from names.

### 8.2 Suggested entities

| Entity | Purpose |
| --- | --- |
| `profiles` | Public application profile and role tied to an authenticated user |
| `memberships` | Grants invite-only application access |
| `invitations` | Expiring, single-use invitation records |
| `ingredient_categories` | Spirit, liqueur, mixer, syrup, juice, garnish, etc. |
| `ingredient_types` | Canonical generic ingredients and optional hierarchy |
| `ingredient_aliases` | Controlled search/import aliases |
| `products` | Specific branded or homemade options mapped to a type |
| `user_inventory` | Private presence/ownership records |
| `glasses` | Canonical glass catalog |
| `taste_tags` | Fixed administrator-managed taste vocabulary |
| `cocktail_families` | Margarita family, Old Fashioned family, Sour family, etc. |
| `recipes` | Classic, community, or private cocktail record |
| `recipe_components` | Ingredient, quantity, role, order, and notes |
| `substitution_groups` | Valid OR choices within a recipe |
| `recipe_relationships` | Variation/related-recipe connections |
| `recipe_taste_tags` | Recipe-to-taste-tag mapping |
| `user_favorites` | Private favorites |
| `user_want_to_make` | Private intent list |

Exact table names may change, but the conceptual separation must be preserved.

### 8.3 Recipe ownership and visibility

Recommended fields/behavior:

- `owner_id`: null or administrator for canonical classics; member ID for user recipes.
- `source_type`: classic or user.
- `visibility`: private or shared.
- `moderation_status`: active or unpublished_by_admin.
- A recipe is visible when it is an active shared recipe, or when the current user owns it.
- Administrative unpublishing must preserve owner access.

## 9. Measurement rules

- Store liquid quantities canonically in millilitres.
- Convert to fluid ounces for display according to user preference.
- Preserve sensible display rounding; do not rewrite stored values when users change units.
- Non-volume units such as dash, barspoon, piece, slice, wedge, and top-up remain semantic units rather than fake ml conversions.
- Batch import must use known unit codes and reject unknown units.

## 10. Availability matching

The matching engine should be a deterministic, testable JavaScript domain function independent of React components.

### 10.1 Component satisfaction

A recipe component is satisfied when the user owns:

1. the required ingredient type directly;
2. a product mapped to that ingredient type;
3. a compatible explicit child type; or
4. one allowed item from its substitution group.

No fuzzy-name matching is allowed in availability calculations.

### 10.2 Availability states

- **Perfect:** every required, optional, and garnish component is satisfied.
- **Good enough:** every required component is satisfied, but one or more optional/garnish components are missing.
- **Almost:** exactly one required component is missing.
- **Unavailable:** two or more required components are missing.

The UI must show why a result received its state and list the missing items.

## 11. Purchase recommendation logic

The purpose is to recommend useful additions, not to mathematically maximize obscure recipes.

Each ingredient type should have administrator-managed metadata:

- bar priority: essential, common, specialized, or niche;
- recommend by default: yes/no;
- optional display explanation.

Candidate purchases come primarily from cocktails missing exactly one required ingredient. Ranking should consider, in this order:

1. Unlocks a Favorite or Want to Make recipe.
2. Unlocks a shared classic recipe.
3. Ingredient is essential/common and allowed for default recommendation.
4. Number of useful recipes unlocked.
5. Number of good-enough matches improved to perfect.

Niche ingredients should not appear in general recommendations unless:

- they complete a Favorite or Want to Make recipe; or
- the user is viewing a specific cocktail and asks what it lacks.

Initial ranking should use readable rules rather than opaque scores. Add numeric weighting only after real usage shows it is needed.

## 12. Batch import

### 12.1 Purpose

The application contains a copyable prompt that a user can paste into an external AI. The external AI returns strict JSON. The application itself never calls an AI service.

### 12.2 Workflow

1. Administrator chooses Recipes, Ingredients, or Products.
2. Administrator copies the corresponding formatting prompt.
3. Administrator obtains JSON externally and pastes it into the import field.
4. The app parses and validates the entire payload.
5. The app previews additions, updates, duplicate candidates, and errors.
6. The administrator confirms valid changes.
7. The operation is committed atomically or clearly reports partial-item failures.

### 12.3 Validation requirements

- Use an explicit runtime validation schema suitable for JavaScript.
- Reject malformed JSON and unknown enum/unit values.
- Resolve ingredient types through IDs, canonical names, or controlled aliases.
- Never silently create an ingredient type from an unknown string.
- Flag possible duplicates for review.
- Validate substitutions and recipe relationships.
- Show row/item-level errors.
- Store enough import metadata to diagnose an administrative import, without storing AI conversations.

### 12.4 Embedded formatting prompt requirements

The prompt must tell the external AI to:

- output JSON only, with no Markdown fence or commentary;
- use the app's published schema and allowed enum values;
- use canonical ml values for liquid quantities;
- distinguish required, optional, and garnish roles;
- separate generic ingredient types from branded products;
- avoid inventing IDs;
- return unresolved ingredient names in a dedicated review list rather than guessing mappings.

The exact prompt should be generated from the same schema/constants used by the importer so the instructions cannot drift away from validation.

## 13. Technical architecture

### 13.1 Frontend

- React + Vite + JavaScript.
- Responsive mobile-first layout.
- Central API/data-access layer; React components must not scatter raw database calls throughout the UI.
- A dedicated domain layer for availability, conversions, recommendation rules, and import preparation.
- Server-state caching may be added with a lightweight library if it materially simplifies invalidation.
- Persist theme and unit preference in the profile; a local fallback is acceptable before login.

### 13.2 Backend

- Supabase PostgreSQL is the system of record.
- Supabase Auth handles email/password and Google login.
- Supabase Data API is the main client API.
- Row Level Security is mandatory on every exposed table.
- Edge Functions or protected database functions handle invitation generation/redemption and any operation requiring elevated privileges.
- Database changes are committed as versioned migrations, not dashboard-only manual changes.

This keeps the frontend and backend separate while avoiding a custom Node server. A future mobile client can use the same authentication and API.

### 13.3 Security requirements

- No service-role/admin secret in the frontend bundle.
- Default-deny access for unauthenticated and non-member users.
- Users can read only their own inventory, lists, and private recipes.
- Users cannot forge recipe ownership or administrator status.
- Shared active recipes are readable only by registered members.
- Only the administrator can mutate canonical taxonomies and classic recipes.
- Invitation tokens are unguessable, expiring, revocable, and single-use.
- Validate all imported and user-entered data server-side or at a trusted database boundary as well as in the UI.
- Test Row Level Security policies explicitly with admin, member, non-owner, and anonymous cases.

## 14. Visual and interaction direction

- Neon cocktail-bar atmosphere rather than a literal recreation of any existing brand.
- Dark theme: deep near-black/navy surfaces with restrained cyan, magenta, violet, or warm neon accents.
- Light theme: warm light surfaces with darker typography and controlled neon accents.
- High readability and accessible contrast take priority over glow effects.
- No recipe photography is required.
- Optional flat SVG glass silhouettes, bottle shapes, ingredient symbols, and liquid color fills may provide identity.
- Brand representation is suggestive only: simplified shapes/colors, no copied trademarks or detailed labels.
- Touch targets must suit one-handed mobile use.
- Important status must use text/icon/shape as well as color.

## 15. Responsive targets

- Mobile first: approximately 360–430 px wide.
- Tablet: two-column layouts where useful.
- Laptop/desktop: persistent navigation and denser grids without stretching content excessively.
- No desktop-only workflow is allowed for core inventory, recipe, list, or availability actions.

## 16. MVP exclusions

- Bottle volume or consumption tracking
- Ingredient expiry tracking
- Shopping prices or retailer integration
- AI API connection
- Recipe photographs or uploads
- Offline mode or installable PWA
- Public access outside registered members
- Comments, likes, ratings, or social feeds
- Native mobile application
- Advanced cocktail tutorials and education
- Interactive visual mixing simulator

## 17. Future expansion

- Glassware encyclopedia and care guide
- Beginner tutorials and preparation techniques
- Spirit categories, production methods, and history
- Visual cocktail-building/mixing tool
- PWA and selective offline access
- Native mobile client
- Bottle quantity and expiry tracking
- Recipe costing
- Community review/approval workflows
- Optional recipe imagery

The educational material or visual mixer may later become a separate companion app if it grows beyond the practical bar-manager experience.

## 18. Suggested implementation phases

### Phase 0 — Foundation

- Repository structure and environment configuration
- Supabase local/development setup
- Migrations, seed taxonomies, authentication shell
- Theme tokens and responsive application shell

### Phase 1 — Accounts and security

- Email/password and Google authentication
- Membership gating
- Invitation generation/redemption/revocation
- Profiles, roles, and tested Row Level Security

### Phase 2 — Catalog and My Bar

- Ingredient types, products, categories, aliases
- Controlled product creation
- Private user inventory
- Search and filters

### Phase 3 — Recipes and matching

- Shared/private/community recipes
- Recipe editor
- Components, substitutions, families, relationships
- Unit preference and conversion
- Availability engine with automated tests

### Phase 4 — Discovery and lists

- Cocktail library filters
- Dashboard states
- Favorites and Want to Make
- Purchase recommendations

### Phase 5 — Administration and imports

- Classic catalog management
- Moderation/unpublishing
- JSON prompt, validation, preview, duplicate handling, commit

### Phase 6 — Polish and deployment

- Responsive and accessibility pass
- Dark/light theme QA
- Empty/loading/error states
- Security regression testing
- Production deployment and backup/export notes

## 19. MVP acceptance criteria

The MVP is complete when:

- Uninvited users cannot access application data.
- An administrator can generate a private invitation link.
- An invited user can join using email/password or Google.
- Two users maintain completely separate inventories and personal lists.
- Members can browse classic and active shared community recipes.
- Members can create recipes that remain private by default.
- A member can publish a recipe; the administrator can unpublish it without deleting it.
- A user-created product must map to an existing ingredient type.
- Owning a mapped product satisfies the generic recipe ingredient.
- Perfect, good-enough, almost, and unavailable states behave consistently.
- Substitutions affect availability correctly.
- Favorites and Want to Make work privately.
- Shopping suggestions prioritize useful common gaps and suppress unrelated niche products.
- Users can choose ml or oz without changing stored recipe values.
- The administrator can preview and validate JSON before importing it.
- Core workflows work comfortably on a phone and remain usable on tablet/laptop.
- Dark and light themes both meet readable contrast expectations.

