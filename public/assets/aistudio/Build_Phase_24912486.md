## **Phase 1: Core Foundation, Database Schema & Seed Engine**

* **Next.js 14 Setup & Styling:** Initialize Next.js 14 App Router project with TypeScript, Tailwind CSS (configured for dark: class root toggles), Lucide icons, and Recharts.  
* **Supabase Client & Migration:** Establish lib/supabase.ts (client and server instances). Execute the SQL migration script creating all 7 core tables (users, players, user\_notes, user\_lineups, user\_tier\_lists, user\_likes, site\_config), the update\_like\_count() PostgreSQL trigger, and Row-Level Security (RLS) policies.  
* **Master Seed Script:** Create a seeding script/route populating players with the complete 25-player players\_seed.json dataset (including stats\_awakened where applicable) and inserting the initial next\_chapter\_release target into site\_config.  
* **Global Context Providers:** Implement SpoilerContext (managing global spoilers\_enabled state synced to localStorage) and AuthContext (managing Supabase user sessions).

## **Phase 2: Scout Hub & Command Center (Views 1 & 2\)**

* **View 2 (/strikers \- Directory & Scout Hub):**  
  * Search bar with real-time text matching against name, team, and primary\_weapon.  
  * Multi-select category filters: team, rank\_tier (S+ to C), and primary\_eye\_type (Metavision, Predator Eye, Destroyer Eye, None).  
  * Sorting controls: Overall Rating, Speed, Shoot, Name.  
  * Pagination: Client/server pagination fixed at 12 players per page; changing any filter or search query forces reset to Page 1\.  
  * Hexagon Player Cards: Render portrait, rank, overall rating, position tag, primary\_weapon, and EX stat highlights ($>99$).  
* **View 1 (/ \- Home Dashboard):**  
  * Egoist Spotlight Card: Dynamically render daily featured player data and psychological breakdown.  
  * Chapter Countdown Timer: Fetch target timestamp from site\_config (next\_chapter\_release) and render live counting UI.  
  * Public Tier List Carousel: Query user\_tier\_lists where is\_public \= true, ordered by (view\_count \+ like\_count) DESC.  
  * Psychology Articles Hub: Static navigation section linking to deep-dive essays on Egoism, Flow State, and Zero State.

## **Phase 3: Psychological Deep-Dive & Ego Duel Simulator (Views 3 & 4\)**

* **View 3 (/strikers/\[id\] \- Player Detail & Radar View):**  
  * 6-Axis Recharts Radar Component: Plot offense, shoot, dribble, pass, defense, speed with fixed domain scale \[0, 110\]. Apply SVG glowing filter (\#neonGlow) for scores $>99$.  
  * Mental Adaptability Progress Gauge: Separate UI ring component displaying the 7th stat key (adaptability) alongside tier badges.  
  * Zero State Awakening Toggle: Conditionally render state toggle button **only** when stats\_awakened \!= null AND spoilers\_enabled \== true. Toggling switches chart data between baseline stats and stats\_awakened.  
  * User Notes Module: CRUD interface allowing authenticated users to read, write, edit, and delete notes bound to (user\_id, player\_id) in user\_notes.  
* **View 4 (/compare \- Ego Duel Comparison):**  
  * Stateless Query Routing: Read p1 and p2 from URL search parameters (/compare?p1=id1\&p2=id2).  
  * Fallback Logic: If an invalid player ID is passed, default p1 to isagi-yoichi or p2 to michael-kaiser and trigger a warning toast notification.  
  * Dual Radar Overlay & Differential Table: Render both player stat polygons on a single Recharts chart; display a point-by-point delta table ($\pm$ difference).  
  * Interactive Tools: "Random Matchup" button that selects two distinct player IDs and updates URL parameters; "Share Comparison" button that copies the current URL to system clipboard.

## **Phase 4: Lineup Builder, Tier List Engine & Shared Views (View 5\)**

* **View 5 Canvas (/builder \- Lineup Builder & Custom Tier List):**  
  * Pitch Formation Selector: Support 4-3-3, 4-4-2, 3-5-2, and 4-2-3-1 pitch layouts mapping 11 slot positions to field coordinates.  
  * Real-Time Squad Mathematics Engine: Calculate total\_overall (\$\\lfloor \\frac{\\sum \\text{Overall}}{11} \+ 0.5 \\rfloor\$) and chemistry\_score ($50+ClubSynergy+Metavision/FinisherBonus+DominantClubBonus$) as players are dragged or selected into the starting XI.  
  * Drag-and-Drop Tier List Engine: Categorize players across hardcoded S+, S, A, B, and C rows.  
  * Guest Sandbox & Export Suite: Allow guests to build on canvas without logging in. Client-side exports: CSV using papaparse and PNG image rendering using html-to-image.  
  * Database Persistence: "Save Lineup" and "Save Tier List" actions for logged-in users inserting/updating user\_lineups and user\_tier\_lists. Guest click triggers authentication modal.  
* **Public Tier List Route (/tier-lists/\[id\]):**  
  * Render saved public tier list data.  
  * Increment view\_count on mount, deduplicated per browser session using sessionStorage.

## **Phase 5: Production QA, Reactions & Permission Verification**

* **Like System Implementation:** Add single-click like buttons on Player Detail and Shared Tier List pages inserting into user\_likes, verified against database trigger updating like\_count.  
* **Spoiler Shield Verification:** Test global spoilers\_enabled \= false setting to ensure player names mask to ???, spoiler profiles blur, and comparison previews hide spoiler parameters across all views.  
* **Edge-Case Validation:** Test empty lineup blocking (requiring exactly 11 unique players), unauthenticated route protection, and responsive viewport layouts.

