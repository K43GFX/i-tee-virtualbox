import { logger } from '../common';
import vboxmanageService from './vboxmanage';

export default async function(name, snapshotName, create) {
	// FIXME: should deletion be in separate service?

	const snapshotData = {};

	if(arguments.length < 3) {
		const stdout = await vboxmanageService('snapshot', name, 'take', snapshotName);

		for(const line of stdout.split('\n')) {
			if(line.indexOf('UUID') > -1) {
				const uuid = line.split(':')[1].replace(' ', '');
				snapshotData['snapshot-uuid'] = uuid;
				break;
			}
		}

		if(snapshotData['snapshot-uuid'] === undefined) {
			snapshotData['error'] = 'Hypervisor error';
		}

	} else {
		const stdout = await vboxmanageService('snapshot', name, 'delete', snapshotName);
		if(stdout == "") {
			snapshotData['status'] = "ok";
		}
	}

	return snapshotData;

}
