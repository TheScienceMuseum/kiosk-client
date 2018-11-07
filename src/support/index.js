import { Config } from './Config';
import { Logger } from './Logger';
import { Network } from './Network';
import { Package } from './Package';
import { Window } from './Window';

module.exports.Config = (new Config()).getConfig();
module.exports.Logger = (new Logger()).getLogger();
module.exports.Network = new Network();
module.exports.Window = Window;
module.exports.Package = Package;
