/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import prop from 'dot-prop';
import fs from 'fs';
import path from 'path';
import properties from 'properties';
import readJsonSync from 'read-json-sync';

export class Project {
	/**
	 * @param {string} projectDir project's path
	 */
	constructor(projectDir) {
		this._projectDir = projectDir;

		const npmbundlerrcPath = path.join(projectDir, '.npmbundlerrc');

		this._npmbundlerrc = fs.existsSync(npmbundlerrcPath)
			? readJsonSync(npmbundlerrcPath)
			: {};

		this._cachedLabels = {};
		this._cachedLocalizationFiles = undefined;
	}

	get supportsLocalization() {
		return this._localizationFiles !== undefined;
	}

	/**
	 * Get the array of available locales for the project
	 * @return {array|undefined}
	 */
	get availableLocales() {
		if (!this.supportsLocalization) {
			return undefined;
		}

		return Object.keys(this._localizationFiles).filter(
			locale => locale !== 'default'
		);
	}

	/**
	 *
	 * @param {string} locale
	 * @return {object|undefined}
	 */
	getLabels(locale = 'default') {
		if (!this.supportsLocalization) {
			return undefined;
		}

		if (this._cachedLabels[locale]) {
			return this._cachedLabels[locale];
		}

		const filePath = this._localizationFiles[locale];

		if (filePath) {
			this._cachedLabels[locale] = properties.parse(
				fs.readFileSync(filePath).toString()
			);
		} else {
			this._cachedLabels[locale] = {};
		}

		return this._cachedLabels[locale];
	}

	/**
	 * Get the list of localization files for the project indexed by locale
	 * abbreviation
	 * @param {string} localization base localization file name
	 * @return {object|undefined}
	 */
	get _localizationFiles() {
		const localizationFileBaseName = this._localizationFileBaseName;

		if (!localizationFileBaseName) {
			return undefined;
		}

		if (this._cachedLocalizationFiles) {
			return this._cachedLocalizationFiles;
		}

		const localizationDir = path.dirname(localizationFileBaseName);

		const files = fs.readdirSync(localizationDir);

		this._cachedLocalizationFiles = files.reduce(
			(map, file) => (
				(map[getLocale(file)] = path.join(localizationDir, file)), map
			),
			{}
		);

		return this._cachedLocalizationFiles;
	}

	get _localizationFileBaseName() {
		// TODO: merge bundler config into this module and obtain this value
		// from it
		let defaultValue = undefined;

		if (fs.existsSync('./features/localization/Language.properties')) {
			defaultValue = 'features/localization/Language';
		}

		return prop.get(
			this._npmbundlerrc,
			'create-jar.features.localization',
			defaultValue
		);
	}
}

export default new Project('.');

/**
 * Get the locale of a .properties file based on its name
 * @param {string} fileName
 * @return {string}
 */
function getLocale(fileName) {
	const start = fileName.indexOf('_');

	if (start === -1) {
		return 'default';
	}

	const end = fileName.lastIndexOf('.properties');

	return fileName.substring(start + 1, end);
}