import {
	sqliteTable,
	text,
	integer,
	real,
	uniqueIndex,
	index,
	primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const countriesTable = sqliteTable('countries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	iso: text('iso'),
});

export const countiesTable = sqliteTable(
	'counties',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		code: text('code').notNull(),
		countryId: integer('country_id').references(() => countriesTable.id),
	},
	(table) => ({
		countySlugCountryIndex: uniqueIndex('idx_county_slug_country').on(
			table.slug,
			table.countryId
		),
	})
);

export const districtsTable = sqliteTable(
	'districts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		code: text('code').notNull(),
		countyId: integer('county_id').references(() => countiesTable.id),
	},
	(table) => ({
		districtSlugCountyIndex: uniqueIndex('idx_district_slug_county').on(
			table.slug,
			table.countyId
		),
	})
);

export const wardsTable = sqliteTable(
	'wards',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		code: text('code').notNull(),
		districtId: integer('district_id').references(() => districtsTable.id),
	},
	(table) => ({
		wardSlugDistrictIndex: uniqueIndex('idx_ward_slug_district').on(
			table.slug,
			table.districtId
		),
	})
);

export const fourdigitsTable = sqliteTable('fourdigits', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
});

export const threedigitsTable = sqliteTable('threedigits', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
});

export const postcodesTable = sqliteTable(
	'postcodes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		fourdigitId: integer('fourdigit_id').references(() => fourdigitsTable.id),
		threedigitId: integer('threedigit_id').references(
			() => threedigitsTable.id
		),
		latitude: real('latitude').notNull(),
		longitude: real('longitude').notNull(),
		wardId: integer('ward_id').references(() => wardsTable.id),
	},
	(table) => ({
		postcodeIndex: uniqueIndex('idx_postcode').on(
			table.fourdigitId,
			table.threedigitId
		), //table.wardId
		postcodeFourDigitIndex: index('idx_postcodes_fourdigitId').on(
			table.fourdigitId
		),
		//postcodeThreeDigitIndex: index('idx_postcodes_threedigitId').on(table.threedigitId),
		postcodeWardIndex: index('idx_postcodes_wardId').on(table.wardId),
	})
);
