const path = require("path");
const { spawn } = require("child_process");
const { env } = require("../config/env");

const ML_ROOT = path.resolve(__dirname, "../../../ml/src");

function splitCommand(commandText) {
  return commandText.split(" ").filter(Boolean);
}

function runPythonScript(scriptName, payload) {
  return new Promise((resolve, reject) => {
    const [command, ...baseArgs] = splitCommand(env.pythonCommand);
    const scriptPath = path.join(ML_ROOT, scriptName);
    const child = spawn(command, [...baseArgs, scriptPath], {
      cwd: ML_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to start Python command "${env.pythonCommand}". ${error.message}`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `Python script ${scriptName} exited with code ${code}.`
          )
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new Error(
            `Invalid JSON returned by ${scriptName}. Output: ${stdout || stderr}`
          )
        );
      }
    });

    child.stdin.write(JSON.stringify(payload || {}));
    child.stdin.end();
  });
}

module.exports = { runPythonScript };
