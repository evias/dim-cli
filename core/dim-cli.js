#!/usr/bin/env node

/**
 * Part of the dimcoin/dim-cli package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    dimcoin/dim-cli
 * @author     DIMCoin Developers
 * @license    MIT License
 * @copyright  (c) 2018, DIMCoin Developers
 * @link       https://github.com/dimcoin/dim-cli
 */
"use strict";

import ConsoleInput from "./console-input";
import DIMSchema from "../sdk/model/dim-schema";

var cli = require("commander"),
    fs  = require("fs"),
    chalk = require("chalk");

// get package information
var _package = JSON.parse(fs.readFileSync(__dirname + "/../package.json"));

// read available sub commands (prepare)
var _scripts = fs.readdirSync(__dirname + "/../scripts");
var _commands = {};
_scripts.forEach(function(filename) {
    if (!filename.match(/\.js$/))
        return false;

    var name = filename.replace(/\.js$/, '');
    _commands[name] = name;
});

/**
* The getScript function will require() the said script
* and make the Command class inside it available.
* 
* @param {String} input 
* @return {Command}
*/
var getScript = function(input) {
    if (!_commands.hasOwnProperty(input))
        return false;

    var cls = require(__dirname + "/../scripts/" + input + ".js").Command;
    var ioc = new cls(_package);
    return ioc;
};

const warning = chalk.red;
const keyword = chalk.yellow;
const label = chalk.green;
const normal = chalk.reset;
const log = console.log;

// configure command line interpreter
cli.version(_package.version)
    .usage("[options] <command> [arguments]");

// define basic `./dim-cli list` command
cli.command("list")
.description("List all available commands")
.action(function(env, opts) {

    log("");

    log("  " + label("Usage: ") + keyword("dim-cli <command> [options]"));
    log("");
    log("  " + label("Version: ") + keyword("v" + _package.version));
    log("");
    log("  " + label("Commands: "));
    log("");
    log("    " + keyword("list") + normal("\t\tList all available commands (Print this help message)"));
    log("    " + keyword("api <arguments>") + normal("\t\tSend HTTP API requests to NIS nodes"));
    log("    " + keyword("wallet <arguments>") + normal("\t\tHeadless DIM wallet implementation"));
    log("    " + keyword("finder <arguments>") + normal("\t\tDIM Token Holder Finder"));
    log("    " + keyword("crawler <arguments>") + normal("\t\tDIM Mosaic Holder Crawler"));
    log("    " + keyword("explorer <arguments>") + normal("\t\tDIM Explorer (alpha)"));
    log("    " + keyword("serve <arguments>") + normal("\t\tMake the DIM CLI command line tools suite available through a HTTP API. (not yet implemented)"));
    log("");
    log("  " + label("Options: "));
    log("");
    log("    " + keyword("-n, --node [node]") + normal("\t\tSet custom [node] for NIS API"));
    log("    " + keyword("-p, --port [port]") + normal("\t\tSet custom [port] for NIS API"));
    log("    " + keyword("-N, --network [network]") + normal("\t\tSet network (Mainnet|Testnet|Mijin)"));
    log("    " + keyword("-S, --force-ssl") + normal("\t\tUse SSL (HTTPS)"));
    log("    " + keyword("-d, --verbose") + normal("\t\tSet verbose command execution (more logs)"));
    log("");

    log("")
    log("  " + label("Credits To:"));
    log("");
    log("    " + label("Author: ") + normal(_package.author));

    if (_package.contributors && _package.contributors.length) {
        _package.contributors.forEach(function(contributor) {
            var contrib = contributor.name + (contributor.email ? "<" + contributor.email + ">" : "");
            log("    " + label("Contributor: ") + normal(contrib));
        });
    }
    log("");

    return ;
});

// Serve the DIM cli suite through a HTTP server
cli.command("serve")
.description("Make the DIM CLI command line tools suite available through a HTTP API.")
.action(function(env, opts) {
    //XXX
});

// defines commander commands for the available commands (scripts/*.js)
Object.getOwnPropertyNames(_commands)
  .forEach(function(command) {

    var cmd = getScript(command, cli);
    var sub = cli.command(cmd.getSignature())
        .description(cmd.getDescription());

    // register default subcommand options

    sub.option("-n, --node [node]", "Set custom [node] for NIS API", /(https?:\/\/)?([a-z0-9\-_\.]+):?([0-9]+)?/i)
       .option("-p, --port [port]", "Set custom [port] for NIS API", /^[0-9]+/)
       .option("-N, --network [network]", "Set network (Mainnet|Testnet|Mijin)", /^(mainnet|testnet|mijin)/i)
       .option("-S, --force-ssl", "Use SSL (HTTPS)")
       .option("-d, --verbose", "Set verbose command execution (more logs)");

    if (cmd.getOptions().length) {
        cmd.getOptions().forEach(function(option) {
            sub.option(option.signature, option.description, option.format ? option.format : undefined);
        });
    }

    sub.action(async function(opts) 
    {
        cmd.init(opts);
        return await cmd.run(opts);
    });
});

// always connect to DB first !
try {
    (async function() {
        let schema = DIMSchema.getInstance();
        let conn = await schema.initTables();

        cli.parse(process.argv);
    })();
}
catch(e) {
    console.error(e);
}
