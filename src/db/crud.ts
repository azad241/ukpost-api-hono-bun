import { eq, and, or, like, sql, inArray, is } from 'drizzle-orm';
import {
	countriesTable,
	countiesTable,
	districtsTable,
	wardsTable,
	fourdigitsTable,
	threedigitsTable,
	postcodesTable,
} from './schema';
import { db } from './db';
import { HTTPException } from 'hono/http-exception';
import { MakeSlugify } from '../lib/functions';

//global functions

//read query start from here

// Get 4 digit post codes
export async function getFourPostcode(skip = 0, limit = 20, query = '') {
	if (query !== '') {
		return db
			.select()
			.from(fourdigitsTable)
			.where(like(fourdigitsTable.code, `%${query.toLowerCase()}%`))
			.limit(80);
	}
	return db.select().from(fourdigitsTable).offset(skip).limit(limit);
}

// Get 3 digit post codes
export async function getThreePostcode(
	fourdigit = '',
	skip = 0,
	limit = 20,
	query = ''
) {
	if (query !== '') {
		return db
			.select()
			.from(threedigitsTable)
			.where(like(threedigitsTable.code, `%${query.toLowerCase()}%`))
			.limit(80);
	}

	const fourdigitRecord = await db
		.select({ id: fourdigitsTable.id })
		.from(fourdigitsTable)
		.where(eq(fourdigitsTable.code, fourdigit))
		.limit(1);

	if (!fourdigitRecord.length) {
		throw new HTTPException(404, { message: 'Outcode not found' });
	}

	const threedigitIds = await db
		.select({ threedigitId: postcodesTable.threedigitId })
		.from(postcodesTable)
		.where(eq(postcodesTable.fourdigitId, fourdigitRecord[0].id))
		.groupBy(postcodesTable.threedigitId);

	const threedigitIdArray = threedigitIds
		.map((item) => item.threedigitId)
		.filter((id) => id !== null);

	if (!threedigitIds.length) {
		return [];
	}

	return db
		.select()
		.from(threedigitsTable)
		.where(inArray(threedigitsTable.id, threedigitIdArray))
		.offset(skip)
		.limit(limit);
}

// Get 7 digit postcode details
export async function getPostcodeDetails(fourdigit = '', threedigit = '') {
	const fourdigitRecord = await db
		.select()
		.from(fourdigitsTable)
		.where(eq(fourdigitsTable.code, fourdigit))
		.limit(1);

	if (!fourdigitRecord.length) {
		return [];
	}

	const threedigitRecord = await db
		.select()
		.from(threedigitsTable)
		.where(eq(threedigitsTable.code, threedigit))
		.limit(1);

	if (!threedigitRecord.length) {
		return [];
	}

	return db
		.select()
		.from(postcodesTable)
		.innerJoin(wardsTable, eq(postcodesTable.wardId, wardsTable.id))
		.innerJoin(districtsTable, eq(wardsTable.districtId, districtsTable.id))
		.innerJoin(countiesTable, eq(districtsTable.countyId, countiesTable.id))
		.innerJoin(countriesTable, eq(countiesTable.countryId, countriesTable.id))
		.where(
			and(
				eq(postcodesTable.fourdigitId, fourdigitRecord[0].id),
				eq(postcodesTable.threedigitId, threedigitRecord[0].id)
			)
		)
		.limit(1);
}

// Get postcodes by area
export async function getPostcodeByAreacode(
	skip: number,
	limit: number,
	slug: string
) {
	return db
		.select()
		.from(fourdigitsTable)
		.where(like(fourdigitsTable.code, `${slug}%`))
		.offset(skip)
		.limit(limit);
}

// Get county by country
export async function getCounty(country: string) {
	const countryResult = await db
		.select({
			id: countriesTable.id,
			name: countriesTable.name,
			iso: countriesTable.iso,
			slug: countriesTable.slug,
		})
		.from(countriesTable)
		.where(eq(countriesTable.slug, country))
		.limit(1);
	if (countryResult.length === 0) {
		return null;
	}

	const countryDetails = countryResult[0];
	const countiesResult = await db
		.select({
			code: countiesTable.code,
			name: countiesTable.name,
			slug: countiesTable.slug,
		})
		.from(countiesTable)
		.where(eq(countiesTable.countryId, countryDetails.id));
	return {
		...countryDetails,
		counties: countiesResult,
	};
}

