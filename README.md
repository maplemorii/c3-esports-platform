# Rocket League League Website

This project is a website for a Rocket League league.

The site is designed to serve as the official hub for the league, providing information about teams, matches, standings, and seasons. It is intended for use by this league only and is not designed to function as a platform for other leagues.

The purpose of the website is to give players, staff, and viewers a central place to follow the league, view schedules and results, and keep track of standings throughout the season.

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui

### Backend

- NextAuth.js (authentication)
- Prisma (ORM)
- PostgreSQL (database)
- Redis (caching / background jobs)

### Infrastructure

- Docker
- Docker Compose


## Features

### League Management

- Create seasons  
- Register teams  
- Assign team captains  
- Manage players  

### Match System

- Schedule matches  
- Submit match results  
- Track match history  

### Standings

- Automatic standings calculation  
- Win/loss tracking  
- Season rankings  

### Admin Tools

- Create and manage seasons  
- Control match scheduling  
- Approve match results  

### Replay Processing (Planned)

- Upload Rocket League replay files  
- Parse match stats  
- Generate advanced analytics