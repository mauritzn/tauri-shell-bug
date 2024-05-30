import { exists } from "@tauri-apps/api/fs";
import { join, resolve, dirname } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api";
import { Timings } from "./Timings";

const { Command } = (window.__TAURI__ as any).shell;
const timings = new Timings("invoke", "execute", "events");

async function findPythonScript(): Promise<string> {
  let currentFolder = await resolve(".");
  if (currentFolder.endsWith("src-tauri")) {
    currentFolder = await dirname(currentFolder);
  }

  const pythonScript = await join(currentFolder, "__print_numbers.py");
  if ((await exists(pythonScript)) === true) {
    return pythonScript;
  } else {
    throw new Error(
      "Failed to find Python script (__print_numbers.py) in app directory!"
    );
  }
}

async function invokeProcess(pythonScriptPath: string) {
  console.log("Running python script (with invoke workaround)...");
  timings.reset("invoke");
  timings.start("invoke");

  try {
    const output = await invoke("print_py_numbers", { pythonScriptPath });
    timings.end("invoke");
    console.log(output);
    console.log(
      `Done (lines: ${(
        String(output).trim().split("\n").length - 2
      ).toLocaleString()}) [Took: ${timings.getResult("invoke")}]...`
    );
  } catch (err) {
    console.error(`command error: "${err}"`);
    timings.end("invoke");
  }
}

async function executeProcess(pythonScriptPath: string) {
  console.log("Running python script (with JS Command execute)...");
  timings.reset("execute");
  timings.start("execute");

  let process = await new Command("python-test", [pythonScriptPath]).execute();
  timings.end("execute");

  console.log(process.stdout);
  console.log(
    `Done (lines: ${(
      String(process.stdout)
        .trim()
        .replace(/[\n]{2,}/gi, "\n")
        .split("\n").length - 2
    ).toLocaleString()}) [Took: ${timings.getResult("execute")}]...`
  );
}

function eventProcess(pythonScriptPath: string) {
  return new Promise(async (resolve: (value: void) => void, reject) => {
    let process = new Command("python-test", [pythonScriptPath]);
    let outputLines: string[] = [];

    timings.reset("events");
    timings.start("events");

    process.on("close", (data: any) => {
      const outputString = outputLines.join("\n");
      timings.end("events");
      console.log(
        `command finished with code ${data.code} and signal ${data.signal}`,
        data
      );
      console.log(outputString);
      console.log(
        `Done (lines: ${(
          outputLines.length - 2
        ).toLocaleString()}) [Took: ${timings.getResult("events")}]...`
      );

      return resolve();
    });

    process.on("error", (error: any) => {
      console.error(`command error: "${error}"`);
      return reject(error);
    });

    process.stdout.on("data", (line: string) => {
      outputLines.push(line.trim());
      //console.log(line);
    });

    process.stderr.on("data", (line: string) => {
      console.log(`command stderr: "${line}"`);
    });

    console.log("Running python script (with JS Command events)...");
    const child = await process.spawn();
    console.log("pid:", child.pid);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  findPythonScript()
    .then((pythonScriptPath) => {
      const invokeWorkaroundFormEl = document.querySelector(
        "form#invokeWorkaroundForm"
      ) as HTMLFormElement | null;
      const executeFormEl = document.querySelector(
        "form#executeForm"
      ) as HTMLFormElement | null;
      const eventFormEl = document.querySelector(
        "form#eventForm"
      ) as HTMLFormElement | null;

      if (invokeWorkaroundFormEl) {
        const submitBtnEl = invokeWorkaroundFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          invokeWorkaroundFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            invokeProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#executeForm button" element!`);
        }
      } else {
        console.warn(`missing "form#invokeWorkaroundForm" element!`);
      }

      if (executeFormEl) {
        const submitBtnEl = executeFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          executeFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            executeProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#executeForm button" element!`);
        }
      } else {
        console.warn(`missing "form#executeForm" element!`);
      }

      if (eventFormEl) {
        const submitBtnEl = eventFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          eventFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            eventProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#eventFormEl button" element!`);
        }
      } else {
        console.warn(`missing "form#eventFormEl" element!`);
      }
    })
    .catch((err) => console.error(err));
});
