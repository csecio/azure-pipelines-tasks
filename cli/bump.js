var fs = require('fs');
var path = require('path');

var util = require('../make-util');

var fail = util.fail;

var consts = require('./consts');

function verifyAllAgentPluginTasksAreInSkipList(argv) {
    var missingTaskNames = [];

    argv.taskList.forEach(function (taskName) {
        // load files
        var taskJsonPath = path.join(consts.tasksPath, taskName, 'task.json');
        var taskJson = JSON.parse(fs.readFileSync(taskJsonPath));

        if (taskJson.execution && taskJson.execution.AgentPlugin) {
            if (consts.agentPluginTaskNames.indexOf(taskJson.name) === -1 && missingTaskNames.indexOf(taskJson.name) === -1) {
                missingTaskNames.push(taskJson.name);
            }
        }
    });

    if (missingTaskNames.length > 0) {
        fail('The following tasks must be added to agentPluginTaskNames: ' + JSON.stringify(missingTaskNames));
    }
}

/**
 * Used to bump the patch version in task.json files
 * @param {*} argv
 */
function bump(argv) {
    verifyAllAgentPluginTasksAreInSkipList(argv.taskList);

    argv.taskList.forEach(function (taskName) {
        // load files
        var taskJsonPath = path.join(consts.tasksPath, taskName, 'task.json');
        var taskJson = JSON.parse(fs.readFileSync(taskJsonPath));

        var taskLocJsonPath = path.join(consts.tasksPath, taskName, 'task.loc.json');
        var taskLocJson = JSON.parse(fs.readFileSync(taskLocJsonPath));

        // skip agent plugin tasks
        if (consts.agentPluginTaskNames.indexOf(taskJson.name) > -1) {
            return;
        }

        if (typeof taskJson.version.Patch != 'number') {
            fail(`Error processing '${taskName}'. version.Patch should be a number.`);
        }

        taskJson.version.Patch = taskJson.version.Patch + 1;
        taskLocJson.version.Patch = taskLocJson.version.Patch + 1;

        fs.writeFileSync(taskJsonPath, JSON.stringify(taskJson, null, 4));
        fs.writeFileSync(taskLocJsonPath, JSON.stringify(taskLocJson, null, 2));

        // Check that task.loc and task.loc.json versions match
        if ((taskJson.version.Major !== taskLocJson.version.Major) ||
            (taskJson.version.Minor !== taskLocJson.version.Minor) ||
            (taskJson.version.Patch !== taskLocJson.version.Patch)) {
            console.log(`versions dont match for task '${taskName}', task json: ${JSON.stringify(taskJson.version)} task loc json: ${JSON.stringify(taskLocJson.version)}`);
        }
    });
}

module.exports = bump;