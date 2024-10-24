# Hono.js API with TypeScript for UK Postcode Lookup

This project is a backend API built with [Hono.js](https://hono.dev/), powered by TypeScript and Bun. It provides a RESTful service for handling postcode lookups, counties, districts, and wards. The API allows you to query and manage geographical data, including postcodes by area code and detailed postcode information.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [GET Requests](#get-requests)
  - [POST Requests](#post-requests)
  - [Put and Delete Requests](#put-and-delete-requests)


### Prerequisites

- [Bun](https://bun.sh/docs/install) runtime environment
- [Node.js](https://nodejs.org) (for npm package management)
- A database system for storing country, county, district, ward, and postcode data.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/azad241/ukpost-api-hono-bun
    cd ukpost-api-hono-bun
    ```

2. Install dependencies:

```bash
bun install
```

3. Set up your environment variables. Create a `.env` file in the root directory:

    ```bash
    touch .env
    ```

    Add the following environment variables:

    ```bash
    API_DOMAIN=your-api-domain.com
    CORS_DOMAIN=your-frontend-domain.com
    ```

## Environment Variables

- `DB_FILE_NAME`: The database name that will be used to generate a sqlite file.
- `API_DOMAIN`: The domain where the API will run (used for host validation).
- `CORS_DOMAIN`: The domain allowed for cross-origin requests.


4. Generate Schema
```bash
bunx drizzle-kit generate
```
5. Apply migrations
```bash
bunx drizzle-kit migrate
```
5. To start the development server, run:
```bash
bun run dev
```
## Usage

### API Endpoints

### GET Requests

#### Get all postcodes (4-digit)

```http
GET /postcode/
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `skip` | `int` | (**Optional**) To skip from the begaining |
| `limit` | `int` | (**Optional**)To limit the number of item (default: 21) |
| `query` | `string` | (**Optional**) To filter by query |



### Get 3-digit postcodes by 4-digit postcode
```http
GET /postcode/:slug/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| slug      | string | 4-digit postcode                      |
| query     | string | (**Optional**) Filter by query        |
| skip      | int    | (**Optional**) Number of items to skip|
| limit     | int    | (**Optional**) Number of items to return (default: 21) |


### Get postcode details

```http
GET /postcode/:fourdigit/:threedigit/
```

Parameters:
| Parameter  | Type   | Description                           |
|------------|--------|---------------------------------------|
| fourdigit  | string | 4-digit postcode                      |
| threedigit | string | 3-digit postcode                      |


### Get postcodes by area code
```http
GET /area/:code/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| code      | string | One or two letter area code           |
| skip      | int    | (**Optional**) Number of items to skip|
| limit     | int    | (**Optional**) Number of items to return (default: 21) |

### Add postcode
```http
POST /postcode/
```

Body:
| Parameter    | Type   | Description                           |
|--------------|--------|---------------------------------------|
| fourdigitId  | number | ID of the 4-digit code               |
| threedigitId | number | ID of the 3-digit code               |
| wardId       | number | ID of the ward                       |
| latitude     | number | Latitude coordinates                  |
| longitude    | number | Longitude coordinates                 |


## Geographic Hierarchy

### Get counties by country
```http
GET /:country/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| country   | string | Country name                  |


### Get districts by country and county
```http
GET /:country/:county/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| country   | string | Country name or code                  |
| county    | string | County name or code                   |


### Get wards by country, county and district
```http
GET /:country/:county/:district/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| country   | string | Country name or code                  |
| county    | string | County name or code                   |
| district  | string | District name or code                 |


### Get postcodes by geographic hierarchy
```http
GET /:country/:county/:district/:ward/
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| country   | string | Country name or code                  |
| county    | string | County name or code                   |
| district  | string | District name or code                 |
| ward      | string | Ward name or code                     |


### Search postcodes and locations
```http
GET /search/
```

Parameters:
| Parameter  | Type   | Description                           |
|------------|--------|---------------------------------------|
| query      | string | (**Optional**) Search query           |
| querytype  | string | (**Optional**) Type of search (default: 'postcode'): Yet to implement:  ward, district, couny, and country  |
| skip       | int    | (**Optional**) Number of items to skip |
| limit      | int    | (**Optional**) Number of items to return (default: 21) |


### POST Requests

## Add country
```http
POST /country/
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| name      | string | Country name (max 50 chars)           |
| iso       | string | ISO code (max 3 chars)                |


### Add county
```http
POST /county/
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| name      | string | County name (max 50 chars)            |
| code      | string | County code (max 9 chars)             |
| countryId | number | ID of the country                     |



### Add district
```http
POST /district/
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| name      | string | District name (max 100 chars)         |
| code      | string | District code (max 9 chars)           |
| countyId  | number | ID of the county                      |


### Add ward
```http
POST /ward/
```

Body:
| Parameter  | Type   | Description                           |
|------------|--------|---------------------------------------|
| name       | string | Ward name (max 100 chars)             |
| code       | string | Ward code (max 9 chars)               |
| districtId | number | ID of the district                    |


### Add four-digit code
```http
POST /fourdigit/
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| code      | string | Four-digit code (max 4 chars)         |


### Add three-digit code
```http
POST /threedigit/
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| code      | string | Three-digit code (max 3 chars)        |


### Put and Delete Requests

### Update country
```http
PUT /country/:id
```

Body:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| name      | string | Country name (max 50 chars)            |
| iso       | string | ISO code (max 3 chars)                |


### Delete country
```http
DELETE /country/:id
```

Parameters:
| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| id        | number | ID of the country to delete            |
