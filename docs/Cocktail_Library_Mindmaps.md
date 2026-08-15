# Cocktail Library — App and Process Maps

## 1. App map

```mermaid
mindmap
  root((Cocktail Library))
    Home
      Perfect matches
      Good-enough matches
      Missing one item
      Buy next
    Cocktails
      Classics
      Community
      Private recipes
      Families
      Variations
    My Bar
      Owned ingredients
      Owned products
      Controlled product add
    Lists
      Favorites
      Want to Make
    Account
      Invitations
      Unit preference
      Dark or light theme
    Admin
      Shared catalog
      Taxonomies
      Moderation
      Batch import
```

## 2. Data ownership map

```mermaid
flowchart TD
    A["Shared canonical data"] --> B["Ingredient types and products"]
    A --> C["Classic recipes"]
    A --> D["Glasses, tags, families"]
    E["Individual user"] --> F["Private inventory"]
    E --> G["Favorites and Want to Make"]
    E --> H["Private recipes"]
    H --> I{"User publishes?"}
    I -- No --> H
    I -- Yes --> J["Shared community library"]
    J --> K{"Admin moderation"}
    K -- Keep --> J
    K -- Unpublish --> H
```

## 3. Invitation and access process

```mermaid
flowchart TD
    A["Admin generates invite"] --> B["Expiring single-use URL"]
    B --> C["Guest opens join page"]
    C --> D{"Choose authentication"}
    D -- Google --> E["Google sign-in"]
    D -- Email --> F["Email and password signup"]
    E --> G["Redeem invite"]
    F --> G
    G --> H{"Token valid?"}
    H -- Yes --> I["Create membership"]
    H -- No --> J["Deny app access"]
    I --> K["Open private app"]
```

## 4. Recipe availability process

```mermaid
flowchart TD
    A["Load recipe components"] --> B["Load user's inventory"]
    B --> C["Resolve products, types and substitutions"]
    C --> D{"Missing required items"}
    D -- "Two or more" --> E["Unavailable"]
    D -- "Exactly one" --> F["Almost"]
    D -- None --> G{"Missing optional or garnish?"}
    G -- Yes --> H["Good enough"]
    G -- No --> I["Perfect"]
```

## 5. Shopping recommendation process

```mermaid
flowchart TD
    A["Find recipes missing one required item"] --> B["Create missing-item candidates"]
    B --> C{"Favorite or Want to Make?"}
    C --> D["Raise priority"]
    C --> E{"Classic recipe?"}
    D --> E
    E --> F["Prefer classics"]
    E --> G{"Ingredient common?"}
    F --> G
    G -- Essential or common --> H["Recommend"]
    G -- Specialized or niche --> I{"Targeted recipe?"}
    I -- Yes --> H
    I -- No --> J["Suppress by default"]
```

## 6. Batch import process

```mermaid
flowchart TD
    A["Copy schema-based AI prompt"] --> B["External AI returns JSON"]
    B --> C["Paste JSON into admin import"]
    C --> D["Parse and validate"]
    D --> E{"Valid?"}
    E -- No --> F["Show item-level errors"]
    E -- Yes --> G["Preview changes and duplicates"]
    G --> H{"Admin confirms?"}
    H -- No --> I["Discard preview"]
    H -- Yes --> J["Commit import"]
```

## 7. Technical boundary

```mermaid
flowchart TD
    A["React web client"] --> B["Application service layer"]
    B --> C["Supabase Data API"]
    B --> D["Protected Edge Functions"]
    C --> E["PostgreSQL with RLS"]
    D --> E
    F["Future mobile client"] --> C
    F --> D
```