// Get district by country/county
export async function getDistrict(country: string, county: string) {
	const countryRecord = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.slug, country))
		.limit(1);
	if (!countryRecord.length) {
		throw new HTTPException(404, { message: 'Country not found' });
	}
	const countyRecord = await db
		.select({
			id: countiesTable.id,
			code: countiesTable.code,
			name: countiesTable.name,
			slug: countiesTable.slug,
			countryId: countiesTable.countryId,
		})
		.from(countiesTable)
		.where(
			and(
				eq(countiesTable.slug, county),
				eq(countiesTable.countryId, countryRecord[0].id)
			)
		)
		.limit(1);

	if (!countyRecord.length) {
		throw new HTTPException(404, { message: 'County not found' });
	}
	const countyDetails = countyRecord[0];
	const districtsResult = await db
		.select({
			name: districtsTable.name,
			code: districtsTable.code,
			slug: districtsTable.slug,
		})
		.from(districtsTable)
		.where(eq(districtsTable.countyId, countyRecord[0].id));
	return {
		...countyDetails,
		districts: districtsResult,
	};
}

// Get ward by country/county/district
export async function getWard(
	country: string,
	county: string,
	district: string
) {
	const countryRecord = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.slug, country))
		.limit(1);
	if (!countryRecord.length) {
		throw new HTTPException(404, { message: 'Country not found' });
	}
	const countyRecord = await db
		.select()
		.from(countiesTable)
		.where(
			and(
				eq(countiesTable.slug, county),
				eq(countiesTable.countryId, countryRecord[0].id)
			)
		)
		.limit(1);

	if (!countyRecord.length) {
		throw new HTTPException(404, { message: 'County not found' });
	}
	const districtRecord = await db
		.select()
		.from(districtsTable)
		.where(
			and(
				eq(districtsTable.slug, district),
				eq(districtsTable.countyId, countyRecord[0].id)
			)
		)
		.limit(1);

	if (!districtRecord.length) {
		throw new HTTPException(404, { message: 'District not found' });
	}
	const districtDetails = districtRecord[0];

	const wardsResult = await db
		.select({
			name: wardsTable.name,
			slug: wardsTable.slug,
			code: wardsTable.code,
		})
		.from(wardsTable)
		.where(eq(wardsTable.districtId, districtDetails.id));
	return {
		...districtDetails,
		wards: wardsResult,
	};
}

// Get postcodes by country/county/district/ward
export async function getPostcodes(
	country: string,
	county: string,
	district: string,
	ward: string
) {
	// //Get country ID
	// const countryResult = await db.select({ id: countriesTable.id }).from(countriesTable)
	//   .where(eq(countriesTable.slug, country)).limit(1);
	// if (countryResult.length === 0) return null;
	// const countryId = countryResult[0].id;
	// //Get county ID
	// const countyResult = await db.select({ id: countiesTable.id }).from(countiesTable)
	// .where(and(eq(countiesTable.slug, county),eq(countiesTable.countryId, countryId) )).limit(1);
	// if (countyResult.length === 0) return null;
	// const countyId = countyResult[0].id;
	// //Get district ID
	// const districtResult = await db.select({ id: districtsTable.id }).from(districtsTable)
	// .where(and(eq(districtsTable.slug, district), eq(districtsTable.countyId, countyId))).limit(1);
	// if (districtResult.length === 0) return null;
	// const districtId = districtResult[0].id;
	// //Get ward details
	// const wardResult = await db.select({id: wardsTable.id,name: wardsTable.name,slug: wardsTable.slug,code: wardsTable.code})
	//   .from(wardsTable).where(and(eq(wardsTable.slug, ward),eq(wardsTable.districtId, districtId) )).limit(1);
	// if (wardResult.length === 0) return null;
	// const wardDetails = wardResult[0];
	const result = await db
		.select({
			id: wardsTable.id,
			name: wardsTable.name,
			slug: wardsTable.slug,
			code: wardsTable.code,
			districtId: wardsTable.districtId,
		})
		.from(wardsTable)
		.innerJoin(districtsTable, eq(wardsTable.districtId, districtsTable.id))
		.innerJoin(countiesTable, eq(districtsTable.countyId, countiesTable.id))
		.innerJoin(countriesTable, eq(countiesTable.countryId, countriesTable.id))
		.where(
			and(
				eq(countriesTable.slug, country),
				eq(countiesTable.slug, county),
				eq(districtsTable.slug, district),
				eq(wardsTable.slug, ward)
			)
		)
		.limit(1);
	if (!result.length) {
		return [];
	}

	const wardDetails = result[0];
	// Step 5: Get postcodes for the ward
	const postcodes = await db
		.select({
			fourdigit: {
				code: fourdigitsTable.code,
			},
			threedigit: {
				code: threedigitsTable.code,
			},
		})
		.from(postcodesTable)
		.innerJoin(
			fourdigitsTable,
			eq(postcodesTable.fourdigitId, fourdigitsTable.id)
		)
		.innerJoin(
			threedigitsTable,
			eq(postcodesTable.threedigitId, threedigitsTable.id)
		)
		.where(eq(postcodesTable.wardId, wardDetails.id));

	return {
		...wardDetails,
		postcodes,
	};
}

