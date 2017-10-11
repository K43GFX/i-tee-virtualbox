import { logger } from '../common';
import vboxmanageService from './vboxmanage';

export default async function(name) {
	const stdout = await vboxmanageService('showvminfo', name, '--machinereadable');
	const vmInfo = {};
	for(const line of stdout.split('\n')) {
		const index = line.indexOf('=');
		if(index === -1) continue;
		const key = line.slice(0, index);
		try {
			vmInfo[key] = JSON.parse(line.slice(index + 1));
		} catch(e) {
			// ignored intentionally
			// logger.warning('vmInfoService: Failed to parse property: %s', line);
		}
	}

	const gueststdout = await vboxmanageService('guestproperty', 'get', name, '/VirtualBox/GuestInfo/Net/0/V4/IP')
		const response = gueststdout.split(':')[1];
		try {
			vmInfo['ipv4'] = response.split('\n')[0].replace(' ', '');

		} catch(e) {
			// ignored intentionally
			// logger.warning('vmInfoService: Failed to parse property: %s', line);
		}

	logger.debug('State of %s: ', name, {
		state: vmInfo['VMState'],
		'rdp-port': vmInfo['vrdeport'],
		'snapshot': vmInfo['CurrentSnapshotName'],
		'ip': vmInfo['ipv4']
	});

	const ret = {
		state: vmInfo['VMState']
	};

	if('vrdeport' in vmInfo && vmInfo['vrdeport'] > 0) {
		ret['rdp-port'] = vmInfo['vrdeport'];
	}

	if('GuestAdditionsVersion' in vmInfo) {
		ret['qaversion'] = vmInfo['GuestAdditionsVersion']
	}

	if('CurrentSnapshotName' in vmInfo) {
		ret.snapshot = vmInfo['CurrentSnapshotName'];
	}

	if('ipv4' in vmInfo) {
		ret['ipv4'] = vmInfo['ipv4']
	}

	return ret;
}
