module.exports = {
	async filter(entries) {
		entries = entries.filter(entry => {
			if (entry.stationId == 1) entry.air_pressure = null;
			return true;
		});
		return entries;
	},
};