// Get search results
export async function getSearchResults(
	skip: number,
	limit: number,
	query: string,
	querytype: string
) {
	if (query === '') return [];
	const queryParts = query.toLowerCase().replace('-', ' ').split(' ');
	const query1 = queryParts[0] || '';
	const query2 = queryParts[1] || '';
	if (querytype === 'postcode') {
		const fourdigitResults = await db
			.select()
			.from(fourdigitsTable)
			.where(like(fourdigitsTable.code, `${query1}%`));
		if (!fourdigitResults.length) {
			return [];
		}
		const threedigitResults = await db
			.select()
			.from(threedigitsTable)
			.where(like(threedigitsTable.code, `${query2}%`));
		let conditions = [
			inArray(
				postcodesTable.fourdigitId,
				fourdigitResults.map((f) => f.id)
			),
		];
		if (query2 && threedigitResults.length) {
			conditions.push(
				inArray(
					postcodesTable.threedigitId,
					threedigitResults.map((t) => t.id)
				)
			);
		}
		return db
			.select({
				fourdigit: fourdigitsTable.code,
				threedigit: threedigitsTable.code,
			})
			.from(postcodesTable)
			.innerJoin(
				fourdigitsTable,
				eq(postcodesTable.fourdigitId, fourdigitsTable.id)
			)
			.innerJoin(
				threedigitsTable,
				eq(postcodesTable.threedigitId, threedigitsTable.id)
			)
			.where(and(...conditions))
			.offset(skip)
			.limit(limit);
	} else if (
		querytype === 'ward' ||
		querytype === 'district' ||
		querytype === 'county'
	) {
		return [];
	} else {
		return { error: 'Invalid query type' };
	}
}

//all post requests

// Add country
export async function addCountry(name: string, iso: string) {
	const record = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.slug, MakeSlugify(name)));
	if (record.length) {
		return { message: `Already exists, Country: ${name}`, code: 409 };
	} else {
		await db
			.insert(countriesTable)
			.values({ name, slug: MakeSlugify(name), iso });
		return { message: `Successfully added country: ${name}`, code: 200 };
	}
}

// Add county
export async function addCounty(name: string, code: string, countryId: number) {
	const county_record = await db
		.select()
		.from(countiesTable)
		.where(
			and(
				eq(countiesTable.slug, MakeSlugify(name)),
				eq(countiesTable.countryId, countryId)
			)
		);
	const country_record = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.id, countryId));
	if (county_record.length) {
		return { message: `Already exists, County: ${name}`, code: 409 };
	} else if (!country_record.length) {
		return { message: `countryId does not exists: ${countryId}`, code: 404 };
	} else {
		await db
			.insert(countiesTable)
			.values({ name, code, slug: MakeSlugify(name), countryId });
		return { message: `Successfully added county: ${name}`, code: 20 };
	}
}

