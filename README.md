# Golden Hour Grid: AI-Powered Emergency Response & Dynamic Resource Routing

Real-time ambulance-to-hospital routing that picks the single right trauma center on the first try, using ICU beds, specialist roster, blood stock, ER load, traffic and injury type, instead of just distance.

## Run it (2 minutes, nothing to install)
Requires Node.js 18+ only. No npm packages.

    cd golden-hour-grid
    node server.js
    # open http://localhost:3000            (split-screen dispatch console)
    # open http://localhost:3000/dashboard.html   (live analytics dashboard)

## Optional: Gemini
Copy `.env.example` to `.env`, paste your key from Google AI Studio into `GEMINI_API_KEY`, restart.
In the console press **Use Gemini (backend)**: the server calls Gemini and the model scores every hospital with reasons. Change `GEMINI_MODEL` if Google renames models. If Gemini or your local model fails, the built-in engine takes over automatically.

## Other AI options (in the console)
- **Load model file**: pick a `.gguf` file from your computer; it runs inside the browser (wllama), nothing to install.
- **Ollama / LM Studio**: Advanced section.

## Project layout
    server.js            HTTP server, REST API, static files, Gemini proxy (no dependencies)
    engine.js            Routing engine: scoring, crash-corridor avoidance, rejection reasons, survival model
    data/*.json          Hospitals, accident locations, scenarios, crash hotspots (edit these to use your own city)
    public/index.html    Split-screen console: ambulance (left) and hospital command (right), animated map
    public/dashboard.html  Live analytics: KPIs, charts, blood stock, latest dispatches

## REST API
    GET  /api/health          status, whether Gemini is configured
    GET  /api/hospitals       hospital data (ICU, ER load, blood, specialists)
    GET  /api/locations       accident locations
    GET  /api/scenarios       test scenarios
    POST /api/dispatch        {"loc":"Highway Toll","inj":"neuro","sev":"Critical","bg":"O-","traffic":1.5}
                              returns ranked hospitals, reasons for every rejected one, time saved, survival estimate
    POST /api/cases           log a case (the console does this automatically)
    GET  /api/analytics       aggregates for the dashboard
    POST /api/seed            add 60 demo cases (?reset=1 clears all)
    POST /api/ask             {"prompt":"..."} proxied to Gemini

Example:

    curl -X POST localhost:3000/api/dispatch -H "Content-Type: application/json" \
      -d '{"loc":"Highway Toll","inj":"neuro","sev":"Critical","bg":"O-","traffic":1.5}'

## Important for judges
All hospital, blood, traffic and survival numbers are simulated. The survival model is a simple demo formula, not clinical evidence. In production, hospital data would stream from hospital systems, routing from Google Maps (live traffic), and triage from Gemini.

## Roadmap
Google Maps Directions and traffic, real hospital feeds, driver app, hospital login and roles, audit log for unbiased routing, green-wave signal integration, fleet placement from crash-corridor analytics.
