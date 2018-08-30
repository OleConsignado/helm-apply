#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { VCSGetter } = require('vcs-getter');
const { Installer } = require("vcs-hosted-k8s-helm-installer");
const fs = require('fs');
const yaml = require('js-yaml');
const os = require('os');
var path = require('path');

const optionDefinitions = [
	{ name: 'namespace', type: String },
	{ name: 'spec', type: String },
	{ name: 'conf', type: String },
	{ name: 'app', type: String },
	{ name: 'all', type: Boolean }
];

const options = commandLineArgs(optionDefinitions);

function completeSource(source, completeWith) {
	if(source.match(/^\$/)) {
		source = `${completeWith.trimRight('/')}/${source}`;
	}

	return source;
}

function getDefaultTfsCollection(vcsConf) {
	if(vcsConf.tfs.collections.length == 1) {
		return vcsConf.tfs.collections[0].url;
	}

	const defaultCollections = vcsConf.tfs.collections
		.filter(v => v.isDefaultCollection);

	if(defaultCollections.length >= 1) {
		return defaultCollections[0].url;
	}

	throw new Error("helm-apply -> Could not find TfsDefaultCollection, ensure that is at " +
		"least one item under tfs.collections with property 'isDefaultCollection' with value of 'true'");
}

async function applyApp(app, defaultTfsCollection) {
	console.info(`>> ${app.name} (${app.source})`);
	app.source = completeSource(app.source, defaultTfsCollection);
	await installer.installOrUpgrade(app);
}

async function main() {

	if(!options.namespace) {
		throw new Error("Missing parameter namespace (--namespace).");
	}

	if(!options.spec) {
		throw new Error("Missing parameter spec (--spec).");
	}

	if(!options.all && !options.app) {
		throw new Error("Missing parameter all or app (--all, --app=appname).");	
	}

	let confFilename = path.join(os.homedir(), '.helm-apply.yaml');
	let vcsConf;

	if(options.conf) {
		confFilename = options.conf;
	}

	if(fs.existsSync(confFilename)) {
		vcsConf = yaml.safeLoad(fs.readFileSync(confFilename, 'utf8'));
	} else {
		throw new Error(`helm-apply -> Could not read '${confFilename}'.`);
	}

	const defaultTfsCollection = getDefaultTfsCollection(vcsConf);

	if(fs.existsSync(options.spec))
	{
		const spec = yaml.safeLoad(fs.readFileSync(options.spec, 'utf8'));

		const installer = new Installer({
			namespace: options.namespace, 
			globalValues: spec.globalValues,
			vcsGetter: new VCSGetter(vcsConf)
		});

		try {
			if(options.all) {
				for(let i = 0; i < spec.apps.length; i++) {
					try {
						await applyApp(spec.apps[i], defaultTfsCollection);
					} catch(e) {
						console.error(`** ERROR while applying ${app.name}`);
						console.error(e);
					}
				}
			} else {
				var app = spec.apps.find(a => a.name == options.app);

				if(!app) {
					throw new Error(`helm-apply -> Could not find app '{options.app}'`);
				}

				await applyApp(app, defaultTfsCollection);
			}
		} finally {
			installer.dispose();
		}
	} else {
		throw new Error(`helm-apply -> Could not read '${options.spec}'.`);
	}
}

main().catch(e => console.error(e));