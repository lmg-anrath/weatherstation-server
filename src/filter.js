module.exports = {
	async filter(entries) {
		// eslint-disable-next-line no-unused-vars
		entries = entries.filter(entry => {
			// if (entry.stationId == 1) entry.air_pressure = null;
			return true;
		});
		return entries;
	},
};