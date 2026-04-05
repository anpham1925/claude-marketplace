# hipages Repo Registry

Cross-cutting reference for all SDLC skills. Maps Jira tickets to relevant repositories so Explore subagents only search where it matters.

---

## Routing Algorithm

### Step 1: Prefix-Based Default Repos

Extract the Jira project prefix from the ticket ID (e.g., `PRT` from `PRT-123`). Look up the default repos in the **Team Defaults** table below.

### Step 2: Keyword Refinement

Scan the ticket **summary**, **description**, **acceptance criteria**, and **labels** for domain keywords. For each repo in the full registry, check if any of its keywords appear in the ticket text. Add matching repos to the candidate set.

### Step 3: Confirm with User

Present the resolved repo list:

> "Based on the ticket, I'll search these repos: **[list]**. Should I add or remove any?"

Only proceed to Explore after user confirmation.

### Step 4: Scope Subagents

Launch Explore subagents **only** for confirmed repos. Pass each subagent the absolute repo path.

---

## Team Defaults (by Jira Project Prefix)

| Prefix | Team                    | Default Repos                                                 |
| ------ | ----------------------- | ------------------------------------------------------------- |
| PRT    | Partnership Engineering | partnership, phinx-migrations, tradiecore-app, tradiecore-web |
| MOX    | MOX Engineering         | hipages-web, hip-new-api, marketplace                         |
| PSR    | BEST - Product Support  | hip-new-api, billing, hip-new                                 |
| BEST   | BEST Engineering        | hip-new-api, billing, hip-new                                 |

> If the prefix is not listed, fall back to keyword matching only. Ask the user which repos to search.

---

## Full Registry

### Core Platform

#### hip-new

- **Path**: `hip-new`
- **Stack**: PHP 8.0, Laravel, Zend, MySQL, Memcached
- **Description**: Main hipages.com.au monolith — website, admin panel, APIs, cronjobs, daemons
- **Keywords**: monolith, php, admin, cronjob, homeowner, tradie, profile, search, seo, legacy-api, vtk, dao
- **Databases**: hip, central

#### hip-new-api

- **Path**: `hip-new-api`
- **Stack**: Laravel 8.x, PHP 8.0, JSON-API, RabbitMQ
- **Description**: API platform with 19 domain modules (Accounts, Billing, Jobs, Leads, Membership, MessageCenter, Partners, Profiles, Users, etc.)
- **Keywords**: api, accounts, billing, jobs, leads, membership, message-center, partners, profiles, users, lead-distribution, pricing, identity-verification, contact-verification, tradie-experiments
- **Databases**: hip, central, message_hip

#### phinx-migrations

- **Path**: `phinx-migrations`
- **Stack**: PHP 7.3, Phinx, PostgreSQL/MySQL
- **Description**: Database migrations for 20+ databases
- **Keywords**: migration, database, schema, partner, source-type, code-table, vouchers, license
- **Databases**: hip, central, message_hip, doe, license, vouchers, sendbird_bridge, westpac_payments, adsteroids, nuntius, lux

---

### Frontend / UI

#### hipages-web

- **Path**: `hipages-web`
- **Stack**: React Router v7, React 19, TypeScript, TailwindCSS v4, Vite
- **Description**: Consumer-facing web apps (homeowner, business, get-quote, auth)
- **Keywords**: homeowner, consumer, get-quote, auth, web, frontend, react, tailwind, shadcn, storybook
- **Apps**: homeowner, business, get-quote, auth, storybook-composer

#### tradiecore-app

- **Path**: `tradiecore-app`
- **Stack**: React Native 0.81, TypeScript, Jotai, GrowthBook
- **Description**: Native mobile app for hipages tradies (iOS & Android)
- **Keywords**: mobile, react-native, ios, android, tradie, consent, iap, lead-pack, self-ascension, push-notification

#### tradiecore-web

- **Path**: `tradiecore-web`
- **Stack**: React Router v7, Vite, TailwindCSS v4, TypeScript
- **Description**: Web platform for tradie account management, jobs, leads, invoices
- **Keywords**: tradie, web, jobs, leads, invoices, consent, analytics, snowplow, growthbook

#### admin-ui

- **Path**: `admin-ui`
- **Stack**: React, Reactstrap, MirageJS, CircleCI
- **Description**: Hipages admin panel (standalone React SPA + PHP portal integrations)
- **Keywords**: admin, portal, internal-tools, react, mirage

---

### Backend Services

#### partnership

- **Path**: `partnership`
- **Stack**: NestJS, TypeORM, PostgreSQL, Kafka, RabbitMQ
- **Description**: Business partnership system (Bunnings, IKEA, etc.) — enrollment, payouts, job-posting, compliance
- **Keywords**: partner, partnership, bunnings, ikea, enrollment, payout, job-posting, partner-source, consent, perk, compliance-wall, scheme
- **Modules**: enrolment, payout, perk, common

#### billing

- **Path**: `billing`
- **Stack**: NestJS, TypeORM, PostgreSQL, Zuora, CQRS
- **Description**: Billing and payment system (Zuora integration)
- **Keywords**: billing, payment, zuora, invoice, subscription, credit, charge, payout, mediator

#### leads

- **Path**: `leads`
- **Stack**: NestJS, TypeScript, PostgreSQL
- **Description**: Lead management system
- **Keywords**: lead, lead-management, lead-distribution, tradie-marketplace, claim

#### marketplace

- **Path**: `marketplace`
- **Stack**: NestJS v11, TypeORM, PostgreSQL, Redis, Temporal, Kafka, Avro
- **Description**: Core matching engine — connects homeowner job requests with qualified tradies (scoring, filtering, ranking, pricing, enrichment)
- **Keywords**: matching, scoring, ranking, filtering, enrichment, pricing, lead, job, temporal, kafka, avro, batch-sizing
- **Apps**: matching, api, data-migration, event-consumer, legacy-integration

#### tradie-insurance

- **Path**: `tradie-insurance`
- **Stack**: NestJS, TypeORM, PostgreSQL, CQRS
- **Description**: Tradie insurance management (approval workflows, document attachments)
- **Keywords**: insurance, tradie-insurance, approval, document, attachment, compliance

#### conmendator

- **Path**: `conmendator`
- **Stack**: Node.js 12, TypeScript, Express/Inceptum, MySQL, CQRS
- **Description**: Voucher and campaign management microservice (create, activate, redeem, refund, revoke vouchers)
- **Keywords**: voucher, campaign, coupon, redeem, refund, activate, revoke, bunnings

#### socium

- **Path**: `socium`
- **Stack**: Node.js 10, Express, CircleCI
- **Description**: Bunnings partnership website (create, verify, post jobs)
- **Keywords**: bunnings, partnership-website, socium, voucher, verify
- **External URL**: bunnings.hipages.com.au

#### hipay

- **Path**: `hipay`
- **Stack**: PHP/Laravel, React 16, AngularJS, Gulp, Docker
- **Description**: Payment processing API and gateway service
- **Keywords**: payment, hipay, gateway, api, invoice, transaction

---

## Notes

- **Paths are relative** to the hipages workspace root (e.g., `~/hipages/` or wherever the workspace is checked out). Resolve to absolute paths before passing to Explore subagents.
- **Keywords are lowercase** — match case-insensitively against ticket text.
- **Multiple repos per ticket** is common — e.g., a ticket might touch `partnership` + `phinx-migrations` + `tradiecore-web`.
- **If no repos match**, ask the user directly rather than searching everything.