// Add district
export async function addDistrict(
	name: string,
	code: string,
	countyId: number
) {
	const district_record = await db
		.select()
		.from(districtsTable)
		.where(
			and(
				eq(districtsTable.slug, MakeSlugify(name)),
				eq(districtsTable.countyId, countyId)
			)
		);
	const county_record = await db
		.select()
		.from(countiesTable)
		.where(eq(countiesTable.id, countyId));
	if (district_record.length) {
		return { message: `Already exists, District: ${name}`, code: 409 };
	} else if (!county_record.length) {
		return { message: `countyId does not exists: ${countyId}`, code: 404 };
	} else {
		await db
			.insert(districtsTable)
			.values({ name, code, slug: MakeSlugify(name), countyId });
		return { message: `Successfully added district: ${name}`, code: 200 };
	}
}

// Add ward
export async function addWard(name: string, code: string, districtId: number) {
	const ward_record = await db
		.select()
		.from(wardsTable)
		.where(
			and(
				eq(wardsTable.slug, MakeSlugify(name)),
				eq(wardsTable.districtId, districtId)
			)
		);
	const district_record = await db
		.select()
		.from(districtsTable)
		.where(eq(districtsTable.id, districtId));
	if (ward_record.length) {
		return { message: `Already exists, Ward: ${name}`, code: 409 };
	} else if (!district_record.length) {
		return { message: `districtId does not exists: ${districtId}`, code: 404 };
	} else {
		await db
			.insert(wardsTable)
			.values({ name, code, slug: MakeSlugify(name), districtId });
		return { message: `Successfully added ward: ${name}`, code: 200 };
	}
}

// Add four-digit code
export async function addFourDigit(code: string) {
	const record = await db
		.select()
		.from(fourdigitsTable)
		.where(eq(fourdigitsTable.code, code));
	if (record.length) {
		return { message: `Already exists, FourDigit: ${code}`, code: 409 };
	} else {
		await db.insert(fourdigitsTable).values({ code });
		return { message: `Successfully added FourDigit: ${code}`, code: 200 };
	}
}

// Add three-digit code
export async function addThreeDigit(code: string) {
	const record = await db
		.select()
		.from(threedigitsTable)
		.where(eq(threedigitsTable.code, code));
	if (record.length) {
		return { message: `Already exists, ThreeDigit: ${code}`, code: 409 };
	} else {
		await db.insert(threedigitsTable).values({ code });
		return { message: `Successfully added ThreeDigit: ${code}`, code: 200 };
	}
}

// Add postcode
export async function addPostcode(
	fourdigitId: number,
	threedigitId: number,
	wardId: number,
	latitude: any,
	longitude: any
) {
	const record = await db
		.select()
		.from(postcodesTable)
		.where(
			and(
				eq(postcodesTable.fourdigitId, fourdigitId),
				eq(postcodesTable.threedigitId, threedigitId),
				eq(postcodesTable.wardId, wardId)
			)
		);
	if (record.length) {
		return { message: `Postcode Already exists`, code: 409 };
	} else {
		await db
			.insert(postcodesTable)
			.values({ fourdigitId, threedigitId, wardId, latitude, longitude });
		return { message: `Successfully added postcode`, code: 200 };
	}
}

//1 update and 1 delete requests

//delete a country
export async function deleteCountry(id: number) {
	const country_record = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.id, id));
	if (!country_record.length) {
		return { message: `Country not found with ID: ${id}`, code: 404 };
	}
	const associate_record = await db
		.select()
		.from(countiesTable)
		.where(eq(countriesTable.id, id));
	if (associate_record.length) {
		return {
			message: `Cannot delete Country (id : ${id}). It's associated with County Table`,
			code: 409,
		};
	}
	await db.delete(countriesTable).where(eq(countriesTable.id, id));
	return { message: `Successfully deleted county with ID: ${id}`, code: 200 };
}
//update a country
export async function updateCountry(name: string, iso: string, id: number) {
	const country_record = await db
		.select()
		.from(countriesTable)
		.where(eq(countriesTable.id, id));
	if (!country_record.length) {
		return { message: `Country not found with ID: ${id}`, code: 409 };
	}
	const country = {
		name: name || country_record[0].name,
		slug: MakeSlugify(name) || country_record[0].slug,
		iso: iso || country_record[0].iso,
	};

	await db.update(countriesTable).set(country).where(eq(countriesTable.id, id));
	return { message: `Successfully deleted county with ID: ${id}`, code: 200 };
}
