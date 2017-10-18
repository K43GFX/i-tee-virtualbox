import { validate } from 'express-jsonschema';
import { Router } from 'express';
import { dmiExtraData } from './constants';
import { asyncMiddleware } from './util';
import { logger } from './common';
import vmListService from './services/vmList';
import vmCloneService from './services/vmClone';
import vmExtraDataService from './services/vmExtraData';
import vmInfoService from './services/vmInfo';
import vmNetworkService from './services/vmNetwork';
import vmStartService from './services/vmStart';
import vmPoweroffService from './services/vmPoweroff';
import vmDeleteService from './services/vmDelete';
import vmRdpUserService from './services/vmRdpUser';
import vmRdpService from './services/vmRdp';
import vmSnapshotService from './services/vmSnapshot';
import vmSnapshotListService from './services/vmSnapshotList';
const router = new Router;
export default router;

/**
 * @api {get} /machine List machines
 * @apiGroup Machine
 * @apiParam {string} [running] Query flag to only include running machines
 * @apiParam {string} [detailed] Query flag to include details in response
 * @apiSuccess {object[]} machine Array of machine objects
 * @apiSuccess {string} machine.id ID (name) of the machine
 * @apiSuccess {string} machine.name Same as machine ID
 * @apiSuccess {object} machine.state State of the machine
 * @apiSuccess {string} [machine.snapshot] Current snapshot name
 * @apiSuccess {number} machine.rdp-port RDP port if machine is running
 */
router.get('/machine', asyncMiddleware(async (req, res) => {
	const running = 'running' in req.query;
	const machines = await vmListService(running);

	if(!('detailed' in req.query)) {
		res.send(machines.map(m => ({ id: m })));
	} else {
		const details = await Promise.all(machines.map(m => vmInfoService(m)));
		for(let i = 0, l = machines.length; i < l; i++) {
			const vmInfo = details[i];
			vmInfo.id = vmInfo.name = machines[i];
		}
		res.send(details);
	}
}));

/**
 * @api {put} /machine/:machine Change state of machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 * @apiParam {string} [image] Template name used to create macine if it does not exist
 * @apiParam {string[]} [networks] Networks to be assigned to NIC-s
 * @apiParam {object} [dmi] DMI properties in `dmidecode` format
 * @apiParam {object} [rdp-username] RDP username
 * @apiParam {object} [rdp-password] RDP password
 * @apiParam {string} [state] State of the machine
 * @apiSuccess {object} machine
 * @apiSuccess {number} machine.rdp-port RDP port if machine was started
 */
router.put('/machine/:machine', validate({
	body: {
		"$schema": "http://json-schema.org/draft-04/schema#",
		"type": "object",
		"properties": {
			"dmi": { "type": "object" },
			"image": { "type": "string" },
			"networks": {
				"type": "array",
				"items": { "type": "string" }
			},
			"rdp-username": { "type": "string" },
			"rdp-password": { "type": "string" },
			"state": { "type": "string" }
		},
		"additionalProperties": false
	}
}), asyncMiddleware(async(req, res) => {

	const name = req.params.machine;

	async function doStuffWithMachine() {
		if('dmi' in req.body) {
			for(const propertyName in req.body.dmi) {
				const vboxPropertyName = dmiExtraData[propertyName];
				if(!vboxPropertyName) {
					logger.warn('Failed to lookup DMI property name %s', propertyName);
					continue;
				}
				await vmExtraDataService(name, vboxPropertyName, req.body.dmi[propertyName]);
			}
		}

		if('rdp-username' in req.body || `rdp-password` in req.body) {
			await vmRdpService(name, false);
			await vmRdpService(name, true);
		}

		if('rdp-username' in req.body && 'rdp-password' in req.body) {
			logger.debug('Setting RDP user for %s: username=%s password=%s', name, req.body['rdp-username'], req.body['rdp-password']);
			await vmRdpUserService(name, req.body['rdp-username'], req.body['rdp-password']);
		}

		if('networks' in req.body) {
			for(let i = 0; i < req.body.networks.length; i++) {
				await vmNetworkService(name, i, req.body.networks[i]);
			}
		}

		if('state' in req.body) {
			switch(req.body.state) {
				case 'stopped':
					await vmPoweroffService(name, true);
					break;
				case 'poweroff':
					await vmPoweroffService(name, false);
					break;
				case 'running':
					await vmStartService(name, true);
					break;
				case 'starting':
					await vmStartService(name, false);
					break;
				default:
					logger.debug('Bad machine state requested: %s', req.body.state);
			}
		}

		return await vmInfoService(name);
	}

	try {
		var vmInfo = await doStuffWithMachine();
	} catch(e) {
		if(e.vboxError !== 'Not found') {
			throw e;
		}

		if(!('image' in req.body)) {
			res.status(400).send({
				error: 'Bad request',
				message: 'Image name must be given in case of non-existing machine'
			});
			return;
		}

		const image = req.body.image;
		const imageInfo = await vmInfoService(image);

		if('snapshot' in imageInfo) {
			logger.debug('Cloning machine %s from image \'%s\' snapshot \'%s\'', name, image, imageInfo['snapshot']);
			await vmCloneService(name, image, imageInfo['snapshot']);
		} else {
			logger.debug('Cloning machine %s from image \'%s\'', name, image);
			await vmCloneService(name, image);
		}

		vmInfo = await doStuffWithMachine();
	}

	res.send({
		machine: vmInfo
	});
}));


/**
 * @api {get} /machine/:machine Retrieve information about machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 * @apiSuccess {object} machine.state State of the machine
 * @apiSuccess {string} [machine.snapshot] Current snapshot name
 * @apiSuccess {number} machine.rdp-port RDP port if machine is running
 */
router.get('/machine/:machine', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;
	const vmInfo = await vmInfoService(name);
	res.send({
		machine: vmInfo
	});
}));


/**
 * @api {delete} /machine/:machine Halt and delete machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 */
router.delete('/machine/:machine', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;

	await vmPoweroffService(name, false);
	await vmDeleteService(name);

	res.send({});
}));

/**
 * @api {get} /machine/:machine Retrieve snapshots of machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 * @apiSuccess {object} machine.state State of the machine
 * @apiSuccess {string} [machine.snapshot] Current snapshot name
 * @apiSuccess {number} machine.rdp-port RDP port if machine is running
 */
router.get('/machine/:machine/snapshots', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;
	const snapshotInfo = await vmSnapshotListService(name);
	res.send(snapshotInfo.map(m => ({ id: m })));
}));

/**
 * @api {post} /machine/:machine/snapshot/:snapshot Create new snapshot
 * @apiGroup Snapshot
 * @apiParam {object} machine Machine name
 * @apiParam {object} snapshot Snapshot name
 */
router.post('/machine/:machine/snapshot/:snapshot', asyncMiddleware(async(req, res) => {

	const name = req.params.machine;
	const snapshot = req.params.snapshot;

	const snapshotData = await vmSnapshotService(name, snapshot);

	res.send(snapshotData);
}));


/**
 * @api {delete} /machine/:machine/snapshot/:snapshot Delete snapshot
 * @apiGroup Snapshot
 * @apiParam {string} machine Machine name
 * @apiParam {string} snapshot Snapshot name
 */
router.delete('/machine/:machine/snapshot/:snapshot', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;
	const snapshot = req.params.snapshot;

	vmSnapshotService(name, snapshot, false);

	res.send({});
}));

