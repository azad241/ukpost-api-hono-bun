import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
	getSearchResults,
	getFourPostcode,
	getThreePostcode,
	getPostcodeDetails,
	getPostcodeByAreacode,
	getCounty,
	getWard,
	getDistrict,
	getPostcodes,
	getRelatedResults,
} from './db/crud';

import {
	addCountry,
	addCounty,
	addDistrict,
	addWard,
	addThreeDigit,
	addFourDigit,
	addPostcode,
	deleteCountry,
	updateCountry,
} from './db/crud';
import { StatusCode } from 'hono/utils/http-status';

const app = new Hono();

// security part

//1. checking cors
const origins = [process.env.CORS_DOMAIN!];

app.use(
	'*',
	cors({
		origin: origins,
		allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
		allowMethods: ['POST', 'GET', 'PUT', 'DELETE'],
		exposeHeaders: ['*'],
		maxAge: 600,
		credentials: true,
	})
);

//2. checking api url in header
app.use('*', async (c, next) => {
	const host = c.req.header('host');
	const api_domain = process.env.API_DOMAIN!;
	if (host && !host.includes(api_domain)) {
		return c.json(
			{
				detail: `Access denied! Requested Host: ${host}, Allowed Host(S): ${api_domain}`,
			},
			403
		);
	}
	await next();
});

//all get requests start

//root
app.get('/', (c) => c.json({ status: 'Working...(Rutime: Bun)' }));

//robots.txt
app.get('/robots.txt', (c) => {
	return c.text('User-agent: *\nDisallow: /', 200, { 'Content-Type': 'text/plain' });
});

// Searching
app.get('/search/', async (c) => {
	const { query = '', querytype = 'postcode' } = c.req.query();
	const skip = parseInt(c.req.query('skip') || '0');
	const limit = parseInt(c.req.query('limit') || '20');

	const results = await getSearchResults(skip, limit, query.toLowerCase(), querytype.toLowerCase());
	return c.json(results);
});

// Related Postcode by wardId
app.get('/related/', async (c) => {
	const { id } = c.req.query();
	const results = await getRelatedResults(parseInt(id));
	return c.json(results);
});

