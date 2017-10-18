import { logger } from '../common';
import vboxmanageService from './vboxmanage';

export default async function(name) {
	const stdout = await vboxmanageService('snapshot', name, 'list', '--machinereadable');

	var snapshots = [];
	var uuids = [];
	var names = [];

	for(const line of stdout.split('\n')) {
		const index = line.indexOf('=');
		if(index === -1) continue;
		const key = line.slice(0, index);
		try {

			if(key.startsWith("SnapshotName")) {
				names.push(JSON.parse(line.slice(index + 1)));
			} else if(key.startsWith("SnapshotUUID")) {
				uuids.push(JSON.parse(line.slice(index + 1)));
			}
		} catch(e) {
			// ignored intentionally
			// logger.warning('vmInfoService: Failed to parse property: %s', line);
		}
	}

	for(var i=0; i < uuids.length; i++) {
		const snap = {};
		snap['uuid'] = uuids[i];
		snap['name'] = names[i];
		snapshots.push(snap);
	}

	return snapshots;
}
