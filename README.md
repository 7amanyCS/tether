# Tether

A daily health check for crews on long space missions. Tether compares every reading with the crew member's own pre-flight baseline, shows where they have drifted, and turns that into one decision: handle it yourself, tell the crew medical officer, or contact the flight surgeon.

Built for the 2026 NASA Space Apps Challenge, *Create Health Monitoring Software for Astronauts on Space Missions*.

## What it does

- **Your own profile or a demo.** Set up a profile with your name, mission, mission day, and pre-flight baseline, or explore a demo crew member with 141 days of history. Profiles are stored in the browser only.
- **One-minute check-in.** Eight readings: sleep, mood, resting heart rate, blood pressure, temperature, blood glucose, body mass, and exercise. Each step explains how to take the measurement in microgravity and why it matters.
- **Tether score.** A single 0 to 100 score with three states, Steady, Drifting, and Off baseline. Each state has its own colour, shape, and word, so it reads without colour vision.
- **Body map.** Five body systems on a figure, each tied to one of NASA's five hazards of human spaceflight.
- **A plan, not just a number.** Rules decide who needs to act. A single off day is yours to handle. A trend of three days, or two systems drifting together, goes to the crew medical officer. Anything outside a safe range goes to the ground.
- **Ask Tether.** An assistant docked at the bottom of every screen. It suggests questions from the crew member's current state ("Why is my score 62?", "How do I get my sleep back?") and answers from their own readings. With a link to the ground it uses Google Gemini; without one it answers from the on-board rules, so it keeps working when Earth is out of reach.
- **Distance from Earth.** Choose space station, lunar surface, Mars transit, or Mars surface. The signal delay changes the advice: on the way to Mars a reply takes 20 minutes, so Tether tells you what to do while you wait.
- **Radiation.** Cumulative dose for the mission against NASA's 600 mSv career limit.
- **Wearables.** Connects to any band, watch, or chest strap that broadcasts the standard Bluetooth heart-rate service, and fills in the heart-rate step from the live reading. Needs Chrome or Edge. The "Tether band" offered in setup is a demo: no such device exists, and it sends simulated heart rate.

## How readings are judged

Every indicator has a personal baseline (mean and normal day-to-day swing) measured before launch. A reading is:

- **Drifting** when it is 1.75 or more standard deviations from baseline in a direction that matters, or past a caution limit.
- **Off baseline** when it is 3 or more standard deviations out, or past a fixed safety limit that applies to anyone, such as a temperature of 38.0 °C.

Sleep, mood, resting heart rate, and exercise are judged on a three-day average so one bad night does not raise a flag. Temperature, blood pressure, glucose, and body mass are judged on the latest reading. Body mass counts a swing of two percent of baseline as normal. The logic is in [`src/lib/engine.ts`](src/lib/engine.ts) and the limits are in [`src/lib/indicators.ts`](src/lib/indicators.ts).

All of this is plain rules. No model decides a status or a plan, so every recommendation can be traced to the reading and the limit that caused it. The assistant only explains: it is given the readings and the plan the rules already produced, and is told not to invent numbers, diagnose, or soften the plan ([`server/coach.ts`](server/coach.ts)).

## Data and sources

The demo runs on a simulated 141-day log for one fictional crew member ([`src/lib/seed.ts`](src/lib/seed.ts)). No real astronaut data is used. The physiology, dose rates, and limits come from:

| Used for | Source |
| --- | --- |
| The five hazards | [NASA Human Research Program, The 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) |
| Sleep in flight | [Barger et al., Lancet Neurology 2014](https://doi.org/10.1016/S1474-4422(14)70122-X) |
| Body temperature in flight | [Stahn et al., Scientific Reports 2017](https://doi.org/10.1038/s41598-017-15560-w) |
| Immune changes | [Crucian et al., Frontiers in Immunology 2018](https://doi.org/10.3389/fimmu.2018.01437) |
| Arterial stiffness, insulin resistance | [Hughson et al., Am J Physiol Heart Circ Physiol 2016](https://doi.org/10.1152/ajpheart.00802.2015) |
| Body mass in flight | [Zwart et al., Aviat Space Environ Med 2014](https://doi.org/10.3357/ASEM.3979.2014) |
| Bone loss | [Lang et al., J Bone Miner Res 2004](https://doi.org/10.1359/JBMR.040307) |
| Dose rate, Mars transit | [Zeitlin et al., Science 2013](https://doi.org/10.1126/science.1235989) |
| Dose rate, Mars surface | [Hassler et al., Science 2014](https://doi.org/10.1126/science.1244797) |
| Dose rate, lunar surface | [Zhang et al., Science Advances 2020](https://doi.org/10.1126/sciadv.aaz1334) |
| Career radiation limit | [NASA-STD-3001 Vol. 1](https://www.nasa.gov/directorates/esdmd/hhp/human-spaceflight-and-aviation-standards/) |

Tether is a hackathon prototype. Its thresholds illustrate the approach and are not medical advice.

## Run it

```bash
npm install
npm run dev
```

To give the assistant a live Gemini link, copy `.env.example` to `.env.local` and add a key. Without one it answers from the on-board rules.

`npm run build` writes a static site to `dist/`. On Cloudflare Pages, `functions/api/coach.ts` serves the assistant; set `GEMINI_API_KEY` in the project's environment variables.

## Demo script

1. Choose **Explore a demo crew member**. It opens on Mars transit, flight day 142. The score is 62 and Drifting: sleep, mood, and resting heart rate have slid for several days. The plan says to tell the crew medical officer.
2. Open **Body** and select the head and chest markers to show what is driving it.
3. Start the check-in. On the temperature step, enter 38.4.
4. The score drops to Off baseline and the plan changes to contacting the flight surgeon, with a 20-minute reply time and steps to take while waiting.
5. Tap **Ask Tether** and pick "What do I do while I wait for the ground?"
6. Open **Mission** and switch to the space station to show the same reading with a live link to the ground.

## Built with

React, TypeScript, and Vite. The assistant uses the Gemini API through a Cloudflare Pages function. Charts and the body figure are hand-written SVG. Type is Barlow and Barlow Condensed.