//Details from advance api
app.get('/details/', async (c) => {
	const { postcode = '' } = c.req.query();
	try {
		const response = await fetch(`${process.env.SECRET_API}${encodeURIComponent(postcode)}?output=json`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		if (!response.ok) {
			return c.json({ error: 'Error fetching data' }, 500);
		}
		const data = await response.json();
		return c.json(data);
	} catch (error) {
		console.error('Fetch error:', error);
		return c.json({ error: 'Error fetching data' }, 500);
	}
});

// Get 4 digit postcode
app.get('/postcode/', async (c) => {
	const { query = '' } = c.req.query();
	const skip = parseInt(c.req.query('skip') || '0');
	const limit = parseInt(c.req.query('limit') || '20');

	const results = await getFourPostcode(skip, limit, query);
	return c.json(results);
});

// Get 3 digit postcode by 4 digit postcode
app.get('/postcode/:slug/', async (c) => {
	const { slug } = c.req.param();
	const { query = '' } = c.req.query();
	const skip = parseInt(c.req.query('skip') || '0');
	const limit = parseInt(c.req.query('limit') || '20');

	const results = await getThreePostcode(slug, skip, limit, query);
	return c.json(results);
});

// Get 7 digit postcode details by 4digitpostcode/3digitpostcode
app.get('/postcode/:fourdigit/:threedigit/', async (c) => {
	const { fourdigit, threedigit } = c.req.param();

	const results = await getPostcodeDetails(fourdigit, threedigit);
	return c.json(results);
});

// Postcodes by area code (one or two letter)
app.get('/area/:code/', async (c) => {
	const { code } = c.req.param();
	const skip = parseInt(c.req.query('skip') || '0');
	const limit = parseInt(c.req.query('limit') || '20');

	const results = await getPostcodeByAreacode(skip, limit, code.toLowerCase());
	return c.json(results);
});

// County by country
app.get('/:country/', async (c) => {
	const { country } = c.req.param();

	const results = await getCounty(country);
	return c.json(results);
});

// District by country/county
app.get('/:country/:county/', async (c) => {
	const { country, county } = c.req.param();

	const results = await getDistrict(country, county);
	return c.json(results);
});

// Ward by country/county/district
app.get('/:country/:county/:district/', async (c) => {
	const { country, county, district } = c.req.param();

	const results = await getWard(country, county, district);
	return c.json(results);
});

// Postcodes by country/county/district/ward
app.get('/:country/:county/:district/:ward/', async (c) => {
	const { country, county, district, ward } = c.req.param();

	const results = await getPostcodes(country, county, district, ward);
	return c.json(results);
});

//all post requests start

// Add country
app.post('/country/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const { name, iso }: { name: string; iso: string } = body;

		if (!name || !iso || name.length > 50 || iso.length > 3) {
			return c.json(
				{
					message:
						'name and iso are required\n name less than 50 and iso less than 3 characters',
				},
				400
			);
		}
		const status = await addCountry(name, iso);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add county
app.post('/county/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const {
			name,
			code,
			countryId,
		}: { name: string; code: string; countryId: number } = body;

		if (!name || !code || !countryId || name.length > 50 || code.length > 9) {
			return c.json(
				{
					message:
						'name (max: 50 char), code (max: 9 char), and countryId are required',
				},
				400
			);
		} else {
			const status = await addCounty(name, code, countryId);
			return c.json({ message: status.message }, status.code as StatusCode);
		}
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add district
app.post('/district/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const {
			name,
			code,
			countyId,
		}: { name: string; code: string; countyId: number } = body;

		if (!name || !code || !countyId || name.length > 100 || code.length > 9) {
			return c.json(
				{
					message:
						'name (max: 100 char), code (max: 9 char), and countyId are required',
				},
				400
			);
		}
		const status = await addDistrict(name, code, countyId);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add ward
app.post('/ward/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const {
			name,
			code,
			districtId,
		}: { name: string; code: string; districtId: number } = body;

		if (!name || !code || !districtId || name.length > 100 || code.length > 9) {
			return c.json(
				{
					message:
						'name (max: 100 char), code (max: 9 char), and districtId are required',
				},
				400
			);
		}
		const status = await addWard(name, code, districtId);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add four-digit code
app.post('/fourdigit/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const { code }: { code: string } = body;

		if (!code || code.length > 4) {
			return c.json(
				{ message: 'Four-digit code and wardId are required' },
				400
			);
		}
		const status = await addFourDigit(code);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add three-digit code
app.post('/threedigit/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const { code }: { code: string } = body;

		if (!code || code.length > 3) {
			return c.json({ message: 'Three-digit code is required' }, 400);
		}
		const status = await addThreeDigit(code);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

// Add postcode
app.post('/postcode/', async (c) => {
	try {
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const {
			fourdigitId,
			threedigitId,
			wardId,
			latitude,
			longitude,
		}: {
			fourdigitId: number;
			threedigitId: number;
			wardId: number;
			latitude: any;
			longitude: any;
		} = body;

		if (!fourdigitId || !threedigitId || !wardId || !latitude || !longitude) {
			return c.json(
				{
					message:
						'fourdigitId, threedigitId, wardId, latitude, and longitude are required',
				},
				400
			);
		}
		const status = await addPostcode(
			fourdigitId,
			threedigitId,
			wardId,
			latitude,
			longitude
		);
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid JSON or request body' }, 400);
	}
});

//1 update and 1 delete request

//delete a country
app.delete('/country/:id', async (c) => {
	try {
		const { id } = c.req.param();
		const status = await deleteCountry(parseInt(id));
		return c.json({ message: status.message }, status.code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid request or server error' }, 500);
	}
});

//update a country
app.put('/country/:id', async (c) => {
	try {
		const { id } = c.req.param();
		let body: any;
		if (c.req.header('content-type')?.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = c.req.query();
		}
		const { name, iso }: { name: string; iso: string } = body;
		if ((name && name.length > 50) || (iso && iso.length > 3)) {
			return c.json(
				{
					message: 'Warning!\nname less than 50 and iso less than 3 characters',
				},
				400
			);
		}
		const { message, code } = await updateCountry(name, iso, parseInt(id));
		return c.json({ message }, code as StatusCode);
	} catch (error) {
		return c.json({ message: 'Invalid request or server error' }, 500);
	}
});

// export default app
export default {
	port: 3001,
	fetch: app.fetch,
};
