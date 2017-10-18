import { logger } from '../common';
import vboxmanageService from './vboxmanage';

export default async function(name) {
	const stdout = await vboxmanageService('snapshot', name, 'list', '--machinereadable');
	const snapshotInfo = {};
	var snapshots = [], m
	for(const line of stdout.split('\n')) {
		const index = line.indexOf('=');
		if(index === -1) continue;
		const key = line.slice(0, index);
		try {
			if(key.startsWith("SnapshotName")) {
				m = JSON.parse(line.slice(index + 1));
				snapshots.push(m)
			}
		} catch(e) {
			// ignored intentionally
			// logger.warning('vmInfoService: Failed to parse property: %s', line);
		}
	}

	return snapshots;
}
