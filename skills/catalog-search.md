# Skill: Catalog Search

- Key: catalog.search
- Owner: Product & Search Team
- Version: 1.0.0
- Status: active

## Purpose
Enable fast, accurate product discovery across the Union Digitale catalog.

## Scope
Searches the public catalog, filters results, and returns a ranked list of products for browsing experiences.

## Inputs
- query (string): search keywords from the user
- filters (object): category, price range, availability, vendor, rating
- pagination (object): page, pageSize
- locale (string): language/region for localization

## Outputs
- results (array): product summaries with id, title, price, thumbnail, rating
- totalCount (number): total results for pagination
- appliedFilters (object): normalized filters used

## Preconditions
- Catalog index is available and up to date.
- Only ACTIVE or OUT_OF_STOCK products are returned.

## Side Effects
- Increments search analytics counters.

## Guardrails
- Do not expose unpublished or rejected products.
- Sanitize query input to prevent injection.
- Enforce rate limits for anonymous traffic.

## Logging
- Log skill usage with query length, filters applied, result count, and latency.
- Avoid logging raw PII; hash user identifiers if needed.

## Examples
- Input: { query: "casque bluetooth", filters: { priceMax: 2500 } }
- Output: { results: [ ... ], totalCount: 42 }

## Ownership
- Primary: Search Engineering
- Secondary: Catalog Operations